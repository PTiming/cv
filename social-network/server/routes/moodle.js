const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const moodleController = require('../controllers/moodleController');

// ============================================
// READ Routes - Get data FROM Moodle
// ============================================

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

// @route   GET /api/moodle/forums/:forumId/discussions
router.get('/forums/:forumId/discussions', auth, moodleController.getForumDiscussions);

// @route   GET /api/moodle/discussions/:discussionId/posts
router.get('/discussions/:discussionId/posts', auth, moodleController.getDiscussionPosts);

// @route   GET /api/moodle/assignments/:assignmentId/submissions
router.get('/assignments/:assignmentId/submissions', auth, moodleController.getAssignmentSubmissions);

// ============================================
// WRITE Routes - Send data TO Moodle
// ============================================

// @route   POST /api/moodle/sync-notifications
router.post('/sync-notifications', auth, moodleController.syncNotifications);

// @route   POST /api/moodle/messages
// @desc    Send a message to a Moodle user
router.post('/messages', auth, moodleController.sendMessage);

// @route   POST /api/moodle/assignments/:assignmentId/submit
// @desc    Submit an assignment
router.post('/assignments/:assignmentId/submit', auth, moodleController.submitAssignment);

// @route   POST /api/moodle/assignments/:assignmentId/submit-for-grading
// @desc    Submit assignment for grading (lock submission)
router.post('/assignments/:assignmentId/submit-for-grading', auth, moodleController.submitForGrading);

// @route   POST /api/moodle/forums/:forumId/discussions
// @desc    Create a new forum discussion
router.post('/forums/:forumId/discussions', auth, moodleController.createForumDiscussion);

// @route   POST /api/moodle/posts/:postId/reply
// @desc    Reply to a forum post
router.post('/posts/:postId/reply', auth, moodleController.replyToPost);

// @route   POST /api/moodle/calendar/events
// @desc    Create a calendar event
router.post('/calendar/events', auth, moodleController.createCalendarEvent);

// @route   DELETE /api/moodle/calendar/events/:eventId
// @desc    Delete a calendar event
router.delete('/calendar/events/:eventId', auth, moodleController.deleteCalendarEvent);

// @route   PUT /api/moodle/notifications/:notificationId/read
// @desc    Mark notification as read
router.put('/notifications/:notificationId/read', auth, moodleController.markNotificationRead);

// @route   PUT /api/moodle/messages/:userId/read
// @desc    Mark all messages with a user as read
router.put('/messages/:userId/read', auth, moodleController.markMessagesRead);

module.exports = router;
