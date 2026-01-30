const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const moodleService = require('../services/moodleService');
const config = require('../config');

// Validation rules
const registerValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'student'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
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

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          moodleUserId: user.moodleUserId
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

/**
 * @desc    Link user account to Moodle
 * @route   POST /api/auth/link-moodle
 * @access  Private
 */
const linkMoodle = async (req, res) => {
  try {
    const { moodleUserId } = req.body;

    if (!moodleUserId) {
      return res.status(400).json({
        success: false,
        message: 'Moodle user ID is required'
      });
    }

    // Verify Moodle user exists
    const moodleUser = await moodleService.getUserById(moodleUserId);
    if (!moodleUser) {
      return res.status(404).json({
        success: false,
        message: 'Moodle user not found'
      });
    }

    // Update user with Moodle ID
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        moodleUserId,
        firstName: moodleUser.firstname || req.user.firstName,
        lastName: moodleUser.lastname || req.user.lastName
      },
      { new: true }
    );

    res.json({
      success: true,
      data: user,
      message: 'Moodle account linked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error linking Moodle account',
      error: error.message
    });
  }
};

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

module.exports = {
  register,
  login,
  getMe,
  linkMoodle,
  registerValidation,
  loginValidation
};
