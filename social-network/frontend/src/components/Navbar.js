import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useChat } from '../context/ChatContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount: notificationCount } = useNotifications();
  const { unreadCount: messageCount } = useChat();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          SocialNet
        </Link>

        {isAuthenticated ? (
          <>
            <div className="navbar-search">
              <input
                type="text"
                placeholder="Search users..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    navigate(`/search?q=${e.target.value.trim()}`);
                  }
                }}
              />
            </div>

            <div className="navbar-links">
              <Link to="/" className="nav-link">
                <span className="nav-icon">🏠</span>
                <span className="nav-text">Home</span>
              </Link>

              <Link to="/chat" className="nav-link">
                <span className="nav-icon">💬</span>
                <span className="nav-text">Messages</span>
                {messageCount > 0 && (
                  <span className="badge">{messageCount > 99 ? '99+' : messageCount}</span>
                )}
              </Link>

              <Link to="/notifications" className="nav-link">
                <span className="nav-icon">🔔</span>
                <span className="nav-text">Notifications</span>
                {notificationCount > 0 && (
                  <span className="badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
                )}
              </Link>

              <Link to={`/profile/${user?.username}`} className="nav-link">
                <span className="nav-icon">👤</span>
                <span className="nav-text">Profile</span>
              </Link>

              <button onClick={handleLogout} className="nav-link logout-btn">
                <span className="nav-icon">🚪</span>
                <span className="nav-text">Logout</span>
              </button>
            </div>
          </>
        ) : (
          <div className="navbar-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link btn-primary">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
