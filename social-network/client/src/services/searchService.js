import api from './api';

// Main search
export const search = (q, type, page, limit) => api.get('/search', { params: { q, type, page, limit } });

// Trending
export const getTrending = (limit = 10) => api.get('/search/trending', { params: { limit } });

// Suggestions
export const getSuggestions = (q, limit = 5) => api.get('/search/suggestions', { params: { q, limit } });

// Hashtag search
export const searchByHashtag = (tag, params) => api.get(`/search/hashtag/${tag}`, { params });

// Recent searches
export const getRecentSearches = () => api.get('/search/recent');
export const saveRecentSearch = (query, type) => api.post('/search/recent', { query, type });
export const clearRecentSearches = () => api.delete('/search/recent');
