const express = require('express');
const {
  getUserProfile,
  updateProfile,
  followUser,
  getUserPosts,
  searchUsers
} = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/search
router.get('/search', auth, searchUsers);

// @route   GET /api/users/:id
router.get('/:id', auth, getUserProfile);

// @route   PUT /api/users/profile
router.put('/profile', auth, updateProfile);

// @route   PUT /api/users/:id/follow
router.put('/:id/follow', auth, followUser);

// @route   GET /api/users/:id/posts
router.get('/:id/posts', auth, getUserPosts);

module.exports = router;
