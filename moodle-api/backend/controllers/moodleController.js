const MoodleService = require('../services/moodleService');
const User = require('../models/User');

/**
 * Get Moodle service instance for user
 */
const getMoodleService = async (user) => {
  const userWithToken = await User.findById(user.id).select('+moodleToken');
  if (!userWithToken.moodleToken) {
    throw new Error('User is not connected to Moodle');
  }
  return new MoodleService(userWithToken.moodleToken);
};

/**
 * @desc    Get site info
 * @route   GET /api/moodle/site-info
 * @access  Private
 */
exports.getSiteInfo = async (req, res) => {
  try {
    const moodleService = await getMoodleService(req.user);
    const siteInfo = await moodleService.getSiteInfo();

    res.status(200).json({
      success: true,
      data: siteInfo
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get user's courses from Moodle
 * @route   GET /api/moodle/my-courses
 * @access  Private
 */
exports.getMyCourses = async (req, res) => {
  try {
    const moodleService = await getMoodleService(req.user);
    const user = await User.findById(req.user.id);
    
    if (!user.moodleUserId) {
      return res.status(400).json({
        success: false,
        error: 'User not connected to Moodle'
      });
    }

    const courses = await moodleService.getUserCourses(user.moodleUserId);

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * Helper function to validate positive integer
 */
const isValidPositiveInt = (value) => {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0 && String(num) === String(value);
};

/**
 * @desc    Get course contents
 * @route   GET /api/moodle/courses/:courseId/contents
 * @access  Private
 */
exports.getCourseContents = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!isValidPositiveInt(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID'
      });
    }

    const moodleService = await getMoodleService(req.user);
    const contents = await moodleService.getCourseContents(courseId);

    res.status(200).json({
      success: true,
      data: contents
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get grades for a course
 * @route   GET /api/moodle/courses/:courseId/grades
 * @access  Private
 */
exports.getCourseGrades = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!isValidPositiveInt(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID'
      });
    }

    const moodleService = await getMoodleService(req.user);
    const user = await User.findById(req.user.id);
    const grades = await moodleService.getGrades(courseId, user.moodleUserId);

    res.status(200).json({
      success: true,
      data: grades
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get assignments for courses
 * @route   GET /api/moodle/assignments
 * @access  Private
 */
exports.getAssignments = async (req, res) => {
  try {
    const moodleService = await getMoodleService(req.user);
    const courseIds = req.query.courseIds ? req.query.courseIds.split(',').map(Number) : [];
    
    if (courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide course IDs'
      });
    }

    const assignments = await moodleService.getAssignments(courseIds);

    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get quizzes for courses
 * @route   GET /api/moodle/quizzes
 * @access  Private
 */
exports.getQuizzes = async (req, res) => {
  try {
    const moodleService = await getMoodleService(req.user);
    const courseIds = req.query.courseIds ? req.query.courseIds.split(',').map(Number) : [];
    
    if (courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide course IDs'
      });
    }

    const quizzes = await moodleService.getQuizzes(courseIds);

    res.status(200).json({
      success: true,
      data: quizzes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get forums for courses
 * @route   GET /api/moodle/forums
 * @access  Private
 */
exports.getForums = async (req, res) => {
  try {
    const moodleService = await getMoodleService(req.user);
    const courseIds = req.query.courseIds ? req.query.courseIds.split(',').map(Number) : [];
    
    if (courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide course IDs'
      });
    }

    const forums = await moodleService.getForums(courseIds);

    res.status(200).json({
      success: true,
      data: forums
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get calendar events
 * @route   GET /api/moodle/calendar
 * @access  Private
 */
exports.getCalendarEvents = async (req, res) => {
  try {
    const moodleService = await getMoodleService(req.user);
    const { courseIds, timestart, timeend } = req.query;
    
    const options = {};
    if (courseIds) {
      options.courseIds = courseIds.split(',').map(Number);
    }
    if (timestart) {
      options.timestart = parseInt(timestart);
    }
    if (timeend) {
      options.timeend = parseInt(timeend);
    }

    const events = await moodleService.getCalendarEvents(options);

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get course completion status
 * @route   GET /api/moodle/courses/:courseId/completion
 * @access  Private
 */
exports.getCourseCompletion = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!isValidPositiveInt(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID'
      });
    }

    const moodleService = await getMoodleService(req.user);
    const user = await User.findById(req.user.id);
    const completion = await moodleService.getCourseCompletion(courseId, user.moodleUserId);

    res.status(200).json({
      success: true,
      data: completion
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Mark activity as complete
 * @route   POST /api/moodle/activities/:cmid/complete
 * @access  Private
 */
exports.markActivityComplete = async (req, res) => {
  try {
    const { cmid } = req.params;
    if (!isValidPositiveInt(cmid)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid activity ID'
      });
    }

    const moodleService = await getMoodleService(req.user);
    const { completed } = req.body;
    
    const result = await moodleService.markActivityComplete(
      cmid,
      completed !== false
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Send message
 * @route   POST /api/moodle/messages
 * @access  Private
 */
exports.sendMessage = async (req, res) => {
  try {
    const moodleService = await getMoodleService(req.user);
    const { toUserId, text } = req.body;
    
    if (!toUserId || !text) {
      return res.status(400).json({
        success: false,
        error: 'Please provide toUserId and text'
      });
    }

    const result = await moodleService.sendMessages([{ toUserId, text }]);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get messages
 * @route   GET /api/moodle/messages
 * @access  Private
 */
exports.getMessages = async (req, res) => {
  try {
    const moodleService = await getMoodleService(req.user);
    const user = await User.findById(req.user.id);
    const { type } = req.query;
    
    const messages = await moodleService.getMessages(user.moodleUserId, type);

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
