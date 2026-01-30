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
   * Note: Moodle's token.php endpoint requires credentials via POST form data
   * @param {string} username - Moodle username
   * @param {string} password - Moodle password
   */
  async authenticateUser(username, password) {
    try {
      const url = `${this.baseUrl}/login/token.php`;
      
      // Use POST with form data for credentials - more secure than GET params
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('service', this.service);
      
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      // Sanitize error message to avoid exposing credentials
      console.error('Moodle authentication error:', error.message?.replace(/password=\S+/gi, 'password=[REDACTED]'));
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

  // ============================================
  // WRITE FUNCTIONS - Send data TO Moodle
  // ============================================

  /**
   * Send a message to a Moodle user
   * @param {number} toUserId - Recipient's Moodle user ID
   * @param {string} message - Message text (can include HTML)
   * @param {string} token - User's Moodle token
   */
  async sendMessage(toUserId, message, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.sendMessage,
      {
        'messages[0][touserid]': toUserId,
        'messages[0][text]': message,
        'messages[0][textformat]': 1 // 1 = HTML format
      },
      token
    );
  }

  /**
   * Submit/save assignment submission
   * @param {number} assignmentId - Assignment ID
   * @param {string} text - Online text submission (if allowed)
   * @param {number} itemId - File area itemid for file submissions
   * @param {string} token - User's Moodle token
   */
  async submitAssignment(assignmentId, text, itemId, token) {
    const params = {
      assignmentid: assignmentId,
      'plugindata[onlinetext_editor][text]': text || '',
      'plugindata[onlinetext_editor][format]': 1,
      'plugindata[onlinetext_editor][itemid]': itemId || 0
    };
    
    return this.callMoodleAPI(
      moodleConfig.functions.submitAssignment,
      params,
      token
    );
  }

  /**
   * Submit assignment for grading (lock submission)
   * @param {number} assignmentId - Assignment ID
   * @param {string} token - User's Moodle token
   */
  async submitAssignmentForGrading(assignmentId, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.submitAssignmentForGrading,
      {
        assignmentid: assignmentId,
        acceptsubmissionstatement: 1
      },
      token
    );
  }

  /**
   * Add a new discussion (topic) to a forum
   * @param {number} forumId - Forum ID
   * @param {string} subject - Discussion subject
   * @param {string} message - Discussion message (HTML supported)
   * @param {object} options - Additional options (groupid, pinned, etc.)
   * @param {string} token - User's Moodle token
   */
  async addForumDiscussion(forumId, subject, message, options = {}, token) {
    const params = {
      forumid: forumId,
      subject: subject,
      message: message,
      messageformat: 1, // HTML format
      ...options
    };
    
    return this.callMoodleAPI(
      moodleConfig.functions.addForumDiscussion,
      params,
      token
    );
  }

  /**
   * Add a reply to a forum discussion
   * @param {number} postId - Parent post ID to reply to
   * @param {string} subject - Reply subject
   * @param {string} message - Reply message (HTML supported)
   * @param {string} token - User's Moodle token
   */
  async addForumPost(postId, subject, message, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.addForumPost,
      {
        postid: postId,
        subject: subject,
        message: message,
        messageformat: 1
      },
      token
    );
  }

  /**
   * Get forum discussions
   * @param {number} forumId - Forum ID
   * @param {string} token - User's Moodle token
   * @param {number} page - Page number
   * @param {number} perPage - Items per page
   */
  async getForumDiscussions(forumId, token, page = 0, perPage = 10) {
    return this.callMoodleAPI(
      moodleConfig.functions.getForumDiscussions,
      {
        forumid: forumId,
        page: page,
        perpage: perPage,
        sortorder: -1 // Newest first
      },
      token
    );
  }

  /**
   * Get posts in a discussion
   * @param {number} discussionId - Discussion ID
   * @param {string} token - User's Moodle token
   */
  async getDiscussionPosts(discussionId, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.getDiscussionPosts,
      { discussionid: discussionId },
      token
    );
  }

  /**
   * Create a calendar event
   * @param {string} name - Event name
   * @param {string} description - Event description
   * @param {number} timestart - Unix timestamp for start time
   * @param {number} duration - Duration in seconds
   * @param {object} options - Additional options (courseid, groupid, etc.)
   * @param {string} token - User's Moodle token
   */
  async createCalendarEvent(name, description, timestart, duration = 0, options = {}, token) {
    const params = {
      'events[0][name]': name,
      'events[0][description]': description,
      'events[0][format]': 1,
      'events[0][timestart]': timestart,
      'events[0][timeduration]': duration,
      'events[0][eventtype]': options.eventtype || 'user',
      ...Object.fromEntries(
        Object.entries(options).map(([key, value]) => [`events[0][${key}]`, value])
      )
    };
    
    return this.callMoodleAPI(
      moodleConfig.functions.createCalendarEvent,
      params,
      token
    );
  }

  /**
   * Delete a calendar event
   * @param {number} eventId - Event ID
   * @param {string} token - User's Moodle token
   */
  async deleteCalendarEvent(eventId, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.deleteCalendarEvent,
      {
        'events[0][eventid]': eventId,
        'events[0][repeat]': 0
      },
      token
    );
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @param {string} token - User's Moodle token
   */
  async markNotificationRead(notificationId, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.markNotificationRead,
      { notificationid: notificationId },
      token
    );
  }

  /**
   * Mark all messages as read with a user
   * @param {number} userId - User ID to mark messages read with
   * @param {string} token - User's Moodle token
   */
  async markMessagesRead(userId, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.markMessagesRead,
      { useridto: userId },
      token
    );
  }

  /**
   * Get assignment submissions
   * @param {number} assignmentId - Assignment ID
   * @param {string} token - User's Moodle token
   */
  async getAssignmentSubmissions(assignmentId, token) {
    return this.callMoodleAPI(
      moodleConfig.functions.getAssignmentSubmissions,
      { 
        'assignmentids[0]': assignmentId,
        status: 'submitted'
      },
      token
    );
  }
}

module.exports = new MoodleService();
