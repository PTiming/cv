import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import PostCard from '../Posts/PostCard';
import './Profile.css';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = currentUser && (currentUser.id === id || currentUser._id === id);

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get(`/users/${id}`);
      setProfile(res.data);
    } catch (err) {
      setError('User not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadUserPosts = useCallback(async () => {
    try {
      const res = await api.get(`/users/${id}/posts`);
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Error loading posts:', err);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
    loadUserPosts();
  }, [loadProfile, loadUserPosts]);

  useEffect(() => {
    if (profile && currentUser) {
      const following = profile.followers?.some(
        f => f._id === currentUser.id || f._id === currentUser._id
      );
      setIsFollowing(following);
    }
  }, [profile, currentUser]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      await api.put(`/users/${id}/follow`);
      await loadProfile();
    } catch (err) {
      console.error('Error following user:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="main-container">
        <div className="error-container">
          <h2>User not found</h2>
          <p>The user you're looking for doesn't exist.</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-cover"></div>
        
        <div className="profile-info">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} />
            ) : (
              <span>{profile.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          
          <div className="profile-details">
            <h1>{profile.name}</h1>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">{posts.length}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat">
                <span className="stat-value">{profile.followers?.length || 0}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat">
                <span className="stat-value">{profile.following?.length || 0}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
          </div>
          
          <div className="profile-actions">
            {isOwnProfile ? (
              <Link to="/settings" className="btn btn-secondary">
                Edit Profile
              </Link>
            ) : (
              <button
                className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button
            className={`tab ${activeTab === 'followers' ? 'active' : ''}`}
            onClick={() => setActiveTab('followers')}
          >
            Followers
          </button>
          <button
            className={`tab ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            Following
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'posts' && (
            <div className="posts-list">
              {posts.length === 0 ? (
                <div className="no-posts">
                  <h3>No posts yet</h3>
                  <p>{isOwnProfile ? 'Share your first post!' : 'This user hasn\'t posted anything yet.'}</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onPostDeleted={handlePostDeleted}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'followers' && (
            <div className="users-list">
              {profile.followers?.length === 0 ? (
                <div className="no-posts">
                  <h3>No followers yet</h3>
                </div>
              ) : (
                profile.followers?.map((follower) => (
                  <Link to={`/profile/${follower._id}`} key={follower._id} className="user-item">
                    <div className="avatar">
                      {follower.avatar ? (
                        <img src={follower.avatar} alt={follower.name} />
                      ) : (
                        <span>{follower.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="user-name">{follower.name}</span>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'following' && (
            <div className="users-list">
              {profile.following?.length === 0 ? (
                <div className="no-posts">
                  <h3>Not following anyone</h3>
                </div>
              ) : (
                profile.following?.map((following) => (
                  <Link to={`/profile/${following._id}`} key={following._id} className="user-item">
                    <div className="avatar">
                      {following.avatar ? (
                        <img src={following.avatar} alt={following.name} />
                      ) : (
                        <span>{following.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="user-name">{following.name}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
