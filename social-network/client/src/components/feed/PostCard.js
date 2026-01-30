import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHeart, FaRegHeart, FaComment, FaShare, FaEllipsisH, 
  FaTrash, FaGlobe, FaUserFriends, FaLock, FaBook,
  FaThumbsUp, FaRegThumbsUp
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import postService from '../../services/postService';
import './PostCard.css';

const PostCard = ({ post, onDelete, onUpdate }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const { user } = useAuth();

  const isOwner = user?._id === post.author?._id;
  const isModerator = user?.role === 'moderator' || user?.role === 'admin';

  useEffect(() => {
    setLiked(post.likes?.includes(user?._id) || false);
  }, [post.likes, user?._id]);

  const getVisibilityIcon = () => {
    switch (post.visibility) {
      case 'public': return <FaGlobe title="Public" />;
      case 'followers': return <FaUserFriends title="Followers only" />;
      case 'private': return <FaLock title="Private" />;
      case 'course': return <FaBook title="Course members" />;
      default: return <FaGlobe />;
    }
  };

  const handleLike = async () => {
    try {
      setIsLikeAnimating(true);
      if (liked) {
        await postService.unlikePost(post._id);
        setLikeCount(prev => prev - 1);
      } else {
        await postService.likePost(post._id);
        setLikeCount(prev => prev + 1);
      }
      setLiked(!liked);
      setTimeout(() => setIsLikeAnimating(false), 300);
    } catch (error) {
      console.error('Error toggling like:', error);
      setIsLikeAnimating(false);
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

  const renderContent = (text) => {
    // Parse mentions and hashtags
    const parts = text.split(/(@\w+|#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <Link key={index} to={`/profile/${username}`} className="mention">
            {part}
          </Link>
        );
      } else if (part.startsWith('#')) {
        return (
          <Link key={index} to={`/search?q=${part.slice(1)}`} className="hashtag">
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <article className="post-card card">
      {/* Post Header */}
      <header className="post-header">
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
            <div className="post-meta">
              <span className="post-time">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
              <span className="post-visibility">
                {getVisibilityIcon()}
              </span>
              {post.isEdited && <span className="edited-badge">Edited</span>}
            </div>
          </div>
        </Link>

        {(isOwner || isModerator) && (
          <div className="post-menu">
            <button 
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Post options"
            >
              <FaEllipsisH />
            </button>
            {showMenu && (
              <>
                <div className="menu-overlay" onClick={() => setShowMenu(false)} />
                <div className="menu-dropdown">
                  <button onClick={handleDelete} className="menu-item danger">
                    <FaTrash /> 
                    <span>Delete Post</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Post Content */}
      <div className="post-content">
        <p>{renderContent(post.content)}</p>
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className={`post-images images-${Math.min(post.images.length, 4)}`}>
          {post.images.slice(0, 4).map((img, index) => (
            <div key={index} className="image-container">
              <img src={img.url} alt={`Post image ${index + 1}`} loading="lazy" />
              {index === 3 && post.images.length > 4 && (
                <div className="more-images">+{post.images.length - 4}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Shared Post */}
      {post.isShared && post.originalPost && (
        <div className="shared-post">
          <div className="shared-post-header">
            <Link to={`/profile/${post.originalPost.author?.username}`} className="shared-author">
              <Avatar 
                src={post.originalPost.author?.avatar} 
                alt={post.originalPost.author?.username}
                size="small"
              />
              <div className="shared-author-info">
                <span className="shared-author-name">{post.originalPost.author?.username}</span>
                <span className="shared-post-time">
                  {formatDistanceToNow(new Date(post.originalPost.createdAt), { addSuffix: true })}
                </span>
              </div>
            </Link>
          </div>
          <p className="shared-post-content">{post.originalPost.content}</p>
        </div>
      )}

      {/* Engagement Stats */}
      {(likeCount > 0 || comments.length > 0) && (
        <div className="post-stats">
          {likeCount > 0 && (
            <div className="stat-item likes-stat">
              <div className="like-icon-container">
                <FaThumbsUp />
              </div>
              <span>{likeCount}</span>
            </div>
          )}
          {comments.length > 0 && (
            <button 
              className="stat-item comments-stat"
              onClick={() => setShowComments(!showComments)}
            >
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* Post Actions */}
      <div className="post-actions">
        <button 
          className={`action-btn ${liked ? 'liked' : ''} ${isLikeAnimating ? 'animating' : ''}`}
          onClick={handleLike}
        >
          {liked ? <FaThumbsUp /> : <FaRegThumbsUp />}
          <span>Like</span>
        </button>
        <button 
          className={`action-btn ${showComments ? 'active' : ''}`}
          onClick={() => setShowComments(!showComments)}
        >
          <FaComment />
          <span>Comment</span>
        </button>
        <button className="action-btn" onClick={handleShare}>
          <FaShare />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="post-comments">
          <form onSubmit={handleComment} className="comment-form">
            <Avatar src={user?.avatar} alt={user?.username} size="small" />
            <div className="comment-input-container">
              <input
                type="text"
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              {comment.trim() && (
                <button type="submit" className="comment-submit">Post</button>
              )}
            </div>
          </form>

          <div className="comments-list">
            {comments.map((c) => (
              <div key={c._id} className="comment-item">
                <Avatar 
                  src={c.author?.avatar} 
                  alt={c.author?.username} 
                  size="small"
                />
                <div className="comment-bubble">
                  <Link to={`/profile/${c.author?.username}`} className="comment-author">
                    {c.author?.firstName && c.author?.lastName 
                      ? `${c.author.firstName} ${c.author.lastName}`
                      : c.author?.username}
                  </Link>
                  <p className="comment-text">{c.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;
