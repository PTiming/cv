import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data.conversations);
      
      // Calculate total unread
      const total = response.data.conversations.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      setUnreadCount(total);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(response.data.messages);
      return response.data.messages;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }, []);

  // Create or get conversation
  const getOrCreateConversation = async (participantId) => {
    try {
      const response = await api.post('/chat/conversations', { participantId });
      const { conversation, isNew } = response.data;
      
      if (isNew) {
        setConversations(prev => [{ ...conversation, unreadCount: 0 }, ...prev]);
      }
      
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  };

  // Send message
  const sendMessage = async (conversationId, content) => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content
      });
      
      // Message will be added via socket event
      return response.data.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  // Join conversation room
  const joinConversation = (conversationId) => {
    socketService.joinConversation(conversationId);
    setCurrentConversation(conversationId);
    fetchMessages(conversationId);
  };

  // Leave conversation room
  const leaveConversation = (conversationId) => {
    socketService.leaveConversation(conversationId);
    if (currentConversation === conversationId) {
      setCurrentConversation(null);
      setMessages([]);
    }
  };

  // Start typing indicator
  const startTyping = (conversationId, recipientId) => {
    socketService.startTyping(conversationId, recipientId);
  };

  // Stop typing indicator
  const stopTyping = (conversationId, recipientId) => {
    socketService.stopTyping(conversationId, recipientId);
  };

  // Listen for real-time messages and typing
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();

      // Listen for new messages
      socketService.onMessage((message) => {
        // Add message to current conversation if it matches
        if (currentConversation === message.conversation) {
          setMessages(prev => [...prev, message]);
        }

        // Update conversation list
        setConversations(prev => {
          return prev.map(conv => {
            if (conv._id === message.conversation) {
              const isOwnMessage = message.sender._id === user?.id;
              return {
                ...conv,
                lastMessage: message,
                lastMessageAt: message.createdAt,
                unreadCount: isOwnMessage ? conv.unreadCount : conv.unreadCount + 1
              };
            }
            return conv;
          }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        });

        // Update total unread count if message is from another user
        if (message.sender._id !== user?.id) {
          setUnreadCount(prev => prev + 1);
        }
      });

      // Listen for typing events
      socketService.onTypingStart((data) => {
        setTypingUsers(prev => ({
          ...prev,
          [data.conversationId]: data.username
        }));
      });

      socketService.onTypingStop((data) => {
        setTypingUsers(prev => {
          const newTyping = { ...prev };
          delete newTyping[data.conversationId];
          return newTyping;
        });
      });

      return () => {
        socketService.offMessage();
      };
    }
  }, [isAuthenticated, currentConversation, user, fetchConversations]);

  const value = {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    loading,
    typingUsers,
    fetchConversations,
    fetchMessages,
    getOrCreateConversation,
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    setMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
