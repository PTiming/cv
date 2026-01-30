import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaComment, FaUserPlus, FaReply, FaShare, FaBook, FaClock, FaBell, FaCheck } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../../context/SocketContext';
import Loading from '../common/Loading';
import Avatar from '../common/Avatar';
import notificationService from '../../services/notificationService';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { setUnreadCount } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(pageNum);
      if (response.success) {
        if (append) {
          setNotifications(prev => [...prev, ...response.data]);
        } else {
          setNotifications(response.data);
        }
        setHasMore(pageNum < response.pagination.pages);
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FaHeart className="icon-like" />;
      case 'comment':
        return <FaComment className="icon-comment" />;
      case 'follow':
        return <FaUserPlus className="icon-follow" />;
      case 'reply':
        return <FaReply className="icon-reply" />;
      case 'share':
        return <FaShare className="icon-share" />;
      case 'mention':
        return <FaComment className="icon-mention" />;
      case 'moodle_deadline':
        return <FaClock className="icon-deadline" />;
      case 'moodle_assignment':
      case 'moodle_grade':
        return <FaBook className="icon-moodle" />;
      default:
        return <FaBell className="icon-default" />;
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.post) {
      return `/post/${notification.post._id || notification.post}`;
    }
    if (notification.sender) {
      return `/profile/${notification.sender.username}`;
    }
    return '#';
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  if (loading && notifications.length === 0) {
    return <Loading text="Loading notifications..." />;
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1><FaBell /> Notifications</h1>
        {notifications.some(n => !n.isRead) && (
          <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
            <FaCheck /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="no-notifications">
          <FaBell className="empty-icon" />
          <h3>No notifications yet</h3>
          <p>When someone interacts with you, you'll see it here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <Link
              key={notification._id}
              to={getNotificationLink(notification)}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              
              {notification.sender && (
                <Avatar 
                  src={notification.sender.avatar}
                  alt={notification.sender.username}
                  size="small"
                />
              )}

              <div className="notification-content">
                <p>{notification.content}</p>
                <span className="notification-time">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </div>

              {!notification.isRead && <div className="unread-dot"></div>}
            </Link>
          ))}
        </div>
      )}

      {hasMore && notifications.length > 0 && (
        <button 
          className="load-more-btn"
          onClick={handleLoadMore}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};

export default Notifications;
