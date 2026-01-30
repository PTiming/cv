import api from './api';

const userService = {
  // Get user profile
  getProfile: async (username) => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Follow user
  followUser: async (username) => {
    const response = await api.post(`/users/${username}/follow`);
    return response.data;
  },

  // Unfollow user
  unfollowUser: async (username) => {
    const response = await api.delete(`/users/${username}/follow`);
    return response.data;
  },

  // Get followers
  getFollowers: async (username, page = 1, limit = 20) => {
    const response = await api.get(`/users/${username}/followers?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get following
  getFollowing: async (username, page = 1, limit = 20) => {
    const response = await api.get(`/users/${username}/following?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get user posts
  getUserPosts: async (username, page = 1, limit = 10) => {
    const response = await api.get(`/users/${username}/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query, page = 1, limit = 20) => {
    const response = await api.get(`/users/search?q=${query}&page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get suggestions
  getSuggestions: async (limit = 5) => {
    const response = await api.get(`/users/suggestions?limit=${limit}`);
    return response.data;
  }
};

export default userService;
