const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter, generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// @route   POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  [
    body('name', 'Name is required').notEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  register
);

// @route   POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  login
);

// @route   GET /api/auth/me
router.get('/me', generalLimiter, auth, getMe);

module.exports = router;
