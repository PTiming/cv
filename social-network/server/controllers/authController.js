const jwt = require('jsonwebtoken');
const User = require('../models/User');
const moodleService = require('../services/moodleService');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: user.toPublicProfile()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: user.toPublicProfile()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username avatar firstName lastName')
      .populate('following', 'username avatar firstName lastName');

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

// @desc    Link Moodle account
// @route   POST /api/auth/link-moodle
// @access  Private
exports.linkMoodle = async (req, res) => {
  try {
    const { moodleUsername, moodlePassword } = req.body;

    // Authenticate with Moodle
    const moodleAuth = await moodleService.authenticateUser(
      moodleUsername, 
      moodlePassword
    );

    if (!moodleAuth.token) {
      return res.status(400).json({
        success: false,
        message: 'Failed to authenticate with Moodle'
      });
    }

    // Get Moodle user info
    const siteInfo = await moodleService.getSiteInfo(moodleAuth.token);

    // Update user with Moodle data
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        moodleUserId: siteInfo.userid,
        moodleToken: moodleAuth.token,
        moodleLinked: true
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Moodle account linked successfully',
      data: {
        moodleUserId: siteInfo.userid,
        moodleUsername: siteInfo.username,
        moodleFullname: siteInfo.fullname
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to link Moodle account'
    });
  }
};

// @desc    Unlink Moodle account
// @route   POST /api/auth/unlink-moodle
// @access  Private
exports.unlinkMoodle = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      moodleUserId: null,
      moodleToken: null,
      moodleLinked: false
    });

    res.json({
      success: true,
      message: 'Moodle account unlinked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
exports.refreshToken = async (req, res) => {
  try {
    const token = generateToken(req.user._id);

    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: { token }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
