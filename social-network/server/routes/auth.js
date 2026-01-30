const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const authController = require('../controllers/authController');

// @route   POST /api/auth/register
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  validate
], authController.register);

// @route   POST /api/auth/login
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
], authController.login);

// @route   GET /api/auth/me
router.get('/me', auth, authController.getMe);

// @route   POST /api/auth/link-moodle
router.post('/link-moodle', auth, [
  body('moodleUsername')
    .notEmpty()
    .withMessage('Moodle username is required'),
  body('moodlePassword')
    .notEmpty()
    .withMessage('Moodle password is required'),
  validate
], authController.linkMoodle);

// @route   POST /api/auth/unlink-moodle
router.post('/unlink-moodle', auth, authController.unlinkMoodle);

// @route   POST /api/auth/refresh
router.post('/refresh', auth, authController.refreshToken);

// @route   POST /api/auth/logout
router.post('/logout', auth, authController.logout);

// @route   PUT /api/auth/change-password
router.put('/change-password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  validate
], authController.changePassword);

module.exports = router;
