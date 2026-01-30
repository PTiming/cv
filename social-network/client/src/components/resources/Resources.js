import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as resourceService from '../../services/resourceService';
import Avatar from '../common/Avatar';
import Loading from '../common/Loading';
import './Resources.css';

const Resources = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: 'document',
    externalUrl: '',
    content: '',
    visibility: 'public',
    tags: ''
  });

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'my') {
        response = await resourceService.getMyResources({ type: typeFilter, search: searchQuery });
      } else if (activeTab === 'saved') {
        response = await resourceService.getSavedResources({ type: typeFilter, search: searchQuery });
      } else {
        response = await resourceService.getResources({ type: typeFilter, search: searchQuery });
      }
      setResources(response.data.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, typeFilter, searchQuery]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const resourceData = {
        ...newResource,
        tags: newResource.tags.split(',').map(t => t.trim()).filter(t => t)
      };
      await resourceService.createResource(resourceData);
      setShowCreateModal(false);
      setNewResource({
        title: '',
        description: '',
        type: 'document',
        externalUrl: '',
        content: '',
        visibility: 'public',
        tags: ''
      });
      fetchResources();
    } catch (error) {
      console.error('Error creating resource:', error);
    }
  };

  const handleLike = async (resourceId) => {
    try {
      const resource = resources.find(r => r._id === resourceId);
      if (resource.likes?.includes(user._id)) {
        await resourceService.unlikeResource(resourceId);
      } else {
        await resourceService.likeResource(resourceId);
      }
      fetchResources();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async (resourceId) => {
    try {
      const resource = resources.find(r => r._id === resourceId);
      if (resource.savedBy?.includes(user._id)) {
        await resourceService.unsaveResource(resourceId);
      } else {
        await resourceService.saveResource(resourceId);
      }
      fetchResources();
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'document': return 'fa-file-alt';
      case 'video': return 'fa-video';
      case 'image': return 'fa-image';
      case 'link': return 'fa-link';
      case 'note': return 'fa-sticky-note';
      default: return 'fa-file';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'document': return '#3b82f6';
      case 'video': return '#ef4444';
      case 'image': return '#10b981';
      case 'link': return '#8b5cf6';
      case 'note': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="resources-page">
      <div className="resources-header">
        <h1>Resources</h1>
        <button 
          className="create-resource-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus"></i>
          Share Resource
        </button>
      </div>

      <div className="resources-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <i className="fas fa-globe"></i>
          Discover
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          <i className="fas fa-folder"></i>
          My Resources
        </button>
        <button 
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <i className="fas fa-bookmark"></i>
          Saved
        </button>
      </div>

      <div className="resources-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="type-filter">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="image">Images</option>
            <option value="link">Links</option>
            <option value="note">Notes</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading text="Loading resources..." />
      ) : (
        <div className="resources-grid">
          {resources.length === 0 ? (
            <div className="no-resources">
              <i className="fas fa-folder-open"></i>
              <h3>No resources found</h3>
              <p>Start sharing resources to help your peers!</p>
            </div>
          ) : (
            resources.map(resource => (
              <div key={resource._id} className="resource-card">
                <div 
                  className="resource-type-icon"
                  style={{ background: getTypeColor(resource.type) }}
                >
                  <i className={`fas ${getTypeIcon(resource.type)}`}></i>
                </div>
                <div className="resource-content">
                  <Link to={`/resources/${resource._id}`} className="resource-title">
                    {resource.title}
                  </Link>
                  <p className="resource-description">
                    {resource.description?.substring(0, 100)}
                    {resource.description?.length > 100 ? '...' : ''}
                  </p>
                  <div className="resource-author">
                    <Avatar user={resource.author} size="small" />
                    <span>{resource.author?.username}</span>
                  </div>
                  {resource.tags?.length > 0 && (
                    <div className="resource-tags">
                      {resource.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="resource-stats">
                    <span>
                      <i className="fas fa-eye"></i>
                      {resource.views || 0}
                    </span>
                    <span>
                      <i className="fas fa-download"></i>
                      {resource.downloads || 0}
                    </span>
                    <span>
                      <i className="fas fa-heart"></i>
                      {resource.likes?.length || 0}
                    </span>
                  </div>
                  <div className="resource-actions">
                    <button 
                      className={`action-btn ${resource.likes?.includes(user._id) ? 'active' : ''}`}
                      onClick={() => handleLike(resource._id)}
                    >
                      <i className={`fas fa-heart`}></i>
                    </button>
                    <button 
                      className={`action-btn ${resource.savedBy?.includes(user._id) ? 'active' : ''}`}
                      onClick={() => handleSave(resource._id)}
                    >
                      <i className="fas fa-bookmark"></i>
                    </button>
                    <Link to={`/resources/${resource._id}`} className="view-btn">
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Resource Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Share a Resource</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateResource}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newResource.title}
                  onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                  placeholder="Resource title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newResource.description}
                  onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                  placeholder="What's this resource about?"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={newResource.type}
                    onChange={(e) => setNewResource({...newResource, type: e.target.value})}
                  >
                    <option value="document">Document</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="link">Link</option>
                    <option value="note">Note</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Visibility</label>
                  <select 
                    value={newResource.visibility}
                    onChange={(e) => setNewResource({...newResource, visibility: e.target.value})}
                  >
                    <option value="public">Public</option>
                    <option value="group">Group Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              {(newResource.type === 'link' || newResource.type === 'video') && (
                <div className="form-group">
                  <label>URL</label>
                  <input
                    type="url"
                    value={newResource.externalUrl}
                    onChange={(e) => setNewResource({...newResource, externalUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              )}
              {newResource.type === 'note' && (
                <div className="form-group">
                  <label>Content</label>
                  <textarea
                    value={newResource.content}
                    onChange={(e) => setNewResource({...newResource, content: e.target.value})}
                    placeholder="Write your notes here..."
                    rows={6}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={newResource.tags}
                  onChange={(e) => setNewResource({...newResource, tags: e.target.value})}
                  placeholder="e.g., Math, Calculus, Study Notes"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Share Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
