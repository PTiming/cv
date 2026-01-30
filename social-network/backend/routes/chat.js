const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get io instance from app
const getIO = (req) => req.app.get('io');

// @route   GET /api/chat/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username avatar')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username' }
      });

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.userId },
          read: false
        });
        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    res.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/conversations
// @desc    Create or get existing conversation
// @access  Private
router.post('/conversations', auth, [
  body('participantId').notEmpty().withMessage('Participant ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { participantId } = req.body;

    if (participantId === req.userId.toString()) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, participantId] }
    }).populate('participants', 'username avatar');

    if (conversation) {
      return res.json({ conversation, isNew: false });
    }

    // Create new conversation
    conversation = new Conversation({
      participants: [req.userId, participantId]
    });
    await conversation.save();

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username avatar');

    res.status(201).json({ conversation, isNew: true });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/conversations/:id/messages
// @desc    Get messages in a conversation
// @access  Private
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar');

    const total = await Message.countDocuments({ conversation: req.params.id });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: req.params.id,
        sender: { $ne: req.userId },
        read: false
      },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/conversations/:id/messages
// @desc    Send a message
// @access  Private
router.post('/conversations/:id/messages', auth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }

    // Create message
    const message = new Message({
      conversation: req.params.id,
      sender: req.userId,
      content: req.body.content
    });
    await message.save();

    // Update conversation's last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar');

    // Get recipient (the other participant)
    const recipientId = conversation.participants.find(
      p => p.toString() !== req.userId.toString()
    );

    // Send real-time message via Socket.io
    const io = getIO(req);
    if (io) {
      // Send to conversation room
      io.to(`conversation:${req.params.id}`).emit('message:new', populatedMessage);
      
      // Send notification to recipient
      const notification = new Notification({
        recipient: recipientId,
        sender: req.userId,
        type: 'message',
        message: req.body.content.substring(0, 100)
      });
      await notification.save();

      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username avatar');

      io.to(`user:${recipientId}`).emit('notification:new', populatedNotification);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/chat/conversations/:id
// @desc    Delete a conversation
// @access  Private
router.delete('/conversations/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this conversation' });
    }

    // Delete all messages in conversation
    await Message.deleteMany({ conversation: req.params.id });
    
    // Delete conversation
    await Conversation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Get total unread message count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    // Get user's conversations
    const conversations = await Conversation.find({
      participants: req.userId
    });

    const conversationIds = conversations.map(c => c._id);

    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: req.userId },
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
