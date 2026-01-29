const express = require('express');
const { body } = require('express-validator');
const {
  createPost,
  getPosts,
  getPost,
  deletePost,
  likePost,
  addComment,
  deleteComment
} = require('../controllers/postController');
const auth = require('../middleware/auth');
const { generalLimiter, createLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// @route   POST /api/posts
router.post(
  '/',
  createLimiter,
  auth,
  [body('content', 'Content is required').notEmpty()],
  createPost
);

// @route   GET /api/posts
router.get('/', generalLimiter, auth, getPosts);

// @route   GET /api/posts/:id
router.get('/:id', generalLimiter, auth, getPost);

// @route   DELETE /api/posts/:id
router.delete('/:id', generalLimiter, auth, deletePost);

// @route   PUT /api/posts/:id/like
router.put('/:id/like', generalLimiter, auth, likePost);

// @route   POST /api/posts/:id/comments
router.post(
  '/:id/comments',
  createLimiter,
  auth,
  [body('text', 'Comment text is required').notEmpty()],
  addComment
);

// @route   DELETE /api/posts/:id/comments/:commentId
router.delete('/:id/comments/:commentId', generalLimiter, auth, deleteComment);

module.exports = router;
