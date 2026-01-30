import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCompass, FaBell, FaUser, FaBook, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useSocket();

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          SocialLMS
        </Link>

        <div className="navbar-search">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="search-input"
          />
        </div>

        <div className="navbar-links">
          <Link to="/" className="nav-link" title="Home">
            <FaHome />
            <span>Home</span>
          </Link>
          
          <Link to="/explore" className="nav-link" title="Explore">
            <FaCompass />
            <span>Explore</span>
          </Link>

          <Link to="/moodle" className="nav-link" title="Courses">
            <FaBook />
            <span>Courses</span>
          </Link>

          <Link to="/notifications" className="nav-link notification-link" title="Notifications">
            <FaBell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
            <span>Notifications</span>
          </Link>

          <Link to={`/profile/${user?.username}`} className="nav-link" title="Profile">
            <FaUser />
            <span>Profile</span>
          </Link>

          <button onClick={logout} className="nav-link logout-btn" title="Logout">
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
