import api from './api';

const moodleService = {
  /**
   * Get site info
   */
  getSiteInfo: async () => {
    const response = await api.get('/moodle/site-info');
    return response.data;
  },

  /**
   * Get user's courses
   */
  getMyCourses: async () => {
    const response = await api.get('/moodle/my-courses');
    return response.data;
  },

  /**
   * Get course contents
   */
  getCourseContents: async (courseId) => {
    const response = await api.get(`/moodle/courses/${courseId}/contents`);
    return response.data;
  },

  /**
   * Get course grades
   */
  getCourseGrades: async (courseId) => {
    const response = await api.get(`/moodle/courses/${courseId}/grades`);
    return response.data;
  },

  /**
   * Get course completion status
   */
  getCourseCompletion: async (courseId) => {
    const response = await api.get(`/moodle/courses/${courseId}/completion`);
    return response.data;
  },

  /**
   * Get assignments
   */
  getAssignments: async (courseIds) => {
    const response = await api.get('/moodle/assignments', {
      params: { courseIds: courseIds.join(',') }
    });
    return response.data;
  },

  /**
   * Get quizzes
   */
  getQuizzes: async (courseIds) => {
    const response = await api.get('/moodle/quizzes', {
      params: { courseIds: courseIds.join(',') }
    });
    return response.data;
  },

  /**
   * Get forums
   */
  getForums: async (courseIds) => {
    const response = await api.get('/moodle/forums', {
      params: { courseIds: courseIds.join(',') }
    });
    return response.data;
  },

  /**
   * Get calendar events
   */
  getCalendarEvents: async (options = {}) => {
    const params = {};
    if (options.courseIds) {
      params.courseIds = options.courseIds.join(',');
    }
    if (options.timestart) {
      params.timestart = options.timestart;
    }
    if (options.timeend) {
      params.timeend = options.timeend;
    }
    const response = await api.get('/moodle/calendar', { params });
    return response.data;
  },

  /**
   * Mark activity as complete
   */
  markActivityComplete: async (cmid, completed = true) => {
    const response = await api.post(`/moodle/activities/${cmid}/complete`, { completed });
    return response.data;
  },

  /**
   * Get messages
   */
  getMessages: async (type = 'conversations') => {
    const response = await api.get('/moodle/messages', { params: { type } });
    return response.data;
  },

  /**
   * Send message
   */
  sendMessage: async (toUserId, text) => {
    const response = await api.post('/moodle/messages', { toUserId, text });
    return response.data;
  }
};

export default moodleService;
