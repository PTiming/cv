import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import postService from '../../services/postService';
import './CreatePost.css';

const CreatePost = ({ onPostCreated, courseId = null }) => {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

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
    <div className="create-post">
      <form onSubmit={handleSubmit}>
        <div className="create-post-header">
          <Avatar 
            src={user?.avatar} 
            alt={user?.username} 
            size="medium"
          />
          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={5000}
            rows={3}
          />
        </div>
        
        {error && <div className="create-post-error">{error}</div>}
        
        <div className="create-post-footer">
          <select 
            value={visibility} 
            onChange={(e) => setVisibility(e.target.value)}
            className="visibility-select"
          >
            <option value="public">🌍 Public</option>
            <option value="followers">👥 Followers only</option>
            <option value="private">🔒 Private</option>
          </select>
          
          <button 
            type="submit" 
            className="post-btn"
            disabled={loading || !content.trim()}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
