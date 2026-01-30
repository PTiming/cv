import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, FaCompass, FaBell, FaUser, FaBook, FaSignOutAlt, 
  FaSearch, FaCog, FaUserShield, FaCaretDown, FaTimes,
  FaComments, FaUsers, FaFolderOpen, FaTasks
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import * as messageService from '../../services/messageService';
import Avatar from './Avatar';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount, socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const { data } = await messageService.getUnreadCount();
        setUnreadMessages(data.data.unreadCount);
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    if (isAuthenticated) {
      fetchUnreadMessages();
    }
  }, [isAuthenticated]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      setUnreadMessages(prev => prev + 1);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  if (!isAuthenticated) return null;

  const isActive = (path) => location.pathname === path;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowMobileSearch(false);
    }
  };

  const isAdminOrMod = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left Section - Logo */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">S</div>
            <span className="logo-text">EduConnect</span>
          </Link>
        </div>

        {/* Center Section - Search */}
        <div className={`navbar-center ${showMobileSearch ? 'mobile-active' : ''}`}>
          <form onSubmit={handleSearch} className="search-form">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search EduConnect" 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {showMobileSearch && (
              <button 
                type="button" 
                className="search-close"
                onClick={() => setShowMobileSearch(false)}
              >
                <FaTimes />
              </button>
            )}
          </form>
        </div>

        {/* Navigation Links */}
        <div className="navbar-nav">
          <Link 
            to="/" 
            className={`nav-item ${isActive('/') ? 'active' : ''}`} 
            title="Home"
          >
            <FaHome />
          </Link>
          
          <Link 
            to="/explore" 
            className={`nav-item ${isActive('/explore') ? 'active' : ''}`} 
            title="Explore"
          >
            <FaCompass />
          </Link>

          <Link 
            to="/messages" 
            className={`nav-item notification-item ${isActive('/messages') ? 'active' : ''}`} 
            title="Messages"
          >
            <FaComments />
            {unreadMessages > 0 && (
              <span className="notification-badge">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </Link>

          <Link 
            to="/groups" 
            className={`nav-item ${isActive('/groups') ? 'active' : ''}`} 
            title="Groups"
          >
            <FaUsers />
          </Link>

          <Link 
            to="/resources" 
            className={`nav-item ${isActive('/resources') ? 'active' : ''}`} 
            title="Resources"
          >
            <FaFolderOpen />
          </Link>

          <Link 
            to="/assignments" 
            className={`nav-item ${isActive('/assignments') ? 'active' : ''}`} 
            title="Assignments"
          >
            <FaTasks />
          </Link>

          <Link 
            to="/moodle" 
            className={`nav-item ${isActive('/moodle') ? 'active' : ''}`} 
            title="Courses"
          >
            <FaBook />
          </Link>

          <Link 
            to="/notifications" 
            className={`nav-item notification-item ${isActive('/notifications') ? 'active' : ''}`} 
            title="Notifications"
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* Right Section - User Menu */}
        <div className="navbar-right">
          <button 
            className="mobile-search-btn"
            onClick={() => setShowMobileSearch(true)}
          >
            <FaSearch />
          </button>

          <div className="user-menu">
            <button 
              className="user-menu-trigger"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <Avatar 
                src={user?.avatar} 
                alt={user?.username} 
                size="small"
              />
              <span className="user-name">{user?.firstName || user?.username}</span>
              <FaCaretDown className={`dropdown-arrow ${showDropdown ? 'open' : ''}`} />
            </button>

            {showDropdown && (
              <>
                <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <Avatar src={user?.avatar} alt={user?.username} size="medium" />
                    <div className="dropdown-user-info">
                      <span className="dropdown-name">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user?.username}
                      </span>
                      <span className="dropdown-role">{user?.role}</span>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider" />
                  
                  <Link 
                    to={`/profile/${user?.username}`} 
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    <FaUser />
                    <span>View Profile</span>
                  </Link>
                  
                  <Link 
                    to="/settings" 
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    <FaCog />
                    <span>Settings</span>
                  </Link>

                  {isAdminOrMod && (
                    <Link 
                      to="/admin" 
                      className="dropdown-item admin-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaUserShield />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  
                  <div className="dropdown-divider" />
                  
                  <button 
                    onClick={() => { logout(); setShowDropdown(false); }} 
                    className="dropdown-item logout-item"
                  >
                    <FaSignOutAlt />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
