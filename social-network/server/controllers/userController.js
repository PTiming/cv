const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Get user profile by username
// @route   GET /api/users/:username
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username avatar firstName lastName')
      .populate('following', 'username avatar firstName lastName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'bio', 'location', 
      'website', 'dateOfBirth', 'avatar'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: user.toPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Follow a user
// @route   POST /api/users/:username/follow
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findOne({ username: req.params.username });

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userToFollow._id.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if already following
    if (req.user.following.includes(userToFollow._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    // Add to following list
    await User.findByIdAndUpdate(req.user._id, {
      $push: { following: userToFollow._id }
    });

    // Add to followers list
    await User.findByIdAndUpdate(userToFollow._id, {
      $push: { followers: req.user._id }
    });

    // Create notification
    await Notification.create({
      recipient: userToFollow._id,
      sender: req.user._id,
      type: 'follow',
      content: `${req.user.username} started following you`
    });

    res.json({
      success: true,
      message: `You are now following ${userToFollow.username}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:username/follow
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findOne({ username: req.params.username });

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!req.user.following.includes(userToUnfollow._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this user'
      });
    }

    // Remove from following list
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { following: userToUnfollow._id }
    });

    // Remove from followers list
    await User.findByIdAndUpdate(userToUnfollow._id, {
      $pull: { followers: req.user._id }
    });

    res.json({
      success: true,
      message: `You have unfollowed ${userToUnfollow.username}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:username/followers
// @access  Public
exports.getFollowers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findOne({ username: req.params.username })
      .populate({
        path: 'followers',
        select: 'username avatar firstName lastName bio',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.followers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.followers.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's following
// @route   GET /api/users/:username/following
// @access  Public
exports.getFollowing = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findOne({ username: req.params.username })
      .populate({
        path: 'following',
        select: 'username avatar firstName lastName bio',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.following,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.following.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
      .select('username avatar firstName lastName bio')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    });

    res.json({
      success: true,
      data: users,
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

// @desc    Get user's posts
// @route   GET /api/users/:username/posts
// @access  Public
exports.getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const posts = await Post.find({ 
      author: user._id, 
      isDeleted: false 
    })
      .populate('author', 'username avatar firstName lastName')
      .populate({
        path: 'comments',
        options: { limit: 3 },
        populate: { path: 'author', select: 'username avatar' }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ 
      author: user._id, 
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

// @desc    Get suggested users to follow
// @route   GET /api/users/suggestions
// @access  Private
exports.getSuggestions = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Get users that the current user is not following
    const users = await User.find({
      _id: { $ne: req.user._id, $nin: req.user.following },
      isActive: true
    })
      .select('username avatar firstName lastName bio followers')
      .sort({ followers: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
