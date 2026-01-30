const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const courseRoutes = require('./courses');
const gradeRoutes = require('./grades');
const assignmentRoutes = require('./assignments');

// Mount routes
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/grades', gradeRoutes);
router.use('/assignments', assignmentRoutes);

// API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Moodle Integration API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
