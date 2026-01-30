import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaEllipsisH, FaTrash, FaEdit } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import postService from '../../services/postService';
import './PostCard.css';

const PostCard = ({ post, onDelete, onUpdate }) => {
  const [liked, setLiked] = useState(post.likes?.includes(post.author?._id) || false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const { user } = useAuth();

  const isOwner = user?._id === post.author?._id;

  const handleLike = async () => {
    try {
      if (liked) {
        await postService.unlikePost(post._id);
        setLikeCount(prev => prev - 1);
      } else {
        await postService.likePost(post._id);
        setLikeCount(prev => prev + 1);
      }
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postService.deletePost(post._id);
        if (onDelete) {
          onDelete(post._id);
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
    setShowMenu(false);
  };

  const handleShare = async () => {
    try {
      await postService.sharePost(post._id);
      alert('Post shared successfully!');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await postService.addComment(post._id, comment.trim());
      if (response.success) {
        setComments(prev => [response.data, ...prev]);
        setComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <Link to={`/profile/${post.author?.username}`} className="post-author">
          <Avatar 
            src={post.author?.avatar} 
            alt={post.author?.username}
            size="medium"
          />
          <div className="post-author-info">
            <span className="author-name">
              {post.author?.firstName && post.author?.lastName 
                ? `${post.author.firstName} ${post.author.lastName}`
                : post.author?.username}
            </span>
            <span className="post-time">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              {post.isEdited && ' • Edited'}
            </span>
          </div>
        </Link>

        {isOwner && (
          <div className="post-menu">
            <button 
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              <FaEllipsisH />
            </button>
            {showMenu && (
              <div className="menu-dropdown">
                <button onClick={handleDelete}>
                  <FaTrash /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="post-content">
        <p>{post.content}</p>
        {post.images && post.images.length > 0 && (
          <div className="post-images">
            {post.images.map((img, index) => (
              <img key={index} src={img.url} alt="Post" />
            ))}
          </div>
        )}
      </div>

      {/* Shared Post */}
      {post.isShared && post.originalPost && (
        <div className="shared-post">
          <Link to={`/profile/${post.originalPost.author?.username}`} className="shared-author">
            <Avatar 
              src={post.originalPost.author?.avatar} 
              alt={post.originalPost.author?.username}
              size="small"
            />
            <span>{post.originalPost.author?.username}</span>
          </Link>
          <p>{post.originalPost.content}</p>
        </div>
      )}

      {/* Post Stats */}
      <div className="post-stats">
        <span>{likeCount} likes</span>
        <span>{comments.length} comments</span>
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <button 
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          {liked ? <FaHeart /> : <FaRegHeart />}
          Like
        </button>
        <button 
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <FaComment />
          Comment
        </button>
        <button className="action-btn" onClick={handleShare}>
          <FaShare />
          Share
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="post-comments">
          <form onSubmit={handleComment} className="comment-form">
            <Avatar src={user?.avatar} alt={user?.username} size="small" />
            <input
              type="text"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit" disabled={!comment.trim()}>Post</button>
          </form>

          <div className="comments-list">
            {comments.map((c) => (
              <div key={c._id} className="comment-item">
                <Avatar 
                  src={c.author?.avatar} 
                  alt={c.author?.username} 
                  size="small"
                />
                <div className="comment-content">
                  <Link to={`/profile/${c.author?.username}`} className="comment-author">
                    {c.author?.username}
                  </Link>
                  <p>{c.content}</p>
                  <span className="comment-time">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
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
