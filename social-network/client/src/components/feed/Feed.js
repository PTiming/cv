import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import Loading from '../common/Loading';
import postService from '../../services/postService';
import './Feed.css';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await postService.getFeed(pageNum);
      if (response.success) {
        if (append) {
          setPosts(prev => [...prev, ...response.data]);
        } else {
          setPosts(response.data);
        }
        setHasMore(pageNum < response.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  if (loading && posts.length === 0) {
    return <Loading text="Loading your feed..." />;
  }

  return (
    <div className="feed-container">
      <CreatePost onPostCreated={handlePostCreated} />
      
      <div className="feed-posts">
        {posts.length === 0 ? (
          <div className="empty-feed">
            <h3>Welcome to SocialLMS!</h3>
            <p>Follow other users to see their posts in your feed, or create your first post above.</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post._id} 
              post={post} 
              onDelete={handlePostDeleted}
            />
          ))
        )}
      </div>

      {hasMore && posts.length > 0 && (
        <button 
          className="load-more-btn"
          onClick={handleLoadMore}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};

export default Feed;
