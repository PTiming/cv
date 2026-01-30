const User = require('../models/User');
const Notification = require('../models/Notification');
const moodleService = require('../services/moodleService');

// @desc    Get user's Moodle courses
// @route   GET /api/moodle/courses
// @access  Private
exports.getMoodleCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const courses = await moodleService.getUserCourses(
      user.moodleUserId, 
      user.moodleToken
    );

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Moodle courses'
    });
  }
};

// @desc    Get Moodle course contents
// @route   GET /api/moodle/courses/:courseId/contents
// @access  Private
exports.getCourseContents = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const contents = await moodleService.getCourseContents(
      parseInt(req.params.courseId), 
      user.moodleToken
    );

    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch course contents'
    });
  }
};

// @desc    Get enrolled users in a course
// @route   GET /api/moodle/courses/:courseId/users
// @access  Private
exports.getCourseUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const users = await moodleService.getEnrolledUsers(
      parseInt(req.params.courseId), 
      user.moodleToken
    );

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch course users'
    });
  }
};

// @desc    Get user's grades for a course
// @route   GET /api/moodle/courses/:courseId/grades
// @access  Private
exports.getCourseGrades = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const grades = await moodleService.getGrades(
      parseInt(req.params.courseId),
      user.moodleUserId,
      user.moodleToken
    );

    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch grades'
    });
  }
};

// @desc    Get upcoming assignments
// @route   GET /api/moodle/assignments
// @access  Private
exports.getAssignments = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    // Get user's courses first
    const courses = await moodleService.getUserCourses(
      user.moodleUserId, 
      user.moodleToken
    );
    const courseIds = courses.map(c => c.id);

    // Get assignments for all courses
    const assignments = await moodleService.getAssignments(
      courseIds, 
      user.moodleToken
    );

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch assignments'
    });
  }
};

// @desc    Get upcoming deadlines
// @route   GET /api/moodle/deadlines
// @access  Private
exports.getDeadlines = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const deadlines = await moodleService.getUpcomingDeadlines(
      user.moodleUserId,
      user.moodleToken
    );

    res.json({
      success: true,
      data: deadlines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch deadlines'
    });
  }
};

// @desc    Sync Moodle notifications
// @route   POST /api/moodle/sync-notifications
// @access  Private
exports.syncNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    // Get upcoming deadlines
    const deadlines = await moodleService.getUpcomingDeadlines(
      user.moodleUserId,
      user.moodleToken
    );

    // Create notifications for upcoming deadlines (within 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    let newNotifications = 0;
    
    for (const deadline of deadlines) {
      if (deadline.dueDate <= sevenDaysFromNow) {
        // Check if notification already exists
        const existing = await Notification.findOne({
          recipient: user._id,
          type: 'moodle_deadline',
          'moodleData.activityId': deadline.id
        });

        if (!existing) {
          await Notification.create({
            recipient: user._id,
            type: 'moodle_deadline',
            content: `Deadline approaching: ${deadline.name} - ${deadline.courseName}`,
            moodleData: {
              courseId: deadline.courseId,
              courseName: deadline.courseName,
              activityId: deadline.id,
              activityName: deadline.name,
              dueDate: deadline.dueDate
            }
          });
          newNotifications++;
        }
      }
    }

    res.json({
      success: true,
      message: `Synced ${newNotifications} new notifications`,
      data: { newNotifications }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync notifications'
    });
  }
};

// @desc    Get course forums
// @route   GET /api/moodle/courses/:courseId/forums
// @access  Private
exports.getCourseForums = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const forums = await moodleService.getForums(
      [parseInt(req.params.courseId)], 
      user.moodleToken
    );

    res.json({
      success: true,
      data: forums
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch forums'
    });
  }
};

// @desc    Get quizzes for a course
// @route   GET /api/moodle/courses/:courseId/quizzes
// @access  Private
exports.getCourseQuizzes = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const quizzes = await moodleService.getQuizzes(
      [parseInt(req.params.courseId)], 
      user.moodleToken
    );

    res.json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quizzes'
    });
  }
};

// @desc    Get forum discussions
// @route   GET /api/moodle/forums/:forumId/discussions
// @access  Private
exports.getForumDiscussions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const { page = 0, perPage = 10 } = req.query;
    const discussions = await moodleService.getForumDiscussions(
      parseInt(req.params.forumId),
      user.moodleToken,
      parseInt(page),
      parseInt(perPage)
    );

    res.json({
      success: true,
      data: discussions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch forum discussions'
    });
  }
};

// @desc    Get discussion posts
// @route   GET /api/moodle/discussions/:discussionId/posts
// @access  Private
exports.getDiscussionPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const posts = await moodleService.getDiscussionPosts(
      parseInt(req.params.discussionId),
      user.moodleToken
    );

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch discussion posts'
    });
  }
};

// @desc    Get assignment submissions
// @route   GET /api/moodle/assignments/:assignmentId/submissions
// @access  Private
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const submissions = await moodleService.getAssignmentSubmissions(
      parseInt(req.params.assignmentId),
      user.moodleToken
    );

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch assignment submissions'
    });
  }
};

// ============================================
// WRITE Functions - Send data TO Moodle
// ============================================

// @desc    Send a message to a Moodle user
// @route   POST /api/moodle/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const { toUserId, message } = req.body;

    if (!toUserId || !message) {
      return res.status(400).json({
        success: false,
        message: 'toUserId and message are required'
      });
    }

    const result = await moodleService.sendMessage(
      parseInt(toUserId),
      message,
      user.moodleToken
    );

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};

// @desc    Submit an assignment
// @route   POST /api/moodle/assignments/:assignmentId/submit
// @access  Private
exports.submitAssignment = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const { text, itemId } = req.body;
    const assignmentId = parseInt(req.params.assignmentId);

    const result = await moodleService.submitAssignment(
      assignmentId,
      text,
      itemId,
      user.moodleToken
    );

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit assignment'
    });
  }
};

// @desc    Submit assignment for grading (lock submission)
// @route   POST /api/moodle/assignments/:assignmentId/submit-for-grading
// @access  Private
exports.submitForGrading = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const assignmentId = parseInt(req.params.assignmentId);

    const result = await moodleService.submitAssignmentForGrading(
      assignmentId,
      user.moodleToken
    );

    res.json({
      success: true,
      message: 'Assignment submitted for grading',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit for grading'
    });
  }
};

// @desc    Create a new forum discussion
// @route   POST /api/moodle/forums/:forumId/discussions
// @access  Private
exports.createForumDiscussion = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const { subject, message, options } = req.body;
    const forumId = parseInt(req.params.forumId);

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    const result = await moodleService.addForumDiscussion(
      forumId,
      subject,
      message,
      options || {},
      user.moodleToken
    );

    res.json({
      success: true,
      message: 'Discussion created successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create discussion'
    });
  }
};

// @desc    Reply to a forum post
// @route   POST /api/moodle/posts/:postId/reply
// @access  Private
exports.replyToPost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const { subject, message } = req.body;
    const postId = parseInt(req.params.postId);

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const result = await moodleService.addForumPost(
      postId,
      subject || 'Re: ',
      message,
      user.moodleToken
    );

    res.json({
      success: true,
      message: 'Reply posted successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to post reply'
    });
  }
};

// @desc    Create a calendar event
// @route   POST /api/moodle/calendar/events
// @access  Private
exports.createCalendarEvent = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const { name, description, timestart, duration, options } = req.body;

    if (!name || !timestart) {
      return res.status(400).json({
        success: false,
        message: 'Name and timestart are required'
      });
    }

    const result = await moodleService.createCalendarEvent(
      name,
      description || '',
      parseInt(timestart),
      duration || 0,
      options || {},
      user.moodleToken
    );

    res.json({
      success: true,
      message: 'Calendar event created successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create calendar event'
    });
  }
};

// @desc    Delete a calendar event
// @route   DELETE /api/moodle/calendar/events/:eventId
// @access  Private
exports.deleteCalendarEvent = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const eventId = parseInt(req.params.eventId);

    const result = await moodleService.deleteCalendarEvent(
      eventId,
      user.moodleToken
    );

    res.json({
      success: true,
      message: 'Calendar event deleted successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete calendar event'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/moodle/notifications/:notificationId/read
// @access  Private
exports.markNotificationRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const notificationId = parseInt(req.params.notificationId);

    const result = await moodleService.markNotificationRead(
      notificationId,
      user.moodleToken
    );

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
};

// @desc    Mark all messages with a user as read
// @route   PUT /api/moodle/messages/:userId/read
// @access  Private
exports.markMessagesRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+moodleToken');

    if (!user.moodleLinked || !user.moodleToken) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const userId = parseInt(req.params.userId);

    const result = await moodleService.markMessagesRead(
      userId,
      user.moodleToken
    );

    res.json({
      success: true,
      message: 'Messages marked as read',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark messages as read'
    });
  }
};
