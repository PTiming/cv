import api from './api';

const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      // Extract error message from response
      const message = error.response?.data?.message 
        || error.response?.data?.errors?.[0]?.msg 
        || error.response?.data?.errors?.[0]?.message
        || error.message 
        || 'Registration failed';
      throw { response: { data: { success: false, message } } };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Check if 2FA is required
      if (response.data.requireTwoFactor) {
        return response.data; // Return without storing token
      }
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      // Extract error message from response
      const message = error.response?.data?.message 
        || error.response?.data?.errors?.[0]?.msg 
        || error.response?.data?.errors?.[0]?.message
        || error.message 
        || 'Login failed';
      throw { response: { data: { success: false, message } } };
    }
  },

  // Set auth data after 2FA verification
  setAuthData: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
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
