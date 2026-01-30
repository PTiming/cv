const axios = require('axios');
const config = require('../config');

/**
 * Moodle Web Service API Client
 * Handles all communication with Moodle's Web Services API
 */
class MoodleService {
  constructor() {
    this.baseUrl = config.moodle.url;
    this.token = config.moodle.token;
    this.wsEndpoint = '/webservice/rest/server.php';
  }

  /**
   * Make a request to Moodle Web Services API
   * @param {string} wsFunction - Moodle web service function name
   * @param {object} params - Additional parameters for the function
   * @returns {Promise<object>} - Response from Moodle
   */
  async callMoodleAPI(wsFunction, params = {}) {
    try {
      const url = `${this.baseUrl}${this.wsEndpoint}`;
      const requestParams = {
        wstoken: this.token,
        wsfunction: wsFunction,
        moodlewsrestformat: 'json',
        ...params
      };

      const response = await axios.post(url, null, { params: requestParams });

      if (response.data && response.data.exception) {
        throw new Error(response.data.message || 'Moodle API error');
      }

      return response.data;
    } catch (error) {
      console.error(`Moodle API Error [${wsFunction}]:`, error.message);
      throw error;
    }
  }

  // ==================== User Functions ====================

  /**
   * Get site info (verify connection and get user info)
   * @returns {Promise<object>}
   */
  async getSiteInfo() {
    return this.callMoodleAPI('core_webservice_get_site_info');
  }

  /**
   * Get users by field
   * @param {string} field - Field to search by (id, username, email, etc.)
   * @param {array} values - Values to search for
   * @returns {Promise<object>}
   */
  async getUsersByField(field, values) {
    return this.callMoodleAPI('core_user_get_users_by_field', {
      field,
      'values[]': values
    });
  }

  /**
   * Get user by ID
   * @param {number} userId - Moodle user ID
   * @returns {Promise<object>}
   */
  async getUserById(userId) {
    const users = await this.callMoodleAPI('core_user_get_users_by_field', {
      field: 'id',
      'values[0]': userId
    });
    return users[0] || null;
  }

  /**
   * Create a new user in Moodle
   * @param {object} userData - User data
   * @returns {Promise<object>}
   */
  async createUser(userData) {
    return this.callMoodleAPI('core_user_create_users', {
      'users[0][username]': userData.username,
      'users[0][password]': userData.password,
      'users[0][firstname]': userData.firstName,
      'users[0][lastname]': userData.lastName,
      'users[0][email]': userData.email
    });
  }

  /**
   * Update an existing user in Moodle
   * @param {number} userId - Moodle user ID
   * @param {object} userData - Updated user data
   * @returns {Promise<object>}
   */
  async updateUser(userId, userData) {
    const params = { 'users[0][id]': userId };
    
    if (userData.firstName) params['users[0][firstname]'] = userData.firstName;
    if (userData.lastName) params['users[0][lastname]'] = userData.lastName;
    if (userData.email) params['users[0][email]'] = userData.email;

    return this.callMoodleAPI('core_user_update_users', params);
  }

  // ==================== Course Functions ====================

  /**
   * Get all courses
   * @returns {Promise<array>}
   */
  async getCourses() {
    return this.callMoodleAPI('core_course_get_courses');
  }

  /**
   * Get course by ID
   * @param {number} courseId - Moodle course ID
   * @returns {Promise<object>}
   */
  async getCourseById(courseId) {
    const courses = await this.callMoodleAPI('core_course_get_courses', {
      'options[ids][0]': courseId
    });
    return courses[0] || null;
  }

  /**
   * Get courses by field
   * @param {string} field - Field to search by (id, shortname, idnumber, etc.)
   * @param {string} value - Value to search for
   * @returns {Promise<object>}
   */
  async getCoursesByField(field, value) {
    return this.callMoodleAPI('core_course_get_courses_by_field', {
      field,
      value
    });
  }

  /**
   * Get user's enrolled courses
   * @param {number} userId - Moodle user ID
   * @returns {Promise<array>}
   */
  async getUserCourses(userId) {
    return this.callMoodleAPI('core_enrol_get_users_courses', {
      userid: userId
    });
  }

  /**
   * Get course contents
   * @param {number} courseId - Moodle course ID
   * @returns {Promise<array>}
   */
  async getCourseContents(courseId) {
    return this.callMoodleAPI('core_course_get_contents', {
      courseid: courseId
    });
  }

  /**
   * Get enrolled users in a course
   * @param {number} courseId - Moodle course ID
   * @returns {Promise<array>}
   */
  async getEnrolledUsers(courseId) {
    return this.callMoodleAPI('core_enrol_get_enrolled_users', {
      courseid: courseId
    });
  }

  /**
   * Enroll user in a course
   * @param {number} userId - Moodle user ID
   * @param {number} courseId - Moodle course ID
   * @param {number} roleId - Role ID (default: 5 for student)
   * @returns {Promise<object>}
   */
  async enrollUser(userId, courseId, roleId = 5) {
    return this.callMoodleAPI('enrol_manual_enrol_users', {
      'enrolments[0][roleid]': roleId,
      'enrolments[0][userid]': userId,
      'enrolments[0][courseid]': courseId
    });
  }

  // ==================== Grade Functions ====================

  /**
   * Get grades for a course
   * @param {number} courseId - Moodle course ID
   * @param {number} userId - Optional user ID to filter grades
   * @returns {Promise<object>}
   */
  async getGrades(courseId, userId = null) {
    const params = { courseid: courseId };
    if (userId) {
      params.userid = userId;
    }
    return this.callMoodleAPI('core_grades_get_grades', params);
  }

  /**
   * Get grade items for a course
   * @param {number} courseId - Moodle course ID
   * @returns {Promise<object>}
   */
  async getGradeItems(courseId) {
    return this.callMoodleAPI('gradereport_user_get_grade_items', {
      courseid: courseId
    });
  }

  /**
   * Get user grades report
   * @param {number} courseId - Moodle course ID
   * @param {number} userId - Moodle user ID
   * @returns {Promise<object>}
   */
  async getUserGradesReport(courseId, userId) {
    return this.callMoodleAPI('gradereport_user_get_grades_table', {
      courseid: courseId,
      userid: userId
    });
  }

  // ==================== Assignment Functions ====================

  /**
   * Get assignments for courses
   * @param {array} courseIds - Array of course IDs
   * @returns {Promise<object>}
   */
  async getAssignments(courseIds) {
    const params = {};
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    return this.callMoodleAPI('mod_assign_get_assignments', params);
  }

  /**
   * Get assignment submissions
   * @param {number} assignmentId - Assignment ID
   * @returns {Promise<object>}
   */
  async getSubmissions(assignmentId) {
    return this.callMoodleAPI('mod_assign_get_submissions', {
      'assignmentids[0]': assignmentId
    });
  }

  /**
   * Submit assignment grade
   * @param {number} assignmentId - Assignment ID
   * @param {number} userId - User ID
   * @param {number} grade - Grade value
   * @param {string} feedback - Feedback text
   * @returns {Promise<object>}
   */
  async submitAssignmentGrade(assignmentId, userId, grade, feedback = '') {
    return this.callMoodleAPI('mod_assign_save_grade', {
      assignmentid: assignmentId,
      userid: userId,
      grade: grade,
      attemptnumber: -1,
      addattempt: 0,
      workflowstate: '',
      applytoall: 0,
      'plugindata[assignfeedbackcomments_editor][text]': feedback,
      'plugindata[assignfeedbackcomments_editor][format]': 1
    });
  }

  // ==================== Quiz Functions ====================

  /**
   * Get quizzes for a course
   * @param {number} courseId - Course ID
   * @returns {Promise<object>}
   */
  async getQuizzes(courseId) {
    return this.callMoodleAPI('mod_quiz_get_quizzes_by_courses', {
      'courseids[0]': courseId
    });
  }

  /**
   * Get quiz attempts for a user
   * @param {number} quizId - Quiz ID
   * @param {number} userId - User ID
   * @returns {Promise<object>}
   */
  async getQuizAttempts(quizId, userId) {
    return this.callMoodleAPI('mod_quiz_get_user_attempts', {
      quizid: quizId,
      userid: userId,
      status: 'all'
    });
  }
}

module.exports = new MoodleService();
