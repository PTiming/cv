import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import * as messageService from '../../services/messageService';
import Avatar from '../common/Avatar';
import Loading from '../common/Loading';
import './Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typing, setTyping] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await messageService.getConversations();
        setConversations(data.data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Join conversation room when selected
  useEffect(() => {
    if (socket && selectedConversation) {
      socket.emit('join_conversation', selectedConversation._id);

      return () => {
        socket.emit('leave_conversation', selectedConversation._id);
      };
    }
  }, [socket, selectedConversation]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setMessages(prev => [...prev, data.message]);
      }
      
      // Update conversation list
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv._id === data.conversationId) {
            return { ...conv, lastMessage: data.message };
          }
          return conv;
        });
        // Move conversation to top
        const index = updated.findIndex(c => c._id === data.conversationId);
        if (index > 0) {
          const [conv] = updated.splice(index, 1);
          updated.unshift(conv);
        }
        return updated;
      });
    };

    const handleTyping = (data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setTyping(data);
        setTimeout(() => setTyping(null), 3000);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', () => setTyping(null));

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing');
    };
  }, [socket, selectedConversation]);

  // Fetch messages when conversation selected
  const fetchMessages = useCallback(async (conversationId) => {
    setMessagesLoading(true);
    try {
      const { data } = await messageService.getMessages(conversationId);
      setMessages(data.data);
      await messageService.markAsRead(conversationId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation, fetchMessages]);

  // Search users for new chat
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const { data } = await messageService.searchUsers(searchQuery);
        setSearchResults(data.data);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { data } = await messageService.sendMessage(selectedConversation._id, {
        content: newMessage.trim()
      });
      setMessages(prev => [...prev, data.data]);
      setNewMessage('');

      // Update conversation list
      setConversations(prev => prev.map(conv => {
        if (conv._id === selectedConversation._id) {
          return { ...conv, lastMessage: data.data };
        }
        return conv;
      }));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (socket && selectedConversation) {
      socket.emit('typing', {
        conversationId: selectedConversation._id,
        userId: user._id,
        username: user.username
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          conversationId: selectedConversation._id,
          userId: user._id
        });
      }, 2000);
    }
  };

  const startNewConversation = async (otherUser) => {
    try {
      const { data } = await messageService.createConversation({
        participantId: otherUser._id
      });

      // Check if conversation already exists
      const existing = conversations.find(c => c._id === data.data._id);
      if (!existing) {
        setConversations(prev => [data.data, ...prev]);
      }
      setSelectedConversation(data.data);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants) return null;
    return conversation.participants.find(p => p._id !== user._id);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return 'Now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString();
  };

  if (loading) {
    return <Loading text="Loading messages..." />;
  }

  return (
    <div className="messages-container">
      {/* Conversations List */}
      <div className="conversations-sidebar">
        <div className="conversations-header">
          <h2>Messages</h2>
          <button 
            className="new-chat-btn"
            onClick={() => setShowNewChat(true)}
          >
            <i className="fas fa-edit"></i>
          </button>
        </div>

        {showNewChat && (
          <div className="new-chat-search">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(u => (
                  <div 
                    key={u._id} 
                    className="search-result-item"
                    onClick={() => startNewConversation(u)}
                  >
                    <Avatar user={u} size="small" />
                    <span>{u.username}</span>
                    {u.isOnline && <span className="online-dot"></span>}
                  </div>
                ))}
              </div>
            )}
            <button 
              className="cancel-search"
              onClick={() => {
                setShowNewChat(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="conversations-list">
          {conversations.length === 0 ? (
            <p className="no-conversations">No conversations yet</p>
          ) : (
            conversations.map(conversation => {
              const otherUser = conversation.isGroup 
                ? null 
                : getOtherParticipant(conversation);
              
              return (
                <div
                  key={conversation._id}
                  className={`conversation-item ${selectedConversation?._id === conversation._id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    {conversation.isGroup ? (
                      <div className="group-avatar">
                        <i className="fas fa-users"></i>
                      </div>
                    ) : (
                      <Avatar user={otherUser} size="medium" />
                    )}
                    {otherUser?.isOnline && <span className="online-indicator"></span>}
                  </div>
                  <div className="conversation-info">
                    <h4>
                      {conversation.isGroup 
                        ? conversation.groupName 
                        : otherUser?.username || 'Unknown User'}
                    </h4>
                    {conversation.lastMessage && (
                      <p className="last-message">
                        {conversation.lastMessage.sender === user._id && 'You: '}
                        {conversation.lastMessage.content?.substring(0, 30)}
                        {conversation.lastMessage.content?.length > 30 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <span className="message-time">
                      {formatTime(conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                {selectedConversation.isGroup ? (
                  <>
                    <div className="group-avatar">
                      <i className="fas fa-users"></i>
                    </div>
                    <div>
                      <h3>{selectedConversation.groupName}</h3>
                      <span className="participants-count">
                        {selectedConversation.participants.length} members
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <Avatar user={getOtherParticipant(selectedConversation)} size="medium" />
                    <div>
                      <h3>{getOtherParticipant(selectedConversation)?.username}</h3>
                      {getOtherParticipant(selectedConversation)?.isOnline ? (
                        <span className="online-status">Online</span>
                      ) : (
                        <span className="offline-status">
                          Last seen {formatTime(getOtherParticipant(selectedConversation)?.lastActive)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="chat-actions">
                <button className="chat-action-btn">
                  <i className="fas fa-phone"></i>
                </button>
                <button className="chat-action-btn">
                  <i className="fas fa-video"></i>
                </button>
                <button className="chat-action-btn">
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>

            <div className="messages-area">
              {messagesLoading ? (
                <Loading text="Loading messages..." />
              ) : (
                <>
                  {messages.map((message, index) => {
                    const isOwn = message.sender._id === user._id || message.sender === user._id;
                    const showAvatar = !isOwn && (
                      index === 0 || 
                      messages[index - 1].sender._id !== message.sender._id
                    );

                    return (
                      <div 
                        key={message._id} 
                        className={`message ${isOwn ? 'own' : 'other'}`}
                      >
                        {!isOwn && showAvatar && (
                          <Avatar 
                            user={typeof message.sender === 'object' ? message.sender : null} 
                            size="small" 
                          />
                        )}
                        {!isOwn && !showAvatar && <div className="avatar-placeholder"></div>}
                        <div className="message-content">
                          <p>{message.content}</p>
                          <span className="message-time">
                            {new Date(message.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {typing && (
                    <div className="typing-indicator">
                      <span>{typing.username} is typing...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form className="message-input-form" onSubmit={handleSendMessage}>
              <button type="button" className="attach-btn">
                <i className="fas fa-paperclip"></i>
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
              />
              <button type="button" className="emoji-btn">
                <i className="fas fa-smile"></i>
              </button>
              <button 
                type="submit" 
                className="send-btn"
                disabled={!newMessage.trim()}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">
              <i className="fas fa-comments"></i>
            </div>
            <h3>Welcome to Messages</h3>
            <p>Select a conversation or start a new one</p>
            <button 
              className="start-chat-btn"
              onClick={() => setShowNewChat(true)}
            >
              Start a conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
