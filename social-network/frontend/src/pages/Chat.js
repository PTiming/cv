import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Chat.css';

const Chat = () => {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    typingUsers,
    loading,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    fetchConversations
  } = useChat();

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (selectedConversation) {
        leaveConversation(selectedConversation._id);
      }
    };
  }, [selectedConversation, leaveConversation]);

  const handleSelectConversation = (conversation) => {
    if (selectedConversation?._id === conversation._id) return;

    if (selectedConversation) {
      leaveConversation(selectedConversation._id);
    }

    setSelectedConversation(conversation);
    joinConversation(conversation._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await sendMessage(selectedConversation._id, newMessage);
      setNewMessage('');
      handleStopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!selectedConversation) return;

    const recipient = getOtherParticipant(selectedConversation);
    startTyping(selectedConversation._id, recipient._id);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (!selectedConversation) return;
    const recipient = getOtherParticipant(selectedConversation);
    stopTyping(selectedConversation._id, recipient._id);
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/users/search/${query}`);
      setSearchResults(response.data.users.filter(u => u._id !== user.id));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const startNewConversation = async (participant) => {
    try {
      const response = await api.post('/chat/conversations', {
        participantId: participant._id
      });
      const conversation = response.data.conversation;
      
      setSelectedConversation(conversation);
      joinConversation(conversation._id);
      setSearchQuery('');
      setSearchResults([]);
      fetchConversations();
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p._id !== user.id);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-container">
      {/* Conversations List */}
      <div className="conversations-panel">
        <div className="conversations-header">
          <h2>Messages</h2>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search users to chat..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(result => (
              <div
                key={result._id}
                className="search-result-item"
                onClick={() => startNewConversation(result)}
              >
                <img
                  src={result.avatar || '/default-avatar.png'}
                  alt={result.username}
                  className="user-avatar"
                />
                <span>{result.username}</span>
              </div>
            ))}
          </div>
        )}

        {/* Conversations */}
        <div className="conversations-list">
          {loading ? (
            <div className="loading">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="no-conversations">
              No conversations yet. Search for users to start chatting!
            </div>
          ) : (
            conversations.map(conversation => {
              const otherUser = getOtherParticipant(conversation);
              return (
                <div
                  key={conversation._id}
                  className={`conversation-item ${
                    selectedConversation?._id === conversation._id ? 'active' : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <img
                    src={otherUser?.avatar || '/default-avatar.png'}
                    alt={otherUser?.username}
                    className="user-avatar"
                  />
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="username">{otherUser?.username}</span>
                      {conversation.lastMessage && (
                        <span className="time">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="last-message">
                      {conversation.lastMessage?.content?.substring(0, 40) ||
                        'Start a conversation'}
                      {conversation.lastMessage?.content?.length > 40 ? '...' : ''}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">{conversation.unreadCount}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="chat-panel">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <img
                src={getOtherParticipant(selectedConversation)?.avatar || '/default-avatar.png'}
                alt={getOtherParticipant(selectedConversation)?.username}
                className="user-avatar"
              />
              <div className="chat-header-info">
                <h3>{getOtherParticipant(selectedConversation)?.username}</h3>
                {typingUsers[selectedConversation._id] && (
                  <span className="typing-indicator">typing...</span>
                )}
              </div>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="no-messages">
                  No messages yet. Say hello! 👋
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const isOwn = message.sender._id === user.id;
                    const showDate =
                      index === 0 ||
                      formatDate(messages[index - 1].createdAt) !==
                        formatDate(message.createdAt);

                    return (
                      <React.Fragment key={message._id}>
                        {showDate && (
                          <div className="date-separator">
                            {formatDate(message.createdAt)}
                          </div>
                        )}
                        <div className={`message ${isOwn ? 'own' : ''}`}>
                          <div className="message-content">
                            <p>{message.content}</p>
                            <span className="message-time">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form className="message-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleTyping}
                onBlur={handleStopTyping}
              />
              <button type="submit" disabled={!newMessage.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="no-conversation-selected">
            <h3>Select a conversation</h3>
            <p>Choose from your existing conversations or start a new one!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
