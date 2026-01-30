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

// All routes require authentication
router.use(protect);

// Get grades for a course
router.get('/', gradeQueryValidation, validate, getGrades);

// Get current user's grades for a course
router.get('/my-grades/:courseId', getMyGrades);

// Get grade items for a course
router.get('/items/:courseId', getGradeItems);

// Get user's grade report
router.get('/report/:courseId/:userId', getUserGradeReport);

// Submit/update grade (Teacher/Admin only)
router.post('/submit', authorize('teacher', 'admin'), submitGradeValidation, validate, submitGrade);

// Sync grades from Moodle (Admin only)
router.post('/sync/:courseId', authorize('admin'), syncGrades);

module.exports = router;
