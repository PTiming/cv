const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { auth, optionalAuth } = require('../middleware/auth');
const { createPostLimiter, commentLimiter } = require('../middleware/rateLimiter');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');

// @route   GET /api/posts/feed
router.get('/feed', auth, postController.getFeed);

// @route   GET /api/posts/explore
router.get('/explore', optionalAuth, postController.getExplorePosts);

// @route   GET /api/posts/search
router.get('/search', postController.searchPosts);

// @route   GET /api/posts/course/:courseId
router.get('/course/:courseId', auth, postController.getCoursePosts);

// @route   POST /api/posts
router.post('/', auth, createPostLimiter, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Post content must be between 1 and 5000 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private', 'course']),
  validate
], postController.createPost);

// @route   GET /api/posts/:id
router.get('/:id', optionalAuth, postController.getPost);

// @route   PUT /api/posts/:id
router.put('/:id', auth, [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 }),
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private', 'course']),
  validate
], postController.updatePost);

// @route   DELETE /api/posts/:id
router.delete('/:id', auth, postController.deletePost);

// @route   POST /api/posts/:id/like
router.post('/:id/like', auth, postController.likePost);

// @route   DELETE /api/posts/:id/like
router.delete('/:id/like', auth, postController.unlikePost);

// @route   POST /api/posts/:id/share
router.post('/:id/share', auth, createPostLimiter, [
  body('content')
    .optional()
    .trim()
    .isLength({ max: 5000 }),
  validate
], postController.sharePost);

// Comment routes
// @route   POST /api/posts/:postId/comments
router.post('/:postId/comments', auth, commentLimiter, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  validate
], commentController.addComment);

// @route   GET /api/posts/:postId/comments
router.get('/:postId/comments', commentController.getComments);

module.exports = router;
