const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { ROLES, canManageRole } = require('../config/rbac');

// @desc    Get all users (with pagination and filters)
// @route   GET /api/admin/users
// @access  Private (Admin, Moderator)
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'banned') {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const users = await User.find(query)
      .select('-password -moodleToken')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

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

// @desc    Get user by ID (detailed)
// @route   GET /api/admin/users/:id
// @access  Private (Admin, Moderator)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -moodleToken')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional stats
    const postsCount = await Post.countDocuments({ author: user._id, isDeleted: false });
    const commentsCount = await Comment.countDocuments({ author: user._id, isDeleted: false });

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats: {
          postsCount,
          commentsCount,
          followersCount: user.followers.length,
          followingCount: user.following.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check role hierarchy
    if (!canManageRole(req.user.role, targetUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify a user with equal or higher role'
      });
    }

    // Prevent assigning a role higher than your own
    if (!canManageRole(req.user.role, role) && req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Cannot assign a role higher than your own'
      });
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: targetUser.toPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Ban user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin, Moderator)
exports.banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check role hierarchy
    if (!canManageRole(req.user.role, targetUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot ban a user with equal or higher role'
      });
    }

    targetUser.isActive = false;
    targetUser.banReason = reason || 'Violation of community guidelines';
    targetUser.bannedAt = new Date();
    targetUser.bannedBy = req.user._id;
    await targetUser.save();

    res.json({
      success: true,
      message: 'User has been banned',
      data: {
        userId: targetUser._id,
        username: targetUser.username,
        banReason: targetUser.banReason
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Unban user
// @route   PUT /api/admin/users/:id/unban
// @access  Private (Admin, Moderator)
exports.unbanUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    targetUser.isActive = true;
    targetUser.banReason = undefined;
    targetUser.bannedAt = undefined;
    targetUser.bannedBy = undefined;
    await targetUser.save();

    res.json({
      success: true,
      message: 'User has been unbanned',
      data: {
        userId: targetUser._id,
        username: targetUser.username
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check role hierarchy
    if (!canManageRole(req.user.role, targetUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete a user with equal or higher role'
      });
    }

    // Soft delete user's content
    await Post.updateMany({ author: targetUser._id }, { isDeleted: true });
    await Comment.updateMany({ author: targetUser._id }, { isDeleted: true });

    // Delete user
    await targetUser.deleteOne();

    res.json({
      success: true,
      message: 'User and associated content have been deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin, Moderator)
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalPosts,
      totalComments,
      moodleLinkedUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Post.countDocuments({ isDeleted: false }),
      Comment.countDocuments({ isDeleted: false }),
      User.countDocuments({ moodleLinked: true })
    ]);

    // Get users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get posts per day for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const postsPerDay = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers,
          moodleLinked: moodleLinkedUsers,
          recentSignups,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        content: {
          totalPosts,
          totalComments,
          postsPerDay
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
