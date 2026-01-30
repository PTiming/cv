import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          Moodle API
        </Link>
        
        <ul className="navbar-nav">
          <li>
            <Link to="/dashboard" className={isActive('/dashboard')}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/courses" className={isActive('/courses')}>
              Courses
            </Link>
          </li>
          <li>
            <Link to="/settings" className={isActive('/settings')}>
              Settings
            </Link>
          </li>
        </ul>

        <div className="navbar-user">
          <span>Welcome, {user?.username}</span>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
