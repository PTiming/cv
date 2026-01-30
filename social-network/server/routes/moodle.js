const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const moodleController = require('../controllers/moodleController');

// @route   GET /api/moodle/courses
router.get('/courses', auth, moodleController.getMoodleCourses);

// @route   GET /api/moodle/courses/:courseId/contents
router.get('/courses/:courseId/contents', auth, moodleController.getCourseContents);

// @route   GET /api/moodle/courses/:courseId/users
router.get('/courses/:courseId/users', auth, moodleController.getCourseUsers);

// @route   GET /api/moodle/courses/:courseId/grades
router.get('/courses/:courseId/grades', auth, moodleController.getCourseGrades);

// @route   GET /api/moodle/courses/:courseId/forums
router.get('/courses/:courseId/forums', auth, moodleController.getCourseForums);

// @route   GET /api/moodle/courses/:courseId/quizzes
router.get('/courses/:courseId/quizzes', auth, moodleController.getCourseQuizzes);

// @route   GET /api/moodle/assignments
router.get('/assignments', auth, moodleController.getAssignments);

// @route   GET /api/moodle/deadlines
router.get('/deadlines', auth, moodleController.getDeadlines);

// @route   POST /api/moodle/sync-notifications
router.post('/sync-notifications', auth, moodleController.syncNotifications);

module.exports = router;
