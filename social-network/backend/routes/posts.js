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

const router = express.Router();

// @route   POST /api/posts
router.post(
  '/',
  auth,
  [body('content', 'Content is required').notEmpty()],
  createPost
);

// @route   GET /api/posts
router.get('/', auth, getPosts);

// @route   GET /api/posts/:id
router.get('/:id', auth, getPost);

// @route   DELETE /api/posts/:id
router.delete('/:id', auth, deletePost);

// @route   PUT /api/posts/:id/like
router.put('/:id/like', auth, likePost);

// @route   POST /api/posts/:id/comments
router.post(
  '/:id/comments',
  auth,
  [body('text', 'Comment text is required').notEmpty()],
  addComment
);

// @route   DELETE /api/posts/:id/comments/:commentId
router.delete('/:id/comments/:commentId', auth, deleteComment);

module.exports = router;
