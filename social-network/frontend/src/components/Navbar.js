import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useChat } from '../context/ChatContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount: notificationCount } = useNotifications();
  const { unreadCount: messageCount } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${searchQuery.trim()}`);
      setSearchQuery('');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar glass-effect">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">✨</span>
          <span className="logo-text gradient-text">SocialNet</span>
        </Link>

        {isAuthenticated ? (
          <>
            {/* Search Bar */}
            <form className="navbar-search" onSubmit={handleSearch}>
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Desktop Navigation */}
            <div className="navbar-links">
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                <span>Home</span>
              </Link>

              <Link to="/friends" className={`nav-link ${isActive('/friends') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                <span>Friends</span>
              </Link>

              <Link to="/chat" className={`nav-link ${isActive('/chat') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <span>Messages</span>
                {messageCount > 0 && (
                  <span className="nav-badge">{messageCount > 99 ? '99+' : messageCount}</span>
                )}
              </Link>

              <Link to="/notifications" className={`nav-link ${isActive('/notifications') ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                <span>Notifications</span>
                {notificationCount > 0 && (
                  <span className="nav-badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
                )}
              </Link>

              {/* Profile Dropdown */}
              <div className="nav-profile">
                <Link to={`/profile/${user?.username}`} className="profile-trigger">
                  <img 
                    src={user?.avatar || '/default-avatar.png'} 
                    alt={user?.username}
                    className="nav-avatar"
                  />
                  <span className="profile-name">{user?.username}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dropdown-arrow">
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                </Link>
                <div className="profile-dropdown">
                  <Link to={`/profile/${user?.username}`} className="dropdown-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    My Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                    Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button className="mobile-menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {showMobileMenu ? (
                  <path d="M18 6L6 18M6 6l12 12"/>
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                )}
              </svg>
            </button>
          </>
        ) : (
          <div className="navbar-links auth-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && isAuthenticated && (
        <div className="mobile-menu animate-fade-in">
          <Link to="/" className="mobile-link" onClick={() => setShowMobileMenu(false)}>
            🏠 Home
          </Link>
          <Link to="/explore" className="mobile-link" onClick={() => setShowMobileMenu(false)}>
            🔍 Explore
          </Link>
          <Link to="/chat" className="mobile-link" onClick={() => setShowMobileMenu(false)}>
            💬 Messages {messageCount > 0 && `(${messageCount})`}
          </Link>
          <Link to="/notifications" className="mobile-link" onClick={() => setShowMobileMenu(false)}>
            🔔 Notifications {notificationCount > 0 && `(${notificationCount})`}
          </Link>
          <Link to="/friends" className="mobile-link" onClick={() => setShowMobileMenu(false)}>
            👥 Friends
          </Link>
          <Link to={`/profile/${user?.username}`} className="mobile-link" onClick={() => setShowMobileMenu(false)}>
            👤 Profile
          </Link>
          <button onClick={handleLogout} className="mobile-link logout">
            🚪 Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
