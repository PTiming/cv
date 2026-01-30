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
// Note: Moodle credentials are used only for authentication and are not stored.
// Ensure MOODLE_URL in .env uses HTTPS to protect credentials in transit.
router.post('/link-moodle', auth, [
  body('moodleUsername')
    .notEmpty()
    .withMessage('Moodle username is required')
    .trim(),
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

// ==================== 2FA Routes ====================

// @route   POST /api/auth/2fa/setup
// @desc    Setup 2FA - Generate secret and QR code
router.post('/2fa/setup', auth, authController.setup2FA);

// @route   POST /api/auth/2fa/enable
// @desc    Enable 2FA after verifying setup code
router.post('/2fa/enable', auth, [
  body('code')
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Code must be 6 digits'),
  validate
], authController.enable2FA);

// @route   POST /api/auth/2fa/disable
// @desc    Disable 2FA
router.post('/2fa/disable', auth, [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('code')
    .notEmpty()
    .withMessage('2FA code is required'),
  validate
], authController.disable2FA);

// @route   POST /api/auth/2fa/verify
// @desc    Verify 2FA code during login
router.post('/2fa/verify', [
  body('tempToken')
    .notEmpty()
    .withMessage('Token is required'),
  body('code')
    .notEmpty()
    .withMessage('Verification code is required'),
  validate
], authController.verify2FA);

// @route   GET /api/auth/2fa/status
// @desc    Get 2FA status
router.get('/2fa/status', auth, authController.get2FAStatus);

// @route   POST /api/auth/2fa/backup-codes
// @desc    Regenerate backup codes
router.post('/2fa/backup-codes', auth, [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('code')
    .notEmpty()
    .withMessage('2FA code is required'),
  validate
], authController.regenerateBackupCodes);

module.exports = router;
