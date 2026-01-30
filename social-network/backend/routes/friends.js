const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// Get io instance from app
const getIO = (req) => req.app.get('io');

// @route   GET /api/friends
// @desc    Get user's friends list
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username avatar bio');

    res.json({ friends: user.friends || [] });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/friends/requests
// @desc    Get friend requests (sent and received)
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friendRequestsSent', 'username avatar bio')
      .populate('friendRequestsReceived', 'username avatar bio');

    res.json({
      sent: user.friendRequestsSent || [],
      received: user.friendRequestsReceived || []
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/friends/request/:userId
// @desc    Send a friend request
// @access  Private
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.userId.toString()) {
      return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.userId);

    // Check if already friends
    if (currentUser.friends && currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({ message: 'You are already friends with this user' });
    }

    // Check if request already sent
    if (currentUser.friendRequestsSent && currentUser.friendRequestsSent.includes(targetUserId)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Check if there's a pending request from the target user
    if (currentUser.friendRequestsReceived && currentUser.friendRequestsReceived.includes(targetUserId)) {
      return res.status(400).json({ message: 'This user has already sent you a friend request. Accept it instead!' });
    }

    // Add to sent requests
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { friendRequestsSent: targetUserId }
    });

    // Add to received requests
    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { friendRequestsReceived: req.userId }
    });

    // Send notification
    const notification = new Notification({
      recipient: targetUserId,
      sender: req.userId,
      type: 'friend_request'
    });
    await notification.save();

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'username avatar');

    const io = getIO(req);
    if (io) {
      io.to(`user:${targetUserId}`).emit('notification:new', populatedNotification);
      io.to(`user:${targetUserId}`).emit('friend:request', {
        from: { _id: req.userId, username: currentUser.username, avatar: currentUser.avatar }
      });
    }

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/friends/accept/:userId
// @desc    Accept a friend request
// @access  Private
router.post('/accept/:userId', auth, async (req, res) => {
  try {
    const requesterId = req.params.userId;

    const currentUser = await User.findById(req.userId);
    
    // Check if request exists
    if (!currentUser.friendRequestsReceived || !currentUser.friendRequestsReceived.includes(requesterId)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    // Add each other as friends
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { friends: requesterId },
      $pull: { friendRequestsReceived: requesterId }
    });

    await User.findByIdAndUpdate(requesterId, {
      $addToSet: { friends: req.userId },
      $pull: { friendRequestsSent: req.userId }
    });

    // Send notification to requester
    const notification = new Notification({
      recipient: requesterId,
      sender: req.userId,
      type: 'friend_accepted'
    });
    await notification.save();

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'username avatar');

    const io = getIO(req);
    if (io) {
      io.to(`user:${requesterId}`).emit('notification:new', populatedNotification);
      io.to(`user:${requesterId}`).emit('friend:accepted', {
        user: { _id: req.userId, username: currentUser.username, avatar: currentUser.avatar }
      });
    }

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/friends/reject/:userId
// @desc    Reject a friend request
// @access  Private
router.post('/reject/:userId', auth, async (req, res) => {
  try {
    const requesterId = req.params.userId;

    const currentUser = await User.findById(req.userId);
    
    // Check if request exists
    if (!currentUser.friendRequestsReceived || !currentUser.friendRequestsReceived.includes(requesterId)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    // Remove from requests
    await User.findByIdAndUpdate(req.userId, {
      $pull: { friendRequestsReceived: requesterId }
    });

    await User.findByIdAndUpdate(requesterId, {
      $pull: { friendRequestsSent: req.userId }
    });

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/friends/cancel/:userId
// @desc    Cancel a sent friend request
// @access  Private
router.post('/cancel/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    // Remove from sent requests
    await User.findByIdAndUpdate(req.userId, {
      $pull: { friendRequestsSent: targetUserId }
    });

    // Remove from their received requests
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { friendRequestsReceived: req.userId }
    });

    res.json({ message: 'Friend request cancelled' });
  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/friends/:userId
// @desc    Remove a friend
// @access  Private
router.delete('/:userId', auth, async (req, res) => {
  try {
    const friendId = req.params.userId;

    // Remove from both users' friends lists
    await User.findByIdAndUpdate(req.userId, {
      $pull: { friends: friendId }
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: req.userId }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/friends/status/:userId
// @desc    Get friendship status with a user
// @access  Private
router.get('/status/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUser = await User.findById(req.userId);

    let status = 'none';

    if (currentUser.friends && currentUser.friends.includes(targetUserId)) {
      status = 'friends';
    } else if (currentUser.friendRequestsSent && currentUser.friendRequestsSent.includes(targetUserId)) {
      status = 'request_sent';
    } else if (currentUser.friendRequestsReceived && currentUser.friendRequestsReceived.includes(targetUserId)) {
      status = 'request_received';
    }

    res.json({ status });
  } catch (error) {
    console.error('Get friendship status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/friends/suggestions
// @desc    Get friend suggestions (friends of friends)
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).populate('friends');
    
    // Get friends of friends
    const friendIds = currentUser.friends ? currentUser.friends.map(f => f._id) : [];
    const excludeIds = [...friendIds, currentUser._id];
    
    // Add sent and received requests to exclude
    if (currentUser.friendRequestsSent) {
      excludeIds.push(...currentUser.friendRequestsSent);
    }
    if (currentUser.friendRequestsReceived) {
      excludeIds.push(...currentUser.friendRequestsReceived);
    }

    let suggestions = [];

    if (friendIds.length > 0) {
      // Get friends of friends
      const friendsOfFriends = await User.find({
        friends: { $in: friendIds },
        _id: { $nin: excludeIds }
      })
        .select('username avatar bio friends')
        .limit(10);

      suggestions = friendsOfFriends.map(user => ({
        ...user.toObject(),
        mutualFriends: user.friends.filter(f => friendIds.some(id => id.equals(f))).length
      }));
    }

    // If not enough suggestions, get random users
    if (suggestions.length < 10) {
      const randomUsers = await User.find({
        _id: { $nin: excludeIds }
      })
        .select('username avatar bio')
        .limit(10 - suggestions.length);

      suggestions.push(...randomUsers.map(u => ({ ...u.toObject(), mutualFriends: 0 })));
    }

    // Sort by mutual friends
    suggestions.sort((a, b) => b.mutualFriends - a.mutualFriends);

    res.json({ suggestions });
  } catch (error) {
    console.error('Get friend suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
