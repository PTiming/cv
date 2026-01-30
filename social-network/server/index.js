require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const notificationRoutes = require('./routes/notifications');
const moodleRoutes = require('./routes/moodle');
const adminRoutes = require('./routes/admin');
const groupRoutes = require('./routes/groups');
const resourceRoutes = require('./routes/resources');
const assignmentRoutes = require('./routes/assignments');
const messageRoutes = require('./routes/messages');
const searchRoutes = require('./routes/search');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// API Routes - Auth routes have additional stricter rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/moodle', moodleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/search', searchRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handler
app.use(errorHandler);

// Socket.IO connection handling
const connectedUsers = new Map();
const User = require('./models/User');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins their personal room
  socket.on('join', async (userId) => {
    socket.join(userId);
    connectedUsers.set(userId, socket.id);
    
    // Update user online status
    await User.findByIdAndUpdate(userId, { isOnline: true, lastActive: new Date() });
    
    // Notify friends that user is online
    io.emit('user_online', { userId });
    
    console.log(`User ${userId} joined their room`);
  });

  // Join a conversation room for real-time messaging
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
  });

  // Leave a conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });

  // Handle new notification
  socket.on('notification', (data) => {
    io.to(data.recipientId).emit('new_notification', data);
  });

  // Handle new message
  socket.on('message', (data) => {
    // Emit to conversation room
    io.to(`conversation_${data.conversationId}`).emit('new_message', data);
    
    // Also emit to individual participants
    data.participants.forEach(participantId => {
      if (participantId !== data.senderId) {
        io.to(participantId).emit('new_message', data);
      }
    });
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: data.userId,
      username: data.username
    });
  });

  // Handle stop typing
  socket.on('stop_typing', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
      conversationId: data.conversationId,
      userId: data.userId
    });
  });

  // Handle message read
  socket.on('message_read', (data) => {
    io.to(`conversation_${data.conversationId}`).emit('messages_read', {
      conversationId: data.conversationId,
      userId: data.userId
    });
  });

  // User disconnects
  socket.on('disconnect', async () => {
    // Remove from connected users and update online status
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        
        // Update user online status
        await User.findByIdAndUpdate(userId, { isOnline: false, lastActive: new Date() });
        
        // Notify friends that user is offline
        io.emit('user_offline', { userId });
        
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

module.exports = { app, server, io };
