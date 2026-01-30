const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseById,
  getCourseContents,
  getUserCourses,
  getEnrolledUsers,
  enrollUser,
  syncCourses,
  courseIdValidation,
  enrollValidation
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { apiLimiter, sensitiveLimiter } = require('../middleware/rateLimit');

// All routes require rate limiting and authentication
router.use(apiLimiter);
router.use(protect);

// Get all courses
router.get('/', getCourses);

// Get user's enrolled courses
router.get('/my-courses', (req, res, next) => {
  req.params.userId = req.user.moodleUserId;
  getUserCourses(req, res, next);
});

// Get specific user's enrolled courses
router.get('/user/:userId', getUserCourses);

// Sync courses from Moodle (Admin only) - sensitive operation
router.post('/sync', sensitiveLimiter, authorize('admin'), syncCourses);

// Enroll user in course (Teacher/Admin only) - sensitive operation
router.post('/enroll', sensitiveLimiter, authorize('teacher', 'admin'), enrollValidation, validate, enrollUser);

// Get single course
router.get('/:courseId', courseIdValidation, validate, getCourseById);

// Get course contents
router.get('/:courseId/contents', courseIdValidation, validate, getCourseContents);

// Get enrolled users in a course (Teacher/Admin only)
router.get('/:courseId/users', authorize('teacher', 'admin'), courseIdValidation, validate, getEnrolledUsers);

module.exports = router;
