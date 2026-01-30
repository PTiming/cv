import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Post.css';

const Post = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likes?.some(like => 
    (typeof like === 'string' ? like : like._id) === user?.id
  ));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [loading, setLoading] = useState(false);

  const isOwner = user?.id === post.user?._id;

  const handleLike = async () => {
    try {
      if (liked) {
        await api.post(`/posts/${post._id}/unlike`);
        setLikeCount(prev => prev - 1);
      } else {
        await api.post(`/posts/${post._id}/like`);
        setLikeCount(prev => prev + 1);
      }
      setLiked(!liked);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/comments/${post._id}`, {
        content: newComment
      });
      setComments([response.data.comment, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        const response = await api.get(`/comments/post/${post._id}`);
        setComments(response.data.comments);
      } catch (error) {
        console.error('Load comments error:', error);
      }
    }
    setShowComments(!showComments);
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    setLoading(true);
    try {
      const response = await api.put(`/posts/${post._id}`, {
        content: editContent
      });
      if (onUpdate) onUpdate(response.data.post);
      setIsEditing(false);
    } catch (error) {
      console.error('Edit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await api.delete(`/posts/${post._id}`);
      if (onDelete) onDelete(post._id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-author">
          <img 
            src={post.user?.avatar || '/default-avatar.png'} 
            alt={post.user?.username}
            className="avatar"
          />
          <div className="author-info">
            <a href={`/profile/${post.user?.username}`} className="author-name">
              {post.user?.username}
            </a>
            <span className="post-time">{formatDate(post.createdAt)}</span>
          </div>
        </div>
        
        {isOwner && (
          <div className="post-actions">
            <button onClick={() => setIsEditing(true)} className="action-btn">✏️</button>
            <button onClick={handleDelete} className="action-btn delete">🗑️</button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="edit-form">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="edit-textarea"
          />
          <div className="edit-buttons">
            <button onClick={handleEdit} disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="post-content">
          <p>{post.content}</p>
          {post.image && (
            <img src={post.image} alt="Post" className="post-image" />
          )}
        </div>
      )}

      <div className="post-stats">
        <span>{likeCount} likes</span>
        <span>{comments.length} comments</span>
      </div>

      <div className="post-buttons">
        <button 
          onClick={handleLike} 
          className={`post-btn ${liked ? 'liked' : ''}`}
        >
          {liked ? '❤️' : '🤍'} Like
        </button>
        <button onClick={loadComments} className="post-btn">
          💬 Comment
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="comment-input"
            />
            <button type="submit" className="btn btn-primary">Post</button>
          </form>

          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment._id} className="comment">
                <img 
                  src={comment.user?.avatar || '/default-avatar.png'} 
                  alt={comment.user?.username}
                  className="comment-avatar"
                />
                <div className="comment-content">
                  <a href={`/profile/${comment.user?.username}`} className="comment-author">
                    {comment.user?.username}
                  </a>
                  <p>{comment.content}</p>
                  <span className="comment-time">{formatDate(comment.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
