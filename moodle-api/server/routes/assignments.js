const express = require('express');
const router = express.Router();
const {
  getAssignments,
  getSubmissions,
  getQuizzes,
  getQuizAttempts,
  getMyQuizAttempts,
  assignmentIdValidation
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { apiLimiter } = require('../middleware/rateLimit');

// All routes require rate limiting and authentication
router.use(apiLimiter);
router.use(protect);

// Get assignments for courses
router.get('/', getAssignments);

// Get submissions for an assignment (Teacher/Admin only)
router.get('/:assignmentId/submissions', authorize('teacher', 'admin'), assignmentIdValidation, validate, getSubmissions);

// Get quizzes for a course
router.get('/quizzes/:courseId', getQuizzes);

// Get current user's quiz attempts
router.get('/quizzes/:quizId/my-attempts', getMyQuizAttempts);

// Get quiz attempts for a specific user (Teacher/Admin only)
router.get('/quizzes/:quizId/attempts/:userId', authorize('teacher', 'admin'), getQuizAttempts);

module.exports = router;
