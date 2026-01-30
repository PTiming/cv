import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Post from '../components/Post';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [feedType, setFeedType] = useState('all'); // 'all' or 'following'

  useEffect(() => {
    fetchPosts();
  }, [feedType]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const endpoint = feedType === 'following' ? '/posts/feed' : '/posts';
      const response = await api.get(endpoint);
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setPosting(true);
    try {
      const response = await api.post('/posts', { content: newPost });
      setPosts([response.data.post, ...posts]);
      setNewPost('');
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleUpdatePost = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Create Post */}
        <div className="create-post-card">
          <div className="create-post-header">
            <img 
              src={user?.avatar || '/default-avatar.png'} 
              alt={user?.username}
              className="user-avatar"
            />
            <form onSubmit={handleCreatePost} className="create-post-form">
              <textarea
                placeholder={`What's on your mind, ${user?.username}?`}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={3}
              />
              <button type="submit" disabled={posting || !newPost.trim()}>
                {posting ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>
        </div>

        {/* Feed Type Toggle */}
        <div className="feed-toggle">
          <button 
            className={feedType === 'all' ? 'active' : ''} 
            onClick={() => setFeedType('all')}
          >
            All Posts
          </button>
          <button 
            className={feedType === 'following' ? 'active' : ''} 
            onClick={() => setFeedType('following')}
          >
            Following
          </button>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="loading">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="no-posts">
            {feedType === 'following' 
              ? 'No posts from people you follow. Start following people!'
              : 'No posts yet. Be the first to post!'}
          </div>
        ) : (
          <div className="posts-feed">
            {posts.map(post => (
              <Post 
                key={post._id} 
                post={post}
                onUpdate={handleUpdatePost}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
