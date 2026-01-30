import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaMapMarkerAlt, FaLink, FaCalendar, FaEdit, FaBook } from 'react-icons/fa';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import Loading from '../common/Loading';
import PostCard from '../feed/PostCard';
import userService from '../../services/userService';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile(username);
      if (response.success) {
        setProfile(response.data);
        // Check if current user is following this profile
        if (currentUser && response.data.followers) {
          setFollowing(response.data.followers.some(f => f._id === currentUser._id));
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await userService.getUserPosts(username);
      if (response.success) {
        setPosts(response.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleFollow = async () => {
    try {
      if (following) {
        await userService.unfollowUser(username);
        setFollowing(false);
        setProfile(prev => ({
          ...prev,
          followersCount: prev.followersCount - 1
        }));
      } else {
        await userService.followUser(username);
        setFollowing(true);
        setProfile(prev => ({
          ...prev,
          followersCount: prev.followersCount + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleEditSave = async () => {
    try {
      const response = await userService.updateProfile(editData);
      if (response.success) {
        setProfile(response.data);
        updateUser(response.data);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  if (loading) {
    return <Loading text="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className="profile-not-found">
        <h2>User not found</h2>
        <p>The user @{username} doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover"></div>
        
        <div className="profile-info">
          <Avatar 
            src={profile.avatar} 
            alt={profile.username} 
            size="xlarge"
            className="profile-avatar"
          />
          
          <div className="profile-details">
            <div className="profile-name-row">
              <div>
                <h1>{profile.fullName || profile.username}</h1>
                <span className="profile-username">@{profile.username}</span>
              </div>
              
              {isOwnProfile ? (
                <button 
                  className="edit-profile-btn"
                  onClick={() => {
                    setEditData({
                      firstName: profile.firstName || '',
                      lastName: profile.lastName || '',
                      bio: profile.bio || '',
                      location: profile.location || '',
                      website: profile.website || ''
                    });
                    setEditMode(true);
                  }}
                >
                  <FaEdit /> Edit Profile
                </button>
              ) : (
                <button 
                  className={`follow-btn ${following ? 'following' : ''}`}
                  onClick={handleFollow}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            <div className="profile-meta">
              {profile.location && (
                <span><FaMapMarkerAlt /> {profile.location}</span>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer">
                  <FaLink /> {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span>
                <FaCalendar /> Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}
              </span>
              {profile.moodleLinked && (
                <span className="moodle-badge">
                  <FaBook /> Moodle Linked
                </span>
              )}
            </div>

            <div className="profile-stats">
              <div className="stat">
                <strong>{profile.followingCount || 0}</strong>
                <span>Following</span>
              </div>
              <div className="stat">
                <strong>{profile.followersCount || 0}</strong>
                <span>Followers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="profile-tabs">
        <button 
          className={activeTab === 'posts' ? 'active' : ''}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button 
          className={activeTab === 'likes' ? 'active' : ''}
          onClick={() => setActiveTab('likes')}
        >
          Likes
        </button>
      </div>

      {/* Posts */}
      <div className="profile-posts">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts yet</p>
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

      {/* Edit Profile Modal */}
      {editMode && (
        <div className="modal-overlay" onClick={() => setEditMode(false)}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            
            <div className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editData.firstName}
                    onChange={e => setEditData({...editData, firstName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editData.lastName}
                    onChange={e => setEditData({...editData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={editData.bio}
                  onChange={e => setEditData({...editData, bio: e.target.value})}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={editData.location}
                  onChange={e => setEditData({...editData, location: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={editData.website}
                  onChange={e => setEditData({...editData, website: e.target.value})}
                  placeholder="https://"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setEditMode(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleEditSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
