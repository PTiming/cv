const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const assignmentController = require('../controllers/assignmentController');

// @route   GET /api/assignments/course/:courseId
router.get('/course/:courseId', auth, assignmentController.getAssignmentsByCourse);

// @route   GET /api/assignments
router.get('/', auth, assignmentController.getAssignments);

// @route   POST /api/assignments
router.post('/', auth, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 5000 }),
  body('visibility')
    .optional()
    .isIn(['private', 'group', 'public']),
  validate
], assignmentController.createAssignment);

// @route   GET /api/assignments/:id
router.get('/:id', auth, assignmentController.getAssignment);

// @route   PUT /api/assignments/:id
router.put('/:id', auth, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }),
  body('description')
    .optional()
    .isLength({ max: 5000 }),
  body('status')
    .optional()
    .isIn(['planning', 'in_progress', 'review', 'completed', 'submitted']),
  validate
], assignmentController.updateAssignment);

// @route   DELETE /api/assignments/:id
router.delete('/:id', auth, assignmentController.deleteAssignment);

// @route   POST /api/assignments/:id/tasks
router.post('/:id/tasks', auth, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title is required'),
  validate
], assignmentController.addTask);

// @route   PUT /api/assignments/:id/tasks/:taskId
router.put('/:id/tasks/:taskId', auth, assignmentController.updateTask);

// @route   POST /api/assignments/:id/collaborators
router.post('/:id/collaborators', auth, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('role')
    .optional()
    .isIn(['editor', 'viewer']),
  validate
], assignmentController.addCollaborator);

// @route   DELETE /api/assignments/:id/collaborators/:userId
router.delete('/:id/collaborators/:userId', auth, assignmentController.removeCollaborator);

// @route   POST /api/assignments/:id/discussions
router.post('/:id/discussions', auth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment is required'),
  validate
], assignmentController.addDiscussion);

// @route   POST /api/assignments/:id/files
router.post('/:id/files', auth, [
  body('url').notEmpty().withMessage('File URL is required'),
  body('filename').notEmpty().withMessage('Filename is required'),
  validate
], assignmentController.uploadFile);

module.exports = router;
