import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import './Notifications.css';

const Notifications = () => {
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();
  const navigate = useNavigate();

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationMessage = (notification) => {
    const senderName = notification.sender?.username || 'Someone';
    
    switch (notification.type) {
      case 'like':
        return `${senderName} liked your post`;
      case 'comment':
        return `${senderName} commented on your post`;
      case 'follow':
        return `${senderName} started following you`;
      case 'message':
        return `${senderName} sent you a message`;
      default:
        return `${senderName} interacted with you`;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'message':
        return '✉️';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.post) {
          navigate(`/post/${notification.post._id}`);
        }
        break;
      case 'follow':
        navigate(`/profile/${notification.sender?.username}`);
        break;
      case 'message':
        navigate('/chat');
        break;
      default:
        break;
    }
  };

  return (
    <div className="notifications-container">
      <div className="notifications-content">
        <div className="notifications-header">
          <h1>Notifications</h1>
          <div className="notifications-actions">
            <button onClick={markAllAsRead} className="action-btn">
              Mark all as read
            </button>
            <button onClick={clearAllNotifications} className="action-btn danger">
              Clear all
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <span className="icon">🔔</span>
            <h3>No notifications</h3>
            <p>When someone likes, comments, or follows you, you'll see it here.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-avatar">
                  <img
                    src={notification.sender?.avatar || '/default-avatar.png'}
                    alt={notification.sender?.username}
                  />
                </div>

                <div className="notification-content">
                  <p className="notification-message">
                    {getNotificationMessage(notification)}
                  </p>
                  {notification.type === 'comment' && notification.comment && (
                    <p className="notification-preview">
                      "{notification.comment.content?.substring(0, 50)}"
                      {notification.comment.content?.length > 50 ? '...' : ''}
                    </p>
                  )}
                  {notification.type === 'message' && notification.message && (
                    <p className="notification-preview">
                      "{notification.message.substring(0, 50)}"
                      {notification.message.length > 50 ? '...' : ''}
                    </p>
                  )}
                  <span className="notification-time">{formatTime(notification.createdAt)}</span>
                </div>

                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification._id);
                  }}
                >
                  ✕
                </button>
                
                {!notification.read && <div className="unread-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
