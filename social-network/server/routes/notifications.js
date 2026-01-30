const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// @route   GET /api/notifications
router.get('/', auth, notificationController.getNotifications);

// @route   GET /api/notifications/unread-count
router.get('/unread-count', auth, notificationController.getUnreadCount);

// @route   PUT /api/notifications/read-all
router.put('/read-all', auth, notificationController.markAllAsRead);

// @route   PUT /api/notifications/:id/read
router.put('/:id/read', auth, notificationController.markAsRead);

// @route   DELETE /api/notifications/:id
router.delete('/:id', auth, notificationController.deleteNotification);

module.exports = router;
