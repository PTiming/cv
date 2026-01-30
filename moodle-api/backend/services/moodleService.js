const axios = require('axios');
const config = require('../config/config');

/**
 * Moodle Web Services API Client
 * Provides methods to interact with Moodle's external API
 */
class MoodleService {
  constructor(token = null) {
    this.baseUrl = config.moodle.baseUrl;
    this.token = token || config.moodle.token;
    this.webServicePath = config.moodle.webServicePath;
    this.responseFormat = config.moodle.responseFormat;
  }

  /**
   * Make a request to Moodle Web Services API
   * @param {string} wsFunction - The Moodle web service function name
   * @param {object} params - Additional parameters for the function
   * @returns {Promise<object>} - Response data from Moodle
   */
  async callWebService(wsFunction, params = {}) {
    const url = `${this.baseUrl}${this.webServicePath}`;
    
    const requestParams = {
      wstoken: this.token,
      wsfunction: wsFunction,
      moodlewsrestformat: this.responseFormat,
      ...params
    };

    try {
      const response = await axios.post(url, null, { params: requestParams });
      
      if (response.data && response.data.exception) {
        throw new Error(`Moodle Error: ${response.data.message}`);
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Moodle API Error: ${error.response.status} - ${error.response.statusText}`);
      }
      throw error;
    }
  }

  // ============ Site Functions ============

  /**
   * Get site info
   */
  async getSiteInfo() {
    return this.callWebService('core_webservice_get_site_info');
  }

  // ============ User Functions ============

  /**
   * Get users by field
   * @param {string} field - Field to search by (id, username, email)
   * @param {array} values - Values to search for
   */
  async getUsersByField(field, values) {
    return this.callWebService('core_user_get_users_by_field', {
      field,
      'values[]': Array.isArray(values) ? values : [values]
    });
  }

  /**
   * Create users
   * @param {array} users - Array of user objects
   */
  async createUsers(users) {
    const params = {};
    users.forEach((user, index) => {
      Object.keys(user).forEach(key => {
        params[`users[${index}][${key}]`] = user[key];
      });
    });
    return this.callWebService('core_user_create_users', params);
  }

  /**
   * Update users
   * @param {array} users - Array of user objects with id
   */
  async updateUsers(users) {
    const params = {};
    users.forEach((user, index) => {
      Object.keys(user).forEach(key => {
        params[`users[${index}][${key}]`] = user[key];
      });
    });
    return this.callWebService('core_user_update_users', params);
  }

  // ============ Course Functions ============

  /**
   * Get all courses
   */
  async getCourses() {
    return this.callWebService('core_course_get_courses');
  }

  /**
   * Get courses by field
   * @param {string} field - Field to search by (id, shortname, idnumber, category)
   * @param {string} value - Value to search for
   */
  async getCoursesByField(field, value) {
    return this.callWebService('core_course_get_courses_by_field', {
      field,
      value
    });
  }

  /**
   * Get course contents
   * @param {number} courseId - Moodle course ID
   */
  async getCourseContents(courseId) {
    return this.callWebService('core_course_get_contents', {
      courseid: courseId
    });
  }

  /**
   * Get courses by categories
   * @param {array} categoryIds - Array of category IDs
   */
  async getCoursesByCategories(categoryIds) {
    const params = {};
    categoryIds.forEach((id, index) => {
      params[`categoryids[${index}]`] = id;
    });
    return this.callWebService('core_course_get_courses_by_timeline_classification', params);
  }

  /**
   * Create courses
   * @param {array} courses - Array of course objects
   */
  async createCourses(courses) {
    const params = {};
    courses.forEach((course, index) => {
      Object.keys(course).forEach(key => {
        params[`courses[${index}][${key}]`] = course[key];
      });
    });
    return this.callWebService('core_course_create_courses', params);
  }

  // ============ Enrollment Functions ============

  /**
   * Get enrolled users in a course
   * @param {number} courseId - Moodle course ID
   */
  async getEnrolledUsers(courseId) {
    return this.callWebService('core_enrol_get_enrolled_users', {
      courseid: courseId
    });
  }

  /**
   * Get user's enrolled courses
   * @param {number} userId - Moodle user ID
   */
  async getUserCourses(userId) {
    return this.callWebService('core_enrol_get_users_courses', {
      userid: userId
    });
  }

  /**
   * Enrol users in courses
   * @param {array} enrolments - Array of enrolment objects
   */
  async enrolUsers(enrolments) {
    const params = {};
    enrolments.forEach((enrol, index) => {
      params[`enrolments[${index}][roleid]`] = enrol.roleId || 5; // 5 = student
      params[`enrolments[${index}][userid]`] = enrol.userId;
      params[`enrolments[${index}][courseid]`] = enrol.courseId;
    });
    return this.callWebService('enrol_manual_enrol_users', params);
  }

  /**
   * Unenrol users from courses
   * @param {array} enrolments - Array of enrolment objects
   */
  async unenrolUsers(enrolments) {
    const params = {};
    enrolments.forEach((enrol, index) => {
      params[`enrolments[${index}][userid]`] = enrol.userId;
      params[`enrolments[${index}][courseid]`] = enrol.courseId;
    });
    return this.callWebService('enrol_manual_unenrol_users', params);
  }

  // ============ Grade Functions ============

  /**
   * Get user grades for a course
   * @param {number} courseId - Moodle course ID
   * @param {number} userId - Moodle user ID (optional)
   */
  async getGrades(courseId, userId = null) {
    const params = { courseid: courseId };
    if (userId) {
      params.userid = userId;
    }
    return this.callWebService('gradereport_user_get_grade_items', params);
  }

  // ============ Assignment Functions ============

  /**
   * Get assignments for courses
   * @param {array} courseIds - Array of course IDs
   */
  async getAssignments(courseIds) {
    const params = {};
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    return this.callWebService('mod_assign_get_assignments', params);
  }

  /**
   * Get assignment submissions
   * @param {number} assignmentId - Assignment ID
   */
  async getSubmissions(assignmentId) {
    return this.callWebService('mod_assign_get_submissions', {
      'assignmentids[0]': assignmentId
    });
  }

  /**
   * Submit assignment for grading
   * @param {number} assignmentId - Assignment ID
   */
  async submitForGrading(assignmentId) {
    return this.callWebService('mod_assign_submit_for_grading', {
      assignmentid: assignmentId,
      acceptsubmissionstatement: 1
    });
  }

  // ============ Quiz Functions ============

  /**
   * Get quizzes by courses
   * @param {array} courseIds - Array of course IDs
   */
  async getQuizzes(courseIds) {
    const params = {};
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    return this.callWebService('mod_quiz_get_quizzes_by_courses', params);
  }

  /**
   * Get quiz attempts
   * @param {number} quizId - Quiz ID
   * @param {number} userId - User ID (optional)
   */
  async getQuizAttempts(quizId, userId = null) {
    const params = { quizid: quizId };
    if (userId) {
      params.userid = userId;
    }
    return this.callWebService('mod_quiz_get_user_attempts', params);
  }

  // ============ Forum Functions ============

  /**
   * Get forums by courses
   * @param {array} courseIds - Array of course IDs
   */
  async getForums(courseIds) {
    const params = {};
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    return this.callWebService('mod_forum_get_forums_by_courses', params);
  }

  /**
   * Get forum discussions
   * @param {number} forumId - Forum ID
   */
  async getForumDiscussions(forumId) {
    return this.callWebService('mod_forum_get_forum_discussions', {
      forumid: forumId
    });
  }

  /**
   * Add discussion to forum
   * @param {number} forumId - Forum ID
   * @param {string} subject - Discussion subject
   * @param {string} message - Discussion message
   */
  async addDiscussion(forumId, subject, message) {
    return this.callWebService('mod_forum_add_discussion', {
      forumid: forumId,
      subject,
      message
    });
  }

  // ============ Message Functions ============

  /**
   * Send instant messages
   * @param {array} messages - Array of message objects
   */
  async sendMessages(messages) {
    const params = {};
    messages.forEach((msg, index) => {
      params[`messages[${index}][touserid]`] = msg.toUserId;
      params[`messages[${index}][text]`] = msg.text;
    });
    return this.callWebService('core_message_send_instant_messages', params);
  }

  /**
   * Get messages
   * @param {number} userId - User ID
   * @param {string} type - Message type ('conversations' or 'notifications')
   */
  async getMessages(userId, type = 'conversations') {
    return this.callWebService('core_message_get_messages', {
      useridto: userId,
      type
    });
  }

  // ============ Calendar Functions ============

  /**
   * Get calendar events
   * @param {object} options - Event options
   */
  async getCalendarEvents(options = {}) {
    const params = {};
    if (options.courseIds) {
      options.courseIds.forEach((id, index) => {
        params[`events[courseids][${index}]`] = id;
      });
    }
    if (options.timestart) {
      params['options[timestart]'] = options.timestart;
    }
    if (options.timeend) {
      params['options[timeend]'] = options.timeend;
    }
    return this.callWebService('core_calendar_get_calendar_events', params);
  }

  // ============ Completion Functions ============

  /**
   * Get course completion status
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID
   */
  async getCourseCompletion(courseId, userId) {
    return this.callWebService('core_completion_get_course_completion_status', {
      courseid: courseId,
      userid: userId
    });
  }

  /**
   * Get activity completion status
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID (optional)
   */
  async getActivityCompletion(courseId, userId = null) {
    const params = { courseid: courseId };
    if (userId) {
      params.userid = userId;
    }
    return this.callWebService('core_completion_get_activities_completion_status', params);
  }

  /**
   * Mark activity as complete
   * @param {number} cmid - Course module ID
   * @param {boolean} completed - Completion status
   */
  async markActivityComplete(cmid, completed = true) {
    return this.callWebService('core_completion_update_activity_completion_status_manually', {
      cmid,
      completed: completed ? 1 : 0
    });
  }
}

module.exports = MoodleService;
