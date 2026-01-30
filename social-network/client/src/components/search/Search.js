import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as searchService from '../../services/searchService';
import userService from '../../services/userService';
import PostCard from '../feed/PostCard';
import Avatar from '../common/Avatar';
import Loading from '../common/Loading';
import './Search.css';

const Search = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all');
  const [results, setResults] = useState({});
  const [trending, setTrending] = useState([]);
  const [suggestions, setSuggestions] = useState({ users: [], groups: [], hashtags: [] });
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch trending hashtags
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await searchService.getTrending();
        setTrending(data.data);
      } catch (error) {
        console.error('Error fetching trending:', error);
      }
    };
    fetchTrending();
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions({ users: [], groups: [], hashtags: [] });
        return;
      }

      try {
        const { data } = await searchService.getSuggestions(query);
        setSuggestions(data.data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query || query.length < 2) {
      setResults({});
      return;
    }

    setLoading(true);
    setShowSuggestions(false);

    try {
      const { data } = await searchService.search(query, activeTab === 'all' ? null : activeTab);
      setResults(data.data);

      // Save to recent searches
      await searchService.saveRecentSearch(query, activeTab);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  }, [query, activeTab]);

  // Trigger search when query param changes
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam && queryParam !== query) {
      setQuery(queryParam);
    }
  }, [searchParams, query]);

  // Perform search when query or activeTab changes (only if there's a search term)
  useEffect(() => {
    if (query && query.length >= 2 && searchParams.get('q')) {
      performSearch();
    }
  }, [query, activeTab, performSearch, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query, type: activeTab });
    }
  };

  const handleHashtagClick = (tag) => {
    const searchTerm = `#${tag}`;
    setQuery(searchTerm);
    setSearchParams({ q: searchTerm, type: 'posts' });
    setActiveTab('posts');
  };

  const handleFollow = async (userId) => {
    try {
      await userService.followUser(userId);
      setResults(prev => ({
        ...prev,
        users: {
          ...prev.users,
          data: prev.users.data.map(u => 
            u._id === userId ? { ...u, isFollowing: true } : u
          )
        }
      }));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const getResultCount = () => {
    let count = 0;
    if (results.posts) count += results.posts.total;
    if (results.users) count += results.users.total;
    if (results.groups) count += results.groups.total;
    if (results.resources) count += results.resources.total;
    return count;
  };

  return (
    <div className="search-page">
      <div className="search-container">
        {/* Search Bar */}
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search for posts, people, groups, hashtags..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {query && (
              <button type="button" className="clear-btn" onClick={() => setQuery('')}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <button type="submit" className="search-btn">Search</button>
        </form>

        {/* Search Suggestions */}
        {showSuggestions && query.length >= 2 && (
          <div className="search-suggestions">
            {suggestions.users?.length > 0 && (
              <div className="suggestion-section">
                <h4>People</h4>
                {suggestions.users.map(u => (
                  <Link 
                    key={u._id} 
                    to={`/profile/${u.username}`}
                    className="suggestion-item"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <Avatar user={u} size="small" />
                    <span>{u.username}</span>
                    {u.firstName && <span className="secondary">{u.firstName} {u.lastName}</span>}
                  </Link>
                ))}
              </div>
            )}
            {suggestions.hashtags?.length > 0 && (
              <div className="suggestion-section">
                <h4>Hashtags</h4>
                {suggestions.hashtags.map((h, i) => (
                  <div 
                    key={i} 
                    className="suggestion-item hashtag"
                    onClick={() => {
                      handleHashtagClick(h.tag);
                      setShowSuggestions(false);
                    }}
                  >
                    <i className="fas fa-hashtag"></i>
                    <span>{h.tag}</span>
                    <span className="count">{h.count} posts</span>
                  </div>
                ))}
              </div>
            )}
            {suggestions.groups?.length > 0 && (
              <div className="suggestion-section">
                <h4>Groups</h4>
                {suggestions.groups.map(g => (
                  <Link 
                    key={g._id} 
                    to={`/groups/${g._id}`}
                    className="suggestion-item"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <div className="group-icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <span>{g.name}</span>
                    <span className="count">{g.memberCount} members</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Tabs */}
        {query && (
          <div className="search-tabs">
            <button 
              className={`search-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveTab('all'); performSearch(); }}
            >
              <i className="fas fa-globe"></i>
              All
            </button>
            <button 
              className={`search-tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => { setActiveTab('posts'); performSearch(); }}
            >
              <i className="fas fa-file-alt"></i>
              Posts
              {results.posts && <span className="count">{results.posts.total}</span>}
            </button>
            <button 
              className={`search-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('users'); performSearch(); }}
            >
              <i className="fas fa-user"></i>
              People
              {results.users && <span className="count">{results.users.total}</span>}
            </button>
            <button 
              className={`search-tab ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => { setActiveTab('groups'); performSearch(); }}
            >
              <i className="fas fa-users"></i>
              Groups
              {results.groups && <span className="count">{results.groups.total}</span>}
            </button>
            <button 
              className={`search-tab ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => { setActiveTab('resources'); performSearch(); }}
            >
              <i className="fas fa-book"></i>
              Resources
              {results.resources && <span className="count">{results.resources.total}</span>}
            </button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <Loading text="Searching..." />
        ) : query && getResultCount() > 0 ? (
          <div className="search-results">
            {/* Hashtags Section */}
            {results.hashtags?.length > 0 && (activeTab === 'all' || activeTab === 'posts') && (
              <div className="results-section hashtags-section">
                <h3>Related Hashtags</h3>
                <div className="hashtags-list">
                  {results.hashtags.map((h, i) => (
                    <button 
                      key={i} 
                      className="hashtag-pill"
                      onClick={() => handleHashtagClick(h.tag)}
                    >
                      #{h.tag}
                      <span className="hashtag-count">{h.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Users Section */}
            {results.users?.data?.length > 0 && (activeTab === 'all' || activeTab === 'users') && (
              <div className="results-section">
                <h3>
                  People
                  {activeTab === 'all' && results.users.total > 5 && (
                    <button onClick={() => setActiveTab('users')}>See all</button>
                  )}
                </h3>
                <div className="users-grid">
                  {results.users.data.slice(0, activeTab === 'all' ? 6 : undefined).map(u => (
                    <div key={u._id} className="user-result-card">
                      <Avatar user={u} size="large" />
                      <div className="user-info">
                        <Link to={`/profile/${u.username}`} className="username">
                          @{u.username}
                        </Link>
                        {u.firstName && (
                          <span className="name">{u.firstName} {u.lastName}</span>
                        )}
                        <span className="followers">{u.followerCount} followers</span>
                      </div>
                      {u._id !== user._id && (
                        <button 
                          className={`follow-btn ${u.isFollowing ? 'following' : ''}`}
                          onClick={() => handleFollow(u._id)}
                          disabled={u.isFollowing}
                        >
                          {u.isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Groups Section */}
            {results.groups?.data?.length > 0 && (activeTab === 'all' || activeTab === 'groups') && (
              <div className="results-section">
                <h3>
                  Groups
                  {activeTab === 'all' && results.groups.total > 3 && (
                    <button onClick={() => setActiveTab('groups')}>See all</button>
                  )}
                </h3>
                <div className="groups-list">
                  {results.groups.data.slice(0, activeTab === 'all' ? 3 : undefined).map(g => (
                    <Link key={g._id} to={`/groups/${g._id}`} className="group-result-card">
                      <div className="group-avatar">
                        <i className="fas fa-users"></i>
                      </div>
                      <div className="group-info">
                        <span className="group-name">{g.name}</span>
                        <span className="group-type">{g.type}</span>
                        <span className="group-members">{g.members?.length || 0} members</span>
                      </div>
                      {g.isMember ? (
                        <span className="member-badge">Member</span>
                      ) : (
                        <span className="join-badge">Join</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Section */}
            {results.posts?.data?.length > 0 && (activeTab === 'all' || activeTab === 'posts') && (
              <div className="results-section posts-section">
                <h3>
                  Posts
                  {activeTab === 'all' && results.posts.total > 5 && (
                    <button onClick={() => setActiveTab('posts')}>See all</button>
                  )}
                </h3>
                <div className="posts-list">
                  {results.posts.data.slice(0, activeTab === 'all' ? 5 : undefined).map(post => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Resources Section */}
            {results.resources?.data?.length > 0 && (activeTab === 'all' || activeTab === 'resources') && (
              <div className="results-section">
                <h3>
                  Resources
                  {activeTab === 'all' && results.resources.total > 3 && (
                    <button onClick={() => setActiveTab('resources')}>See all</button>
                  )}
                </h3>
                <div className="resources-list">
                  {results.resources.data.slice(0, activeTab === 'all' ? 3 : undefined).map(r => (
                    <Link key={r._id} to={`/resources/${r._id}`} className="resource-result-card">
                      <div className="resource-icon">
                        <i className={`fas fa-${r.type === 'document' ? 'file-alt' : r.type === 'video' ? 'video' : r.type === 'link' ? 'link' : 'file'}`}></i>
                      </div>
                      <div className="resource-info">
                        <span className="resource-title">{r.title}</span>
                        <span className="resource-author">by {r.author?.username}</span>
                        <div className="resource-stats">
                          <span><i className="fas fa-eye"></i> {r.views}</span>
                          <span><i className="fas fa-heart"></i> {r.likeCount}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : query && !loading ? (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>No results found</h3>
            <p>Try different keywords or check your spelling</p>
          </div>
        ) : (
          /* Trending Section when no search */
          <div className="trending-section">
            <h2>
              <i className="fas fa-fire"></i>
              Trending Now
            </h2>
            <div className="trending-hashtags">
              {trending.map((item, i) => (
                <button 
                  key={i} 
                  className="trending-item"
                  onClick={() => handleHashtagClick(item.tag)}
                >
                  <span className="rank">#{i + 1}</span>
                  <div className="trending-info">
                    <span className="tag">#{item.tag}</span>
                    <span className="posts-count">{item.count} posts</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
