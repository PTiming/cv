import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Notification events
  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification:new', callback);
    }
  }

  offNotification() {
    if (this.socket) {
      this.socket.off('notification:new');
    }
  }

  // Message events
  onMessage(callback) {
    if (this.socket) {
      this.socket.on('message:new', callback);
    }
  }

  offMessage() {
    if (this.socket) {
      this.socket.off('message:new');
    }
  }

  // Conversation room management
  joinConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('conversation:join', conversationId);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('conversation:leave', conversationId);
    }
  }

  // Typing indicators
  startTyping(conversationId, recipientId) {
    if (this.socket) {
      this.socket.emit('typing:start', { conversationId, recipientId });
    }
  }

  stopTyping(conversationId, recipientId) {
    if (this.socket) {
      this.socket.emit('typing:stop', { conversationId, recipientId });
    }
  }

  onTypingStart(callback) {
    if (this.socket) {
      this.socket.on('typing:start', callback);
    }
  }

  onTypingStop(callback) {
    if (this.socket) {
      this.socket.on('typing:stop', callback);
    }
  }

  // Online status events
  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on('user:online', callback);
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on('user:offline', callback);
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

const socketService = new SocketService();
export default socketService;
