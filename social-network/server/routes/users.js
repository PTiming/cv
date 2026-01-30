const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { auth, optionalAuth } = require('../middleware/auth');
const userController = require('../controllers/userController');

// @route   GET /api/users/search
router.get('/search', userController.searchUsers);

// @route   GET /api/users/suggestions
router.get('/suggestions', auth, userController.getSuggestions);

// @route   GET /api/users/:username
router.get('/:username', optionalAuth, userController.getUserProfile);

// @route   PUT /api/users/profile
router.put('/profile', auth, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please enter a valid URL'),
  validate
], userController.updateProfile);

// @route   POST /api/users/:username/follow
router.post('/:username/follow', auth, userController.followUser);

// @route   DELETE /api/users/:username/follow
router.delete('/:username/follow', auth, userController.unfollowUser);

// @route   GET /api/users/:username/followers
router.get('/:username/followers', userController.getFollowers);

// @route   GET /api/users/:username/following
router.get('/:username/following', userController.getFollowing);

// @route   GET /api/users/:username/posts
router.get('/:username/posts', optionalAuth, userController.getUserPosts);

module.exports = router;
