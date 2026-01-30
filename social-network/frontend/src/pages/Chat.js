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
  const [friends, setFriends] = useState([]);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchFriends();
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

  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends');
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

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

  const startNewConversation = async (friend) => {
    try {
      const response = await api.post('/chat/conversations', {
        participantId: friend._id
      });
      const conversation = response.data.conversation;
      
      setSelectedConversation(conversation);
      joinConversation(conversation._id);
      setShowFriendsList(false);
      fetchConversations();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start conversation');
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

  // Filter friends who don't have a conversation yet
  const friendsWithoutConversation = friends.filter(friend => {
    return !conversations.some(conv => {
      const otherParticipant = getOtherParticipant(conv);
      return otherParticipant?._id === friend._id;
    });
  });

  return (
    <div className="chat-container">
      {/* Conversations List */}
      <div className="conversations-panel">
        <div className="conversations-header">
          <h2>Messages</h2>
          <button 
            className="new-chat-btn"
            onClick={() => setShowFriendsList(!showFriendsList)}
            title="Start new conversation"
          >
            ✏️
          </button>
        </div>

        {/* Friends List for new conversation */}
        {showFriendsList && (
          <div className="friends-list-dropdown">
            <h4>Start a conversation with a friend</h4>
            {friends.length === 0 ? (
              <p className="no-friends">You need friends to chat! <a href="/friends">Add friends</a></p>
            ) : friendsWithoutConversation.length === 0 ? (
              <p className="no-friends">You have conversations with all your friends!</p>
            ) : (
              friendsWithoutConversation.map(friend => (
                <div
                  key={friend._id}
                  className="friend-item"
                  onClick={() => startNewConversation(friend)}
                >
                  <img
                    src={friend.avatar || '/default-avatar.png'}
                    alt={friend.username}
                    className="user-avatar"
                  />
                  <span>{friend.username}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Conversations */}
        <div className="conversations-list">
          {loading ? (
            <div className="loading">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet.</p>
              <p>Add friends to start chatting!</p>
              <a href="/friends" className="add-friends-link">Find Friends</a>
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
