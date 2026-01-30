const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Add comment to post
// @route   POST /api/posts/:postId/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Extract mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentionUsernames = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionUsernames.push(match[1]);
    }

    const mentionedUsers = await User.find({ 
      username: { $in: mentionUsernames } 
    });

    const commentData = {
      post: post._id,
      author: req.user._id,
      content,
      mentions: mentionedUsers.map(u => u._id)
    };

    // Handle reply to another comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
      commentData.parentComment = parentCommentId;
    }

    const comment = await Comment.create(commentData);

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // Update parent comment's replies
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id }
      });

      // Notify parent comment author
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment.author.equals(req.user._id)) {
        await Notification.create({
          recipient: parentComment.author,
          sender: req.user._id,
          type: 'reply',
          post: post._id,
          comment: comment._id,
          content: `${req.user.username} replied to your comment`
        });
      }
    }

    // Notify post author
    if (!post.author.equals(req.user._id)) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        comment: comment._id,
        content: `${req.user.username} commented on your post`
      });
    }

    // Notify mentioned users
    for (const mentionedUser of mentionedUsers) {
      if (!mentionedUser._id.equals(req.user._id)) {
        await Notification.create({
          recipient: mentionedUser._id,
          sender: req.user._id,
          type: 'mention',
          post: post._id,
          comment: comment._id,
          content: `${req.user.username} mentioned you in a comment`
        });
      }
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username avatar firstName lastName')
      .populate('mentions', 'username');

    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:postId/comments
// @access  Public
exports.getComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const post = await Post.findById(req.params.postId);

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get top-level comments only (no parent)
    const comments = await Comment.find({ 
      post: post._id, 
      parentComment: null,
      isDeleted: false 
    })
      .populate('author', 'username avatar firstName lastName')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'username avatar firstName lastName' }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({ 
      post: post._id, 
      parentComment: null,
      isDeleted: false 
    });

    res.json({
      success: true,
      data: comments,
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

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;

    let comment = await Comment.findById(req.params.id);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    comment = await Comment.findById(comment._id)
      .populate('author', 'username avatar firstName lastName');

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (!comment.author.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete
    comment.isDeleted = true;
    await comment.save();

    // Remove from post's comments array
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like a comment
// @route   POST /api/comments/:id/like
// @access  Private
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this comment'
      });
    }

    comment.likes.push(req.user._id);
    await comment.save();

    res.json({
      success: true,
      message: 'Comment liked',
      likeCount: comment.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Unlike a comment
// @route   DELETE /api/comments/:id/like
// @access  Private
exports.unlikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (!comment.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have not liked this comment'
      });
    }

    comment.likes = comment.likes.filter(id => !id.equals(req.user._id));
    await comment.save();

    res.json({
      success: true,
      message: 'Comment unliked',
      likeCount: comment.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
