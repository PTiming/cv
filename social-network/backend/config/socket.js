const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Store online users: { odId: socketId }
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.userId})`);
    
    // Add user to online users
    onlineUsers.set(socket.userId.toString(), socket.id);
    
    // Broadcast user online status
    io.emit('user:online', {
      userId: socket.userId,
      username: socket.user.username
    });

    // Join user's personal room for direct notifications
    socket.join(`user:${socket.userId}`);

    // Handle joining a conversation room
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.user.username} joined conversation ${conversationId}`);
    });

    // Handle leaving a conversation room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.user.username} left conversation ${conversationId}`);
    });

    // Handle typing indicator
    socket.on('typing:start', ({ conversationId, recipientId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId: socket.userId,
        username: socket.user.username,
        conversationId
      });
    });

    socket.on('typing:stop', ({ conversationId, recipientId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        userId: socket.userId,
        conversationId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
      onlineUsers.delete(socket.userId.toString());
      
      // Broadcast user offline status
      io.emit('user:offline', {
        userId: socket.userId,
        username: socket.user.username
      });
    });
  });

  return io;
};

// Helper function to send notification to specific user
const sendNotification = (io, recipientId, notification) => {
  io.to(`user:${recipientId}`).emit('notification:new', notification);
};

// Helper function to send message to conversation
const sendMessage = (io, conversationId, message) => {
  io.to(`conversation:${conversationId}`).emit('message:new', message);
};

// Helper function to check if user is online
const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

// Helper function to get online users
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

module.exports = {
  initializeSocket,
  sendNotification,
  sendMessage,
  isUserOnline,
  getOnlineUsers,
  onlineUsers
};
