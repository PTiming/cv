import api from './api';

const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Link Moodle account
  linkMoodle: async (credentials) => {
    const response = await api.post('/auth/link-moodle', credentials);
    return response.data;
  },

  // Unlink Moodle account
  unlinkMoodle: async () => {
    const response = await api.post('/auth/unlink-moodle');
    return response.data;
  },

  // Change password
  changePassword: async (passwords) => {
    const response = await api.put('/auth/change-password', passwords);
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default authService;
