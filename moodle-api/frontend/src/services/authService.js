import api from './api';

const authService = {
  /**
   * Register a new user
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  /**
   * Login user
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  /**
   * Get current user
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Connect Moodle account
   */
  connectMoodle: async (moodleToken) => {
    const response = await api.post('/auth/connect-moodle', { moodleToken });
    return response.data;
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('token');
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService;
