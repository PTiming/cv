import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Posts.css';

const PostCard = ({ post, onPostDeleted, onPostUpdated }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);

  const isOwner = user && (user.id === post.user?._id || user._id === post.user?._id);
  const isLiked = user && likes.some(like => 
    like === user.id || like === user._id || like._id === user.id || like._id === user._id
  );

  const handleLike = async () => {
    try {
      const res = await api.put(`/posts/${post._id}/like`);
      setLikes(res.data);
      if (onPostUpdated) {
        onPostUpdated({ ...post, likes: res.data });
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await api.delete(`/posts/${post._id}`);
      if (onPostDeleted) {
        onPostDeleted(post._id);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setLoading(true);
    try {
      const res = await api.post(`/posts/${post._id}/comments`, { text: comment });
      setComments(res.data);
      setComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await api.delete(`/posts/${post._id}/comments/${commentId}`);
      setComments(res.data);
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.user?._id}`} className="post-author">
          <div className="avatar">
            {post.user?.avatar ? (
              <img src={post.user.avatar} alt={post.user.name} />
            ) : (
              <span>{post.user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="author-info">
            <span className="author-name">{post.user?.name}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
          </div>
        </Link>
        
        {isOwner && (
          <button className="delete-btn" onClick={handleDelete} title="Delete post">
            🗑️
          </button>
        )}
      </div>

      <div className="post-content">
        <p>{post.content}</p>
        {post.image && <img src={post.image} alt="Post" className="post-image" />}
      </div>

      <div className="post-stats">
        <span>{likes.length} {likes.length === 1 ? 'like' : 'likes'}</span>
        <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
      </div>

      <div className="post-actions">
        <button 
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          {isLiked ? '❤️' : '🤍'} Like
        </button>
        <button 
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 Comment
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <form onSubmit={handleAddComment} className="comment-form">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              maxLength={300}
            />
            <button type="submit" disabled={loading || !comment.trim()}>
              {loading ? '...' : '→'}
            </button>
          </form>
          
          <div className="comments-list">
            {comments.map((c) => (
              <div key={c._id} className="comment">
                <Link to={`/profile/${c.user?._id}`} className="comment-author">
                  <div className="avatar small">
                    {c.user?.avatar ? (
                      <img src={c.user.avatar} alt={c.user.name} />
                    ) : (
                      <span>{c.user?.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </Link>
                <div className="comment-content">
                  <div className="comment-bubble">
                    <Link to={`/profile/${c.user?._id}`} className="comment-name">
                      {c.user?.name}
                    </Link>
                    <p>{c.text}</p>
                  </div>
                  <div className="comment-meta">
                    <span>{formatDate(c.createdAt)}</span>
                    {user && (user.id === c.user?._id || user._id === c.user?._id) && (
                      <button 
                        className="delete-comment-btn"
                        onClick={() => handleDeleteComment(c._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
