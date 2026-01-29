import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import './common.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      setUsers(res.data);
    } catch (err) {
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (query) {
      searchUsers();
    }
  }, [query, searchUsers]);

  return (
    <div className="main-container">
      <div className="search-results-card">
        <h2>Search Results for "{query}"</h2>
        
        {loading ? (
          <div className="loading">Searching...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : users.length === 0 ? (
          <div className="no-results">
            <h3>No users found</h3>
            <p>Try searching for a different name</p>
          </div>
        ) : (
          <div className="users-list">
            {users.map((user) => (
              <Link to={`/profile/${user._id}`} key={user._id} className="user-card">
                <div className="avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <span>{user.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  {user.bio && <p className="user-bio">{user.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
