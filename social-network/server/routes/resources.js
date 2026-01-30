const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const resourceController = require('../controllers/resourceController');

// @route   GET /api/resources/my-resources
router.get('/my-resources', auth, resourceController.getMyResources);

// @route   GET /api/resources/saved
router.get('/saved', auth, resourceController.getSavedResources);

// @route   GET /api/resources/course/:courseId
router.get('/course/:courseId', auth, resourceController.getResourcesByCourse);

// @route   GET /api/resources
router.get('/', auth, resourceController.getResources);

// @route   POST /api/resources
router.post('/', auth, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 }),
  body('type')
    .optional()
    .isIn(['document', 'link', 'video', 'image', 'note', 'other']),
  body('visibility')
    .optional()
    .isIn(['public', 'group', 'private']),
  validate
], resourceController.createResource);

// @route   GET /api/resources/:id
router.get('/:id', auth, resourceController.getResource);

// @route   PUT /api/resources/:id
router.put('/:id', auth, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }),
  body('description')
    .optional()
    .isLength({ max: 2000 }),
  validate
], resourceController.updateResource);

// @route   DELETE /api/resources/:id
router.delete('/:id', auth, resourceController.deleteResource);

// @route   POST /api/resources/:id/like
router.post('/:id/like', auth, resourceController.likeResource);

// @route   DELETE /api/resources/:id/like
router.delete('/:id/like', auth, resourceController.unlikeResource);

// @route   POST /api/resources/:id/save
router.post('/:id/save', auth, resourceController.saveResource);

// @route   DELETE /api/resources/:id/save
router.delete('/:id/save', auth, resourceController.unsaveResource);

// @route   POST /api/resources/:id/comments
router.post('/:id/comments', auth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment is required'),
  validate
], resourceController.addComment);

// @route   POST /api/resources/:id/download
router.post('/:id/download', auth, resourceController.downloadResource);

module.exports = router;
