const { body, param } = require('express-validator');
const moodleService = require('../services/moodleService');

// Validation rules
const assignmentIdValidation = [
  param('assignmentId').isNumeric().withMessage('Assignment ID must be a number')
];

/**
 * @desc    Get assignments for courses
 * @route   GET /api/assignments?courseIds=1,2,3
 * @access  Private
 */
const getAssignments = async (req, res) => {
  try {
    let courseIds = req.query.courseIds;

    if (!courseIds) {
      // If no course IDs provided and user has Moodle account, get their courses
      if (req.user.moodleUserId) {
        const userCourses = await moodleService.getUserCourses(req.user.moodleUserId);
        courseIds = userCourses.map(course => course.id);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Course IDs are required or link your Moodle account'
        });
      }
    } else {
      courseIds = courseIds.split(',').map(id => parseInt(id.trim()));
    }

    const assignments = await moodleService.getAssignments(courseIds);

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
};

/**
 * @desc    Get submissions for an assignment
 * @route   GET /api/assignments/:assignmentId/submissions
 * @access  Private (Teacher/Admin)
 */
const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const submissions = await moodleService.getSubmissions(parseInt(assignmentId));

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: error.message
    });
  }
};

/**
 * @desc    Get quizzes for a course
 * @route   GET /api/assignments/quizzes/:courseId
 * @access  Private
 */
const getQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const quizzes = await moodleService.getQuizzes(parseInt(courseId));

    res.json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quizzes',
      error: error.message
    });
  }
};

/**
 * @desc    Get quiz attempts for a user
 * @route   GET /api/assignments/quizzes/:quizId/attempts/:userId
 * @access  Private
 */
const getQuizAttempts = async (req, res) => {
  try {
    const { quizId, userId } = req.params;
    const attempts = await moodleService.getQuizAttempts(
      parseInt(quizId),
      parseInt(userId)
    );

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz attempts',
      error: error.message
    });
  }
};

/**
 * @desc    Get current user's quiz attempts
 * @route   GET /api/assignments/quizzes/:quizId/my-attempts
 * @access  Private
 */
const getMyQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;
    const moodleUserId = req.user.moodleUserId;

    if (!moodleUserId) {
      return res.status(400).json({
        success: false,
        message: 'Please link your Moodle account first'
      });
    }

    const attempts = await moodleService.getQuizAttempts(
      parseInt(quizId),
      moodleUserId
    );

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your quiz attempts',
      error: error.message
    });
  }
};

module.exports = {
  getAssignments,
  getSubmissions,
  getQuizzes,
  getQuizAttempts,
  getMyQuizAttempts,
  assignmentIdValidation
};
