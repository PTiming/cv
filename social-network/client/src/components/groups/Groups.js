import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as groupService from '../../services/groupService';
import Avatar from '../common/Avatar';
import Loading from '../common/Loading';
import './Groups.css';

const Groups = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discover');
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'general',
    privacy: 'public',
    topics: ''
  });

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search: searchQuery, type: typeFilter };
      const { data } = await groupService.getGroups(params);
      setGroups(data.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter]);

  const fetchMyGroups = useCallback(async () => {
    try {
      const { data } = await groupService.getMyGroups({ type: typeFilter });
      setMyGroups(data.data);
    } catch (error) {
      console.error('Error fetching my groups:', error);
    }
  }, [typeFilter]);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchGroups();
    } else {
      fetchMyGroups();
    }
  }, [activeTab, fetchGroups, fetchMyGroups]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const groupData = {
        ...newGroup,
        topics: newGroup.topics.split(',').map(t => t.trim()).filter(t => t)
      };
      const { data } = await groupService.createGroup(groupData);
      setMyGroups(prev => [data.data, ...prev]);
      setShowCreateModal(false);
      setNewGroup({
        name: '',
        description: '',
        type: 'general',
        privacy: 'public',
        topics: ''
      });
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await groupService.joinGroup(groupId);
      setGroups(prev => prev.map(g => {
        if (g._id === groupId) {
          return { ...g, isMember: true, members: [...g.members, { user: user._id }] };
        }
        return g;
      }));
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await groupService.leaveGroup(groupId);
      setMyGroups(prev => prev.filter(g => g._id !== groupId));
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const isMember = (group) => {
    return group.members?.some(m => m.user?._id === user._id || m.user === user._id);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'study': return 'fa-book';
      case 'course': return 'fa-graduation-cap';
      default: return 'fa-users';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'study': return '#10b981';
      case 'course': return '#f59e0b';
      default: return '#8b5cf6';
    }
  };

  return (
    <div className="groups-page">
      <div className="groups-header">
        <h1>Groups</h1>
        <button 
          className="create-group-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus"></i>
          Create Group
        </button>
      </div>

      <div className="groups-tabs">
        <button 
          className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          <i className="fas fa-compass"></i>
          Discover
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my-groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-groups')}
        >
          <i className="fas fa-layer-group"></i>
          My Groups
        </button>
      </div>

      <div className="groups-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="type-filter">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="general">General</option>
            <option value="study">Study Groups</option>
            <option value="course">Course Groups</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading text="Loading groups..." />
      ) : (
        <div className="groups-grid">
          {(activeTab === 'discover' ? groups : myGroups).length === 0 ? (
            <div className="no-groups">
              <i className="fas fa-users-slash"></i>
              <h3>No groups found</h3>
              <p>{activeTab === 'discover' ? 'Try a different search' : 'Join some groups to see them here'}</p>
            </div>
          ) : (
            (activeTab === 'discover' ? groups : myGroups).map(group => (
              <div key={group._id} className="group-card">
                <div 
                  className="group-cover"
                  style={{ 
                    background: group.coverImage 
                      ? `url(${group.coverImage})` 
                      : `linear-gradient(135deg, ${getTypeColor(group.type)}, ${getTypeColor(group.type)}88)`
                  }}
                >
                  <span className="group-type-badge" style={{ background: getTypeColor(group.type) }}>
                    <i className={`fas ${getTypeIcon(group.type)}`}></i>
                    {group.type}
                  </span>
                  {group.privacy !== 'public' && (
                    <span className="privacy-badge">
                      <i className={`fas fa-${group.privacy === 'private' ? 'lock' : 'eye-slash'}`}></i>
                    </span>
                  )}
                </div>
                <div className="group-content">
                  <div className="group-avatar-wrapper">
                    {group.avatar ? (
                      <img src={group.avatar} alt={group.name} className="group-avatar" />
                    ) : (
                      <div className="group-avatar-placeholder">
                        <i className={`fas ${getTypeIcon(group.type)}`}></i>
                      </div>
                    )}
                  </div>
                  <h3 className="group-name">{group.name}</h3>
                  <p className="group-description">
                    {group.description?.substring(0, 100)}
                    {group.description?.length > 100 ? '...' : ''}
                  </p>
                  <div className="group-stats">
                    <span>
                      <i className="fas fa-users"></i>
                      {group.members?.length || 0} members
                    </span>
                    <span>
                      <i className="fas fa-file-alt"></i>
                      {group.postCount || 0} posts
                    </span>
                  </div>
                  {group.topics && group.topics.length > 0 && (
                    <div className="group-topics">
                      {group.topics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="topic-tag">{topic}</span>
                      ))}
                      {group.topics.length > 3 && (
                        <span className="more-topics">+{group.topics.length - 3}</span>
                      )}
                    </div>
                  )}
                  <div className="group-members-preview">
                    {group.members?.slice(0, 3).map((member, i) => (
                      <Avatar 
                        key={i} 
                        user={member.user} 
                        size="small" 
                        className="member-avatar"
                      />
                    ))}
                    {group.members?.length > 3 && (
                      <span className="more-members">+{group.members.length - 3}</span>
                    )}
                  </div>
                  <div className="group-actions">
                    <Link to={`/groups/${group._id}`} className="view-btn">
                      View Group
                    </Link>
                    {isMember(group) ? (
                      <button 
                        className="leave-btn"
                        onClick={() => handleLeaveGroup(group._id)}
                      >
                        Leave
                      </button>
                    ) : (
                      <button 
                        className="join-btn"
                        onClick={() => handleJoinGroup(group._id)}
                      >
                        {group.privacy === 'private' ? 'Request to Join' : 'Join'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-group-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Group</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  placeholder="Enter group name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  placeholder="What's this group about?"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={newGroup.type}
                    onChange={(e) => setNewGroup({...newGroup, type: e.target.value})}
                  >
                    <option value="general">General</option>
                    <option value="study">Study Group</option>
                    <option value="course">Course Group</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Privacy</label>
                  <select 
                    value={newGroup.privacy}
                    onChange={(e) => setNewGroup({...newGroup, privacy: e.target.value})}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="secret">Secret</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Topics (comma separated)</label>
                <input
                  type="text"
                  value={newGroup.topics}
                  onChange={(e) => setNewGroup({...newGroup, topics: e.target.value})}
                  placeholder="e.g., Mathematics, Calculus, Study Tips"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
