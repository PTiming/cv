import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Post from '../components/Post';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const { getOrCreateConversation } = useChat();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  const [error, setError] = useState('');

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/users/${username}`);
      setProfile(response.data.user);
      setPosts(response.data.posts);
      
      // Check if current user follows this profile
      if (currentUser) {
        const isFollowingUser = response.data.user.followers?.some(
          follower => follower._id === currentUser.id
        );
        setIsFollowing(isFollowingUser);
      }
      
      setEditForm({
        username: response.data.user.username,
        bio: response.data.user.bio || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setError('User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.post(`/users/${profile.id}/unfollow`);
        setIsFollowing(false);
        setProfile(prev => ({
          ...prev,
          followersCount: prev.followersCount - 1
        }));
      } else {
        await api.post(`/users/${profile.id}/follow`);
        setIsFollowing(true);
        setProfile(prev => ({
          ...prev,
          followersCount: prev.followersCount + 1
        }));
      }
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const handleMessage = async () => {
    try {
      const conversation = await getOrCreateConversation(profile.id);
      navigate('/chat');
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.put('/users/profile', editForm);
      setProfile(prev => ({
        ...prev,
        ...response.data.user
      }));
      updateUser(response.data.user);
      setIsEditing(false);
      
      // Update URL if username changed
      if (editForm.username !== username) {
        navigate(`/profile/${editForm.username}`);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(prev => ({ ...prev, avatar: response.data.avatar }));
      updateUser({ ...currentUser, avatar: response.data.avatar });
    } catch (error) {
      console.error('Avatar upload error:', error);
    }
  };

  const handleUpdatePost = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (error && !profile) {
    return (
      <div className="profile-error">
        <h2>{error}</h2>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="avatar-container">
              <img
                src={profile?.avatar || '/default-avatar.png'}
                alt={profile?.username}
                className="profile-avatar"
              />
              {isOwnProfile && (
                <label className="avatar-upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    hidden
                  />
                  📷
                </label>
              )}
            </div>
          </div>

          <div className="profile-info">
            <div className="profile-header-top">
              <h1>{profile?.username}</h1>
              {!isOwnProfile && currentUser && (
                <div className="profile-actions">
                  <button
                    onClick={handleFollow}
                    className={`follow-btn ${isFollowing ? 'following' : ''}`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button onClick={handleMessage} className="message-btn">
                    Message
                  </button>
                </div>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="edit-profile-btn"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="profile-stats">
              <div className="stat">
                <span className="stat-count">{posts.length}</span>
                <span className="stat-label">posts</span>
              </div>
              <div className="stat">
                <span className="stat-count">{profile?.followersCount || 0}</span>
                <span className="stat-label">followers</span>
              </div>
              <div className="stat">
                <span className="stat-count">{profile?.followingCount || 0}</span>
                <span className="stat-label">following</span>
              </div>
            </div>

            <p className="profile-bio">{profile?.bio || 'No bio yet.'}</p>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="modal-overlay" onClick={() => setIsEditing(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Edit Profile</h2>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    minLength={3}
                    maxLength={30}
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    maxLength={500}
                  />
                </div>
                {error && <p className="error-text">{error}</p>}
                <div className="modal-actions">
                  <button type="button" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="profile-posts">
          <h2>Posts</h2>
          {posts.length === 0 ? (
            <div className="no-posts">
              {isOwnProfile ? "You haven't posted anything yet." : 'No posts yet.'}
            </div>
          ) : (
            <div className="posts-list">
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
    </div>
  );
};

export default Profile;
