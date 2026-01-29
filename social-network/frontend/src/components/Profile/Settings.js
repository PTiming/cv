import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Profile.css';

// Validate URL format for avatar
const isValidImageUrl = (url) => {
  if (!url) return true; // Empty is valid
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    // Check for common image extensions (optional but recommended)
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    return imageExtensions.test(parsedUrl.pathname) || parsedUrl.pathname.includes('/');
  } catch {
    return false;
  }
};

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate avatar URL
    if (formData.avatar && !isValidImageUrl(formData.avatar)) {
      setError('Please enter a valid image URL (http/https protocol)');
      setLoading(false);
      return;
    }

    try {
      const res = await api.put('/users/profile', formData);
      updateUser(res.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="main-container">
      <div className="settings-card">
        <h2>Settings</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              maxLength={200}
              rows={3}
            />
            <span className="char-count">{formData.bio.length}/200</span>
          </div>
          
          <div className="form-group">
            <label htmlFor="avatar">Avatar URL</label>
            <input
              type="url"
              id="avatar"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          
          {formData.avatar && (
            <div className="avatar-preview">
              <img src={formData.avatar} alt="Avatar preview" />
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
        
        <hr className="settings-divider" />
        
        <div className="danger-zone">
          <h3>Account</h3>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
