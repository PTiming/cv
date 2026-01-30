const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all conversations for user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'username profilePicture isOnline lastActive')
      .populate('lastMessage')
      .populate('admin', 'username profilePicture')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments({
      participants: req.user._id
    });

    res.json({
      success: true,
      data: conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

// @desc    Get or create conversation with user
// @route   POST /api/messages/conversations
// @access  Private
exports.createConversation = async (req, res) => {
  try {
    const { participantId, isGroup, groupName, participants } = req.body;

    if (isGroup) {
      // Create group conversation
      if (!participants || participants.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Group conversations require at least 2 other participants'
        });
      }

      const allParticipants = [req.user._id, ...participants];

      const conversation = await Conversation.create({
        participants: allParticipants,
        isGroup: true,
        groupName: groupName || 'New Group',
        admin: req.user._id
      });

      await conversation.populate('participants', 'username profilePicture');

      return res.status(201).json({
        success: true,
        data: conversation
      });
    }

    // Direct message - check if conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, participantId], $size: 2 }
    }).populate('participants', 'username profilePicture isOnline lastActive');

    if (conversation) {
      return res.json({
        success: true,
        data: conversation
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [req.user._id, participantId],
      isGroup: false
    });

    await conversation.populate('participants', 'username profilePicture isOnline lastActive');

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating conversation',
      error: error.message
    });
  }
};

// @desc    Get single conversation
// @route   GET /api/messages/conversations/:id
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'username profilePicture isOnline lastActive')
      .populate('admin', 'username profilePicture');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation',
      error: error.message
    });
  }
};

// @desc    Update group conversation
// @route   PUT /api/messages/conversations/:id
// @access  Private (Admin for groups)
exports.updateConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update direct message conversations'
      });
    }

    if (conversation.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can update'
      });
    }

    const { groupName, groupAvatar } = req.body;

    if (groupName) conversation.groupName = groupName;
    if (groupAvatar) conversation.groupAvatar = groupAvatar;

    await conversation.save();
    await conversation.populate('participants', 'username profilePicture');

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating conversation',
      error: error.message
    });
  }
};

// @desc    Add participant to group
// @route   POST /api/messages/conversations/:id/participants
// @access  Private (Admin)
exports.addParticipant = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found'
      });
    }

    if (conversation.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can add participants'
      });
    }

    const { userId } = req.body;

    if (conversation.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a participant'
      });
    }

    conversation.participants.push(userId);
    await conversation.save();

    // Notify new participant
    await Notification.create({
      recipient: userId,
      sender: req.user._id,
      type: 'group_added',
      content: `${req.user.username} added you to "${conversation.groupName}"`
    });

    await conversation.populate('participants', 'username profilePicture');

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding participant',
      error: error.message
    });
  }
};

// @desc    Remove participant from group
// @route   DELETE /api/messages/conversations/:id/participants/:userId
// @access  Private (Admin)
exports.removeParticipant = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found'
      });
    }

    if (conversation.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can remove participants'
      });
    }

    if (req.params.userId === conversation.admin.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove admin'
      });
    }

    conversation.participants = conversation.participants.filter(
      p => p.toString() !== req.params.userId
    );
    await conversation.save();

    res.json({
      success: true,
      message: 'Participant removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing participant',
      error: error.message
    });
  }
};

// @desc    Leave group conversation
// @route   POST /api/messages/conversations/:id/leave
// @access  Private
exports.leaveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found'
      });
    }

    if (conversation.admin.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot leave. Transfer admin first or delete the group.'
      });
    }

    conversation.participants = conversation.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );
    await conversation.save();

    res.json({
      success: true,
      message: 'Left the group'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error leaving conversation',
      error: error.message
    });
  }
};

// @desc    Get messages in conversation
// @route   GET /api/messages/conversations/:id/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await Message.find({
      conversation: req.params.id,
      isDeleted: false
    })
      .populate('sender', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({
      conversation: req.params.id,
      isDeleted: false
    });

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// @desc    Send message
// @route   POST /api/messages/conversations/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { content, messageType, attachments, moodleResource } = req.body;

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      content,
      messageType: messageType || 'text',
      attachments,
      moodleResource,
      readBy: [{ user: req.user._id }]
    });

    // Update conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    await message.populate('sender', 'username profilePicture');

    // Get socket.io instance and emit to other participants
    const io = req.app.get('io');
    if (io) {
      for (const participantId of conversation.participants) {
        if (participantId.toString() !== req.user._id.toString()) {
          io.to(participantId.toString()).emit('new_message', {
            conversationId: conversation._id,
            message: message
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// @desc    Mark messages as read
// @route   POST /api/messages/conversations/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversation: req.params.id,
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: { readBy: { user: req.user._id } }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private (Sender only)
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only sender can delete message'
      });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    }).select('_id');

    const conversationIds = conversations.map(c => c._id);

    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id },
      isDeleted: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};

// @desc    Search users for messaging
// @route   GET /api/messages/search-users
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username profilePicture firstName lastName isOnline')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
};
