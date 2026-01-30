import React, { useState, useRef } from 'react';
import { FaImage, FaVideo, FaSmile, FaGlobe, FaUserFriends, FaLock, FaCaretDown } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import postService from '../../services/postService';
import './CreatePost.css';

const CreatePost = ({ onPostCreated, courseId = null }) => {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const textareaRef = useRef(null);
  const { user } = useAuth();

  const visibilityOptions = [
    { value: 'public', icon: <FaGlobe />, label: 'Public', description: 'Anyone can see' },
    { value: 'followers', icon: <FaUserFriends />, label: 'Followers', description: 'Only followers can see' },
    { value: 'private', icon: <FaLock />, label: 'Only me', description: 'Only you can see' }
  ];

  const currentVisibility = visibilityOptions.find(v => v.value === visibility);

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const postData = {
        content: content.trim(),
        visibility
      };
      
      if (courseId) {
        postData.moodleCourseId = courseId;
      }

      const response = await postService.createPost(postData);
      if (response.success) {
        setContent('');
        setIsExpanded(false);
        if (onPostCreated) {
          onPostCreated(response.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`create-post card ${isExpanded ? 'expanded' : ''}`}>
      <form onSubmit={handleSubmit}>
        <div className="create-post-main">
          <Avatar 
            src={user?.avatar} 
            alt={user?.username} 
            size="medium"
          />
          <div 
            className="input-wrapper"
            onClick={() => textareaRef.current?.focus()}
          >
            <textarea
              ref={textareaRef}
              placeholder={`What's on your mind, ${user?.firstName || user?.username}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={handleFocus}
              maxLength={5000}
              rows={isExpanded ? 4 : 1}
            />
          </div>
        </div>
        
        {error && <div className="create-post-error">{error}</div>}
        
        <div className="create-post-divider" />
        
        <div className="create-post-actions">
          <div className="action-buttons">
            <button type="button" className="action-item">
              <FaImage className="icon-image" />
              <span>Photo</span>
            </button>
            <button type="button" className="action-item">
              <FaVideo className="icon-video" />
              <span>Video</span>
            </button>
            <button type="button" className="action-item">
              <FaSmile className="icon-feeling" />
              <span>Feeling</span>
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="create-post-footer">
            <div className="visibility-selector">
              <button 
                type="button"
                className="visibility-btn"
                onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              >
                {currentVisibility?.icon}
                <span>{currentVisibility?.label}</span>
                <FaCaretDown />
              </button>
              
              {showVisibilityMenu && (
                <>
                  <div 
                    className="visibility-overlay" 
                    onClick={() => setShowVisibilityMenu(false)} 
                  />
                  <div className="visibility-menu">
                    <div className="visibility-menu-header">
                      <h4>Who can see your post?</h4>
                    </div>
                    {visibilityOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        className={`visibility-option ${visibility === option.value ? 'selected' : ''}`}
                        onClick={() => {
                          setVisibility(option.value);
                          setShowVisibilityMenu(false);
                        }}
                      >
                        <div className="visibility-option-icon">{option.icon}</div>
                        <div className="visibility-option-info">
                          <span className="visibility-option-label">{option.label}</span>
                          <span className="visibility-option-desc">{option.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <button 
              type="submit" 
              className="post-btn"
              disabled={loading || !content.trim()}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePost;
