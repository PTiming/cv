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
