const User = require('../models/User');
const MoodleService = require('../services/moodleService');

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Create user
    const user = await User.create({
      username,
      email,
      password
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Connect user to Moodle
 * @route   POST /api/auth/connect-moodle
 * @access  Private
 */
exports.connectMoodle = async (req, res) => {
  try {
    const { moodleToken } = req.body;

    if (!moodleToken) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a Moodle token'
      });
    }

    // Verify token by getting site info
    const moodleService = new MoodleService(moodleToken);
    const siteInfo = await moodleService.getSiteInfo();

    // Update user with Moodle info
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        moodleToken,
        moodleUserId: siteInfo.userid
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        user,
        moodleSiteInfo: {
          sitename: siteInfo.sitename,
          username: siteInfo.username,
          userid: siteInfo.userid
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      moodleUserId: user.moodleUserId
    }
  });
};
