const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { content, images, visibility, tags, moodleCourseId } = req.body;

    // Extract mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentionUsernames = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionUsernames.push(match[1]);
    }

    // Find mentioned users
    const mentionedUsers = await User.find({ 
      username: { $in: mentionUsernames } 
    });

    const post = await Post.create({
      author: req.user._id,
      content,
      images: images || [],
      visibility: visibility || 'public',
      tags: tags || [],
      mentions: mentionedUsers.map(u => u._id),
      moodleCourseId
    });

    // Create notifications for mentions
    for (const mentionedUser of mentionedUsers) {
      if (!mentionedUser._id.equals(req.user._id)) {
        await Notification.create({
          recipient: mentionedUser._id,
          sender: req.user._id,
          type: 'mention',
          post: post._id,
          content: `${req.user.username} mentioned you in a post`
        });
      }
    }

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar firstName lastName')
      .populate('mentions', 'username');

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get news feed (posts from followed users)
// @route   GET /api/posts/feed
// @access  Private
exports.getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Get posts from users the current user follows + own posts
    const following = [...req.user.following, req.user._id];

    const posts = await Post.find({
      author: { $in: following },
      isDeleted: false,
      $or: [
        { visibility: 'public' },
        { visibility: 'followers' },
        { author: req.user._id }
      ]
    })
      .populate('author', 'username avatar firstName lastName')
      .populate({
        path: 'comments',
        options: { limit: 3, sort: { createdAt: -1 } },
        populate: { path: 'author', select: 'username avatar' }
      })
      .populate('originalPost')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({
      author: { $in: following },
      isDeleted: false
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get explore posts (public posts)
// @route   GET /api/posts/explore
// @access  Public
exports.getExplorePosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({
      visibility: 'public',
      isDeleted: false
    })
      .populate('author', 'username avatar firstName lastName')
      .populate({
        path: 'comments',
        options: { limit: 3, sort: { createdAt: -1 } },
        populate: { path: 'author', select: 'username avatar' }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({
      visibility: 'public',
      isDeleted: false
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar firstName lastName')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username avatar firstName lastName' }
      })
      .populate('mentions', 'username')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'username avatar firstName lastName' }
      });

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    const { content, visibility, tags } = req.body;

    let post = await Post.findById(req.params.id);

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    post.content = content || post.content;
    post.visibility = visibility || post.visibility;
    post.tags = tags || post.tags;
    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    post = await Post.findById(post._id)
      .populate('author', 'username avatar firstName lastName');

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.author.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Soft delete
    post.isDeleted = true;
    await post.save();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already liked
    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this post'
      });
    }

    post.likes.push(req.user._id);
    await post.save();

    // Create notification (if not own post)
    if (!post.author.equals(req.user._id)) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'like',
        post: post._id,
        content: `${req.user.username} liked your post`
      });
    }

    res.json({
      success: true,
      message: 'Post liked',
      likeCount: post.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Unlike a post
// @route   DELETE /api/posts/:id/like
// @access  Private
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if not liked
    if (!post.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have not liked this post'
      });
    }

    post.likes = post.likes.filter(id => !id.equals(req.user._id));
    await post.save();

    res.json({
      success: true,
      message: 'Post unliked',
      likeCount: post.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Share a post
// @route   POST /api/posts/:id/share
// @access  Private
exports.sharePost = async (req, res) => {
  try {
    const { content } = req.body;
    const originalPost = await Post.findById(req.params.id);

    if (!originalPost || originalPost.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (originalPost.visibility !== 'public') {
      return res.status(403).json({
        success: false,
        message: 'Cannot share non-public posts'
      });
    }

    // Create shared post
    const sharedPost = await Post.create({
      author: req.user._id,
      content: content || '',
      originalPost: originalPost._id,
      isShared: true,
      visibility: 'public'
    });

    // Add to original post's shares
    originalPost.shares.push({
      user: req.user._id,
      sharedAt: new Date()
    });
    await originalPost.save();

    // Create notification
    if (!originalPost.author.equals(req.user._id)) {
      await Notification.create({
        recipient: originalPost.author,
        sender: req.user._id,
        type: 'share',
        post: originalPost._id,
        content: `${req.user.username} shared your post`
      });
    }

    const populatedPost = await Post.findById(sharedPost._id)
      .populate('author', 'username avatar firstName lastName')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'username avatar firstName lastName' }
      });

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get posts by course (Moodle integration)
// @route   GET /api/posts/course/:courseId
// @access  Private
exports.getCoursePosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({
      moodleCourseId: parseInt(req.params.courseId),
      isDeleted: false
    })
      .populate('author', 'username avatar firstName lastName')
      .populate({
        path: 'comments',
        options: { limit: 3, sort: { createdAt: -1 } },
        populate: { path: 'author', select: 'username avatar' }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({
      moodleCourseId: parseInt(req.params.courseId),
      isDeleted: false
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search posts
// @route   GET /api/posts/search
// @access  Public
exports.searchPosts = async (req, res) => {
  try {
    const { q, tag, page = 1, limit = 10 } = req.query;

    let query = {
      isDeleted: false,
      visibility: 'public'
    };

    if (q) {
      query.$text = { $search: q };
    }

    if (tag) {
      query.tags = tag;
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
