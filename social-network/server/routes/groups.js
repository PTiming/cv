const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const groupController = require('../controllers/groupController');

// @route   GET /api/groups/my-groups
router.get('/my-groups', auth, groupController.getMyGroups);

// @route   GET /api/groups/course/:courseId
router.get('/course/:courseId', auth, groupController.getStudyGroupsByCourse);

// @route   GET /api/groups
router.get('/', auth, groupController.getGroups);

// @route   POST /api/groups
router.post('/', auth, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name is required and must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 }),
  body('type')
    .optional()
    .isIn(['general', 'study', 'course']),
  body('privacy')
    .optional()
    .isIn(['public', 'private', 'secret']),
  validate
], groupController.createGroup);

// @route   GET /api/groups/:id
router.get('/:id', auth, groupController.getGroup);

// @route   PUT /api/groups/:id
router.put('/:id', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),
  body('description')
    .optional()
    .isLength({ max: 1000 }),
  validate
], groupController.updateGroup);

// @route   DELETE /api/groups/:id
router.delete('/:id', auth, groupController.deleteGroup);

// @route   POST /api/groups/:id/join
router.post('/:id/join', auth, groupController.joinGroup);

// @route   POST /api/groups/:id/leave
router.post('/:id/leave', auth, groupController.leaveGroup);

// @route   POST /api/groups/:id/approve/:userId
router.post('/:id/approve/:userId', auth, groupController.approveJoinRequest);

// @route   POST /api/groups/:id/reject/:userId
router.post('/:id/reject/:userId', auth, groupController.rejectJoinRequest);

// @route   GET /api/groups/:id/posts
router.get('/:id/posts', auth, groupController.getGroupPosts);

// @route   POST /api/groups/:id/posts
router.post('/:id/posts', auth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Post content is required'),
  validate
], groupController.createGroupPost);

module.exports = router;
