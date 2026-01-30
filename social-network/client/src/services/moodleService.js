import api from './api';

const moodleService = {
  // Get enrolled courses
  getCourses: async () => {
    const response = await api.get('/moodle/courses');
    return response.data;
  },

  // Get course contents
  getCourseContents: async (courseId) => {
    const response = await api.get(`/moodle/courses/${courseId}/contents`);
    return response.data;
  },

  // Get course users
  getCourseUsers: async (courseId) => {
    const response = await api.get(`/moodle/courses/${courseId}/users`);
    return response.data;
  },

  // Get course grades
  getCourseGrades: async (courseId) => {
    const response = await api.get(`/moodle/courses/${courseId}/grades`);
    return response.data;
  },

  // Get course forums
  getCourseForums: async (courseId) => {
    const response = await api.get(`/moodle/courses/${courseId}/forums`);
    return response.data;
  },

  // Get course quizzes
  getCourseQuizzes: async (courseId) => {
    const response = await api.get(`/moodle/courses/${courseId}/quizzes`);
    return response.data;
  },

  // Get all assignments
  getAssignments: async () => {
    const response = await api.get('/moodle/assignments');
    return response.data;
  },

  // Get upcoming deadlines
  getDeadlines: async () => {
    const response = await api.get('/moodle/deadlines');
    return response.data;
  },

  // Sync notifications
  syncNotifications: async () => {
    const response = await api.post('/moodle/sync-notifications');
    return response.data;
  }
};

export default moodleService;
