const axios = require('axios');
const moodleConfig = require('../config/moodle');

class MoodleService {
  constructor() {
    this.baseUrl = moodleConfig.baseUrl;
    this.defaultToken = moodleConfig.token;
    this.service = moodleConfig.service;
  }

  /**
   * Make a request to Moodle Web Service API
   * @param {string} wsfunction - Moodle web service function name
   * @param {object} params - Additional parameters
   * @param {string} token - User's Moodle token (optional)
   */
  async callMoodleAPI(wsfunction, params = {}, token = null) {
    try {
      const url = `${this.baseUrl}/webservice/rest/server.php`;
      
      const requestParams = {
        wstoken: token || this.defaultToken,
        wsfunction,
        moodlewsrestformat: 'json',
        ...params
      };

      const response = await axios.get(url, { params: requestParams });

      // Check for Moodle error response
      if (response.data && response.data.exception) {
        throw new Error(response.data.message || 'Moodle API error');
      }

      return response.data;
    } catch (error) {
      console.error(`Moodle API Error [${wsfunction}]:`, error.message);
      throw error;
    }
  }

  /**
   * Authenticate user with Moodle and get token
   * @param {string} username - Moodle username
   * @param {string} password - Moodle password
   */
  async authenticateUser(username, password) {
    try {
      const url = `${this.baseUrl}/login/token.php`;
      
      const response = await axios.get(url, {
        params: {
          username,
          password,
          service: this.service
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      console.error('Moodle authentication error:', error.message);
      throw error;
    }
  }

  /**
   * Get site information
   * @param {string} token - User's Moodle token
   */
  async getSiteInfo(token) {
    return this.callMoodleAPI(moodleConfig.functions.getSiteInfo, {}, token);
  }

  /**
   * Get user's enrolled courses
   * @param {number} userId - Moodle user ID
   * @param {string} token - User's Moodle token
   */
  async getUserCourses(userId, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.getUserCourses, 
      { userid: userId },
      token
    );
  }

  /**
   * Get course contents (modules, sections)
   * @param {number} courseId - Moodle course ID
   * @param {string} token - User's Moodle token
   */
  async getCourseContents(courseId, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.getCourseContents,
      { courseid: courseId },
      token
    );
  }

  /**
   * Get users enrolled in a course
   * @param {number} courseId - Moodle course ID
   * @param {string} token - User's Moodle token
   */
  async getEnrolledUsers(courseId, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.getEnrolledUsers,
      { courseid: courseId },
      token
    );
  }

  /**
   * Get user info by field (id, username, email)
   * @param {string} field - Field to search by
   * @param {string} value - Value to search for
   * @param {string} token - User's Moodle token
   */
  async getUserInfo(field, value, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.getUserInfo,
      { field, 'values[0]': value },
      token
    );
  }

  /**
   * Get user's grades for a course
   * @param {number} courseId - Moodle course ID
   * @param {number} userId - Moodle user ID
   * @param {string} token - User's Moodle token
   */
  async getGrades(courseId, userId, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.getGrades,
      { courseid: courseId, userid: userId },
      token
    );
  }

  /**
   * Get assignments for courses
   * @param {number[]} courseIds - Array of course IDs
   * @param {string} token - User's Moodle token
   */
  async getAssignments(courseIds, token) {
    const params = {};
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    
    return this.callMoodleAPI(
      moodleConfig.functions.getAssignments,
      params,
      token
    );
  }

  /**
   * Get quizzes for courses
   * @param {number[]} courseIds - Array of course IDs
   * @param {string} token - User's Moodle token
   */
  async getQuizzes(courseIds, token) {
    const params = {};
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    
    return this.callMoodleAPI(
      moodleConfig.functions.getQuizzes,
      params,
      token
    );
  }

  /**
   * Get forums for courses
   * @param {number[]} courseIds - Array of course IDs
   * @param {string} token - User's Moodle token
   */
  async getForums(courseIds, token) {
    const params = {};
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    
    return this.callMoodleAPI(
      moodleConfig.functions.getForums,
      params,
      token
    );
  }

  /**
   * Get calendar events (deadlines, etc.)
   * @param {number[]} courseIds - Array of course IDs
   * @param {string} token - User's Moodle token
   */
  async getCalendarEvents(courseIds, token) {
    const params = {
      'events[courseids]': courseIds
    };
    
    return this.callMoodleAPI(
      moodleConfig.functions.getCalendarEvents,
      params,
      token
    );
  }

  /**
   * Get user's messages
   * @param {number} userId - Moodle user ID
   * @param {string} token - User's Moodle token
   * @param {string} type - 'notifications' or 'conversations'
   */
  async getMessages(userId, token, type = 'notifications') {
    return this.callMoodleAPI(
      moodleConfig.functions.getMessages,
      { 
        useridto: userId,
        type: type,
        read: 0
      },
      token
    );
  }

  /**
   * Get upcoming deadlines for user
   * @param {number} userId - Moodle user ID
   * @param {string} token - User's Moodle token
   */
  async getUpcomingDeadlines(userId, token) {
    try {
      // Get user's courses
      const courses = await this.getUserCourses(userId, token);
      const courseIds = courses.map(c => c.id);
      
      // Get assignments with due dates
      const assignments = await this.getAssignments(courseIds, token);
      
      const now = Date.now() / 1000;
      const deadlines = [];
      
      if (assignments.courses) {
        assignments.courses.forEach(course => {
          course.assignments.forEach(assignment => {
            if (assignment.duedate && assignment.duedate > now) {
              deadlines.push({
                type: 'assignment',
                id: assignment.id,
                name: assignment.name,
                courseName: course.fullname,
                courseId: course.id,
                dueDate: new Date(assignment.duedate * 1000)
              });
            }
          });
        });
      }
      
      // Sort by due date
      deadlines.sort((a, b) => a.dueDate - b.dueDate);
      
      return deadlines;
    } catch (error) {
      console.error('Error getting deadlines:', error.message);
      throw error;
    }
  }

  /**
   * Format Moodle user data to match our user schema
   * @param {object} moodleUser - Moodle user data
   */
  formatUserData(moodleUser) {
    return {
      moodleUserId: moodleUser.id,
      username: moodleUser.username,
      email: moodleUser.email,
      firstName: moodleUser.firstname,
      lastName: moodleUser.lastname,
      avatar: moodleUser.profileimageurl || ''
    };
  }
}

module.exports = new MoodleService();
