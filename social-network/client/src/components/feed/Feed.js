import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserFriends, FaBook, FaClock, FaCalendarAlt, FaFire, FaStar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import Loading from '../common/Loading';
import Avatar from '../common/Avatar';
import postService from '../../services/postService';
import userService from '../../services/userService';
import './Feed.css';

const Feed = ({ explore = false }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const { user } = useAuth();

  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = explore 
        ? await postService.getExplorePosts(pageNum)
        : await postService.getFeed(pageNum);
      
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

  const fetchSuggestions = async () => {
    try {
      const response = await userService.getSuggestions(5);
      if (response.success) {
        setSuggestions(response.data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchSuggestions();
  }, [explore]);

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
    return (
      <div className="feed-page">
        <Loading text="Loading your feed..." />
      </div>
    );
  }

  return (
    <div className="feed-page">
      <div className="page-container">
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          <nav className="sidebar-nav">
            <Link to={`/profile/${user?.username}`} className="sidebar-item user-profile-link">
              <Avatar src={user?.avatar} alt={user?.username} size="small" />
              <span>{user?.firstName || user?.username}</span>
            </Link>
            
            <Link to="/" className="sidebar-item">
              <div className="sidebar-icon home-icon">
                <FaFire />
              </div>
              <span>Feed</span>
            </Link>
            
            <Link to="/explore" className="sidebar-item">
              <div className="sidebar-icon explore-icon">
                <FaStar />
              </div>
              <span>Explore</span>
            </Link>
            
            <Link to="/moodle" className="sidebar-item">
              <div className="sidebar-icon courses-icon">
                <FaBook />
              </div>
              <span>My Courses</span>
            </Link>
            
            <Link to={`/profile/${user?.username}?tab=following`} className="sidebar-item">
              <div className="sidebar-icon friends-icon">
                <FaUserFriends />
              </div>
              <span>Following</span>
            </Link>

            <div className="sidebar-divider" />

            <div className="sidebar-section-title">Shortcuts</div>
            
            <Link to="/moodle" className="sidebar-item">
              <div className="sidebar-icon deadline-icon">
                <FaClock />
              </div>
              <span>Deadlines</span>
            </Link>
            
            <Link to="/notifications" className="sidebar-item">
              <div className="sidebar-icon calendar-icon">
                <FaCalendarAlt />
              </div>
              <span>Activity</span>
            </Link>
          </nav>

          <footer className="sidebar-footer">
            <p>EduConnect © 2024</p>
            <div className="footer-links">
              <a href="#">About</a>
              <a href="#">Help</a>
              <a href="#">Privacy</a>
            </div>
          </footer>
        </aside>

        {/* Main Feed */}
        <main className="main-feed">
          {!explore && <CreatePost onPostCreated={handlePostCreated} />}
          
          {explore && (
            <div className="explore-header card">
              <FaStar className="explore-icon" />
              <div>
                <h2>Explore</h2>
                <p>Discover what's happening in the community</p>
              </div>
            </div>
          )}
          
          <div className="feed-posts">
            {posts.length === 0 ? (
              <div className="empty-feed card">
                <div className="empty-illustration">🌟</div>
                <h3>Welcome to EduConnect!</h3>
                <p>
                  {explore 
                    ? "No public posts yet. Be the first to share something!"
                    : "Follow other users to see their posts in your feed, or create your first post above."}
                </p>
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
              {loading ? 'Loading...' : 'Load More Posts'}
            </button>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          {/* User Card */}
          <div className="user-card card">
            <div className="user-card-cover"></div>
            <div className="user-card-content">
              <Avatar src={user?.avatar} alt={user?.username} size="large" className="user-card-avatar" />
              <h3>{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}</h3>
              <p className="user-card-bio">{user?.bio || 'No bio yet'}</p>
              <Link to={`/profile/${user?.username}`} className="view-profile-btn">
                View Profile
              </Link>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="suggestions-card card">
              <h4>People you may know</h4>
              <div className="suggestions-list">
                {suggestions.map(suggestion => (
                  <div key={suggestion._id} className="suggestion-item">
                    <Link to={`/profile/${suggestion.username}`} className="suggestion-user">
                      <Avatar src={suggestion.avatar} alt={suggestion.username} size="small" />
                      <div className="suggestion-info">
                        <span className="suggestion-name">
                          {suggestion.firstName && suggestion.lastName 
                            ? `${suggestion.firstName} ${suggestion.lastName}`
                            : suggestion.username}
                        </span>
                        <span className="suggestion-meta">@{suggestion.username}</span>
                      </div>
                    </Link>
                    <button className="follow-suggestion-btn">Follow</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Topics */}
          <div className="trending-card card">
            <h4>Trending in Courses</h4>
            <div className="trending-list">
              <div className="trending-item">
                <span className="trending-topic">#FinalExams</span>
                <span className="trending-count">128 posts</span>
              </div>
              <div className="trending-item">
                <span className="trending-topic">#ProjectDeadline</span>
                <span className="trending-count">89 posts</span>
              </div>
              <div className="trending-item">
                <span className="trending-topic">#StudyGroup</span>
                <span className="trending-count">56 posts</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Feed;
