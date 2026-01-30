const express = require('express');
const {
  getCourses,
  getCourse,
  syncCourses,
  createCourse,
  getCourseByMoodleId
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Public (authenticated) routes
router.get('/', getCourses);
router.get('/:id', getCourse);
router.get('/moodle/:moodleId', getCourseByMoodleId);

// Admin routes
router.post('/sync', authorize('admin'), syncCourses);
router.post('/', authorize('admin'), createCourse);

module.exports = router;
