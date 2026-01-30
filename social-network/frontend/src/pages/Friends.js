import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Friends.css';

const Friends = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ sent: [], received: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, suggestionsRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests'),
        api.get('/friends/suggestions')
      ]);
      setFriends(friendsRes.data.friends);
      setRequests(requestsRes.data);
      setSuggestions(suggestionsRes.data.suggestions);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await api.get(`/users/search/${query}`);
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await api.post(`/friends/request/${userId}`);
      // Update UI
      setSuggestions(suggestions.filter(s => s._id !== userId));
      setSearchResults(searchResults.map(u => 
        u._id === userId ? { ...u, requestSent: true } : u
      ));
      // Refetch requests
      const res = await api.get('/friends/requests');
      setRequests(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send request');
    }
  };

  const acceptRequest = async (userId) => {
    try {
      await api.post(`/friends/accept/${userId}`);
      // Move from requests to friends
      const acceptedUser = requests.received.find(r => r._id === userId);
      setRequests({
        ...requests,
        received: requests.received.filter(r => r._id !== userId)
      });
      if (acceptedUser) {
        setFriends([...friends, acceptedUser]);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const rejectRequest = async (userId) => {
    try {
      await api.post(`/friends/reject/${userId}`);
      setRequests({
        ...requests,
        received: requests.received.filter(r => r._id !== userId)
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const cancelRequest = async (userId) => {
    try {
      await api.post(`/friends/cancel/${userId}`);
      setRequests({
        ...requests,
        sent: requests.sent.filter(r => r._id !== userId)
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const removeFriend = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      await api.delete(`/friends/${userId}`);
      setFriends(friends.filter(f => f._id !== userId));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove friend');
    }
  };

  const startChat = async (userId) => {
    try {
      const response = await api.post('/chat/conversations', { participantId: userId });
      navigate('/chat');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start chat');
    }
  };

  return (
    <div className="friends-container">
      <div className="friends-layout">
        {/* Sidebar */}
        <aside className="friends-sidebar">
          <h2>Friends</h2>
          
          {/* Search */}
          <div className="friend-search">
            <input
              type="text"
              placeholder="Search for people..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <nav className="friends-nav">
            <button 
              className={activeTab === 'friends' ? 'active' : ''} 
              onClick={() => setActiveTab('friends')}
            >
              <span className="icon">👥</span>
              My Friends
              <span className="count">{friends.length}</span>
            </button>
            <button 
              className={activeTab === 'requests' ? 'active' : ''} 
              onClick={() => setActiveTab('requests')}
            >
              <span className="icon">📨</span>
              Friend Requests
              {requests.received.length > 0 && (
                <span className="badge">{requests.received.length}</span>
              )}
            </button>
            <button 
              className={activeTab === 'sent' ? 'active' : ''} 
              onClick={() => setActiveTab('sent')}
            >
              <span className="icon">📤</span>
              Sent Requests
              <span className="count">{requests.sent.length}</span>
            </button>
            <button 
              className={activeTab === 'suggestions' ? 'active' : ''} 
              onClick={() => setActiveTab('suggestions')}
            >
              <span className="icon">✨</span>
              Suggestions
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="friends-main">
          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <div className="search-results-section">
              <h3>Search Results for "{searchQuery}"</h3>
              {searchResults.length === 0 ? (
                <p className="no-results">No users found</p>
              ) : (
                <div className="users-grid">
                  {searchResults.map(user => (
                    <div key={user._id} className="user-card card">
                      <Link to={`/profile/${user.username}`} className="user-info">
                        <img src={user.avatar || '/default-avatar.png'} alt={user.username} />
                        <div>
                          <h4>@{user.username}</h4>
                          <p>{user.bio?.substring(0, 50) || 'No bio'}</p>
                        </div>
                      </Link>
                      {!friends.some(f => f._id === user._id) && (
                        <button 
                          className="btn btn-primary"
                          onClick={() => sendFriendRequest(user._id)}
                          disabled={user.requestSent}
                        >
                          {user.requestSent ? 'Request Sent' : 'Add Friend'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Friends List */}
          {activeTab === 'friends' && !searchQuery && (
            <div className="section">
              <h3>My Friends ({friends.length})</h3>
              {loading ? (
                <div className="loading-state">Loading...</div>
              ) : friends.length === 0 ? (
                <div className="empty-state">
                  <span className="icon">👋</span>
                  <h4>No friends yet</h4>
                  <p>Start adding friends to connect with them!</p>
                </div>
              ) : (
                <div className="users-grid">
                  {friends.map(friend => (
                    <div key={friend._id} className="user-card card">
                      <Link to={`/profile/${friend.username}`} className="user-info">
                        <img src={friend.avatar || '/default-avatar.png'} alt={friend.username} />
                        <div>
                          <h4>@{friend.username}</h4>
                          <p>{friend.bio?.substring(0, 50) || 'No bio'}</p>
                        </div>
                      </Link>
                      <div className="card-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => startChat(friend._id)}
                        >
                          💬 Chat
                        </button>
                        <button 
                          className="btn btn-ghost"
                          onClick={() => removeFriend(friend._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Friend Requests */}
          {activeTab === 'requests' && !searchQuery && (
            <div className="section">
              <h3>Friend Requests ({requests.received.length})</h3>
              {requests.received.length === 0 ? (
                <div className="empty-state">
                  <span className="icon">📭</span>
                  <h4>No pending requests</h4>
                  <p>When someone sends you a friend request, it will appear here.</p>
                </div>
              ) : (
                <div className="users-grid">
                  {requests.received.map(user => (
                    <div key={user._id} className="user-card card request-card">
                      <Link to={`/profile/${user.username}`} className="user-info">
                        <img src={user.avatar || '/default-avatar.png'} alt={user.username} />
                        <div>
                          <h4>@{user.username}</h4>
                          <p>{user.bio?.substring(0, 50) || 'No bio'}</p>
                        </div>
                      </Link>
                      <div className="card-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => acceptRequest(user._id)}
                        >
                          ✓ Accept
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => rejectRequest(user._id)}
                        >
                          ✕ Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sent Requests */}
          {activeTab === 'sent' && !searchQuery && (
            <div className="section">
              <h3>Sent Requests ({requests.sent.length})</h3>
              {requests.sent.length === 0 ? (
                <div className="empty-state">
                  <span className="icon">📤</span>
                  <h4>No sent requests</h4>
                  <p>Requests you send will appear here until they're accepted.</p>
                </div>
              ) : (
                <div className="users-grid">
                  {requests.sent.map(user => (
                    <div key={user._id} className="user-card card">
                      <Link to={`/profile/${user.username}`} className="user-info">
                        <img src={user.avatar || '/default-avatar.png'} alt={user.username} />
                        <div>
                          <h4>@{user.username}</h4>
                          <p>Request pending...</p>
                        </div>
                      </Link>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => cancelRequest(user._id)}
                      >
                        Cancel Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {activeTab === 'suggestions' && !searchQuery && (
            <div className="section">
              <h3>People You May Know</h3>
              {suggestions.length === 0 ? (
                <div className="empty-state">
                  <span className="icon">🔍</span>
                  <h4>No suggestions</h4>
                  <p>Try searching for people to add as friends!</p>
                </div>
              ) : (
                <div className="users-grid">
                  {suggestions.map(user => (
                    <div key={user._id} className="user-card card">
                      <Link to={`/profile/${user.username}`} className="user-info">
                        <img src={user.avatar || '/default-avatar.png'} alt={user.username} />
                        <div>
                          <h4>@{user.username}</h4>
                          {user.mutualFriends > 0 && (
                            <p className="mutual">{user.mutualFriends} mutual friend{user.mutualFriends > 1 ? 's' : ''}</p>
                          )}
                        </div>
                      </Link>
                      <button 
                        className="btn btn-primary"
                        onClick={() => sendFriendRequest(user._id)}
                      >
                        + Add Friend
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Friends;
