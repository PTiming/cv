const express = require('express');
const {
  getSiteInfo,
  getMyCourses,
  getCourseContents,
  getCourseGrades,
  getAssignments,
  getQuizzes,
  getForums,
  getCalendarEvents,
  getCourseCompletion,
  markActivityComplete,
  sendMessage,
  getMessages
} = require('../controllers/moodleController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Site info
router.get('/site-info', getSiteInfo);

// Courses
router.get('/my-courses', getMyCourses);
router.get('/courses/:courseId/contents', getCourseContents);
router.get('/courses/:courseId/grades', getCourseGrades);
router.get('/courses/:courseId/completion', getCourseCompletion);

// Activities
router.get('/assignments', getAssignments);
router.get('/quizzes', getQuizzes);
router.get('/forums', getForums);
router.post('/activities/:cmid/complete', markActivityComplete);

// Calendar
router.get('/calendar', getCalendarEvents);

// Messages
router.get('/messages', getMessages);
router.post('/messages', sendMessage);

module.exports = router;
