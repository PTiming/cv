const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const commentController = require('../controllers/commentController');

// @route   PUT /api/comments/:id
router.put('/:id', auth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  validate
], commentController.updateComment);

// @route   DELETE /api/comments/:id
router.delete('/:id', auth, commentController.deleteComment);

// @route   POST /api/comments/:id/like
router.post('/:id/like', auth, commentController.likeComment);

// @route   DELETE /api/comments/:id/like
router.delete('/:id/like', auth, commentController.unlikeComment);

module.exports = router;
