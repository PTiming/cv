const express = require('express');
const router = express.Router();
const {
  getGrades,
  getGradeItems,
  getUserGradeReport,
  getMyGrades,
  submitGrade,
  syncGrades,
  gradeQueryValidation,
  submitGradeValidation
} = require('../controllers/gradeController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { apiLimiter, sensitiveLimiter } = require('../middleware/rateLimit');

// All routes require rate limiting and authentication
router.use(apiLimiter);
router.use(protect);

// Get grades for a course
router.get('/', gradeQueryValidation, validate, getGrades);

// Get current user's grades for a course
router.get('/my-grades/:courseId', getMyGrades);

// Get grade items for a course
router.get('/items/:courseId', getGradeItems);

// Get user's grade report
router.get('/report/:courseId/:userId', getUserGradeReport);

// Submit/update grade (Teacher/Admin only) - sensitive operation
router.post('/submit', sensitiveLimiter, authorize('teacher', 'admin'), submitGradeValidation, validate, submitGrade);

// Sync grades from Moodle (Admin only) - sensitive operation
router.post('/sync/:courseId', sensitiveLimiter, authorize('admin'), syncGrades);

module.exports = router;
