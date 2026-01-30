const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  linkMoodle,
  registerValidation,
  loginValidation
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter, apiLimiter } = require('../middleware/rateLimit');

// Public routes with strict rate limiting
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);

// Protected routes with standard rate limiting
router.get('/me', apiLimiter, protect, getMe);
router.post('/link-moodle', apiLimiter, protect, linkMoodle);

module.exports = router;
