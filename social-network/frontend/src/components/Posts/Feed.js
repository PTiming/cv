import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import './Posts.css';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (pageNum = 1) => {
    try {
      const res = await api.get(`/posts?page=${pageNum}&limit=10`);
      if (pageNum === 1) {
        setPosts(res.data.posts);
      } else {
        setPosts(prev => [...prev, ...res.data.posts]);
      }
      setHasMore(res.data.currentPage < res.data.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadPosts(page + 1);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="main-container">
        <div className="loading">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <CreatePost onPostCreated={handlePostCreated} />
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="no-posts">
            <h3>No posts yet</h3>
            <p>Be the first to share something!</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostDeleted={handlePostDeleted}
                onPostUpdated={handlePostUpdated}
              />
            ))}
            
            {hasMore && (
              <button className="load-more-btn" onClick={loadMore}>
                Load More
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Feed;
