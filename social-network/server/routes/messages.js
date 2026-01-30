const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// @route   GET /api/messages/unread-count
router.get('/unread-count', auth, messageController.getUnreadCount);

// @route   GET /api/messages/search-users
router.get('/search-users', auth, messageController.searchUsers);

// @route   GET /api/messages/conversations
router.get('/conversations', auth, messageController.getConversations);

// @route   POST /api/messages/conversations
router.post('/conversations', auth, [
  body('participantId')
    .optional()
    .isMongoId(),
  body('isGroup')
    .optional()
    .isBoolean(),
  body('groupName')
    .optional()
    .isLength({ max: 100 }),
  validate
], messageController.createConversation);

// @route   GET /api/messages/conversations/:id
router.get('/conversations/:id', auth, messageController.getConversation);

// @route   PUT /api/messages/conversations/:id
router.put('/conversations/:id', auth, [
  body('groupName')
    .optional()
    .isLength({ max: 100 }),
  validate
], messageController.updateConversation);

// @route   POST /api/messages/conversations/:id/participants
router.post('/conversations/:id/participants', auth, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  validate
], messageController.addParticipant);

// @route   DELETE /api/messages/conversations/:id/participants/:userId
router.delete('/conversations/:id/participants/:userId', auth, messageController.removeParticipant);

// @route   POST /api/messages/conversations/:id/leave
router.post('/conversations/:id/leave', auth, messageController.leaveConversation);

// @route   GET /api/messages/conversations/:id/messages
router.get('/conversations/:id/messages', auth, messageController.getMessages);

// @route   POST /api/messages/conversations/:id/messages
router.post('/conversations/:id/messages', auth, [
  body('content')
    .optional()
    .isLength({ max: 2000 }),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file', 'moodle_link']),
  validate
], messageController.sendMessage);

// @route   POST /api/messages/conversations/:id/read
router.post('/conversations/:id/read', auth, messageController.markAsRead);

// @route   DELETE /api/messages/:messageId
router.delete('/:messageId', auth, messageController.deleteMessage);

module.exports = router;
