const express = require('express');
const {
  getUserProfile,
  updateProfile,
  followUser,
  getUserPosts,
  searchUsers
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// @route   GET /api/users/search
router.get('/search', generalLimiter, auth, searchUsers);

// @route   GET /api/users/:id
router.get('/:id', generalLimiter, auth, getUserProfile);

// @route   PUT /api/users/profile
router.put('/profile', generalLimiter, auth, updateProfile);

// @route   PUT /api/users/:id/follow
router.put('/:id/follow', generalLimiter, auth, followUser);

// @route   GET /api/users/:id/posts
router.get('/:id/posts', generalLimiter, auth, getUserPosts);

module.exports = router;
