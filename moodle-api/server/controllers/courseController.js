const { body, param } = require('express-validator');
const Course = require('../models/Course');
const moodleService = require('../services/moodleService');

// Validation rules
const courseIdValidation = [
  param('courseId').isNumeric().withMessage('Course ID must be a number')
];

const enrollValidation = [
  body('userId').isNumeric().withMessage('User ID must be a number'),
  body('courseId').isNumeric().withMessage('Course ID must be a number')
];

/**
 * @desc    Get all courses from Moodle
 * @route   GET /api/courses
 * @access  Private
 */
const getCourses = async (req, res) => {
  try {
    const courses = await moodleService.getCourses();

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses from Moodle',
      error: error.message
    });
  }
};

/**
 * @desc    Get single course by ID
 * @route   GET /api/courses/:courseId
 * @access  Private
 */
const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await moodleService.getCourseById(parseInt(courseId));

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
};

/**
 * @desc    Get course contents/modules
 * @route   GET /api/courses/:courseId/contents
 * @access  Private
 */
const getCourseContents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const contents = await moodleService.getCourseContents(parseInt(courseId));

    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course contents',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's enrolled courses
 * @route   GET /api/courses/user/:userId
 * @access  Private
 */
const getUserCourses = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.moodleUserId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required. Link your Moodle account first.'
      });
    }

    const courses = await moodleService.getUserCourses(parseInt(userId));

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user courses',
      error: error.message
    });
  }
};

/**
 * @desc    Get enrolled users in a course
 * @route   GET /api/courses/:courseId/users
 * @access  Private (Teacher/Admin)
 */
const getEnrolledUsers = async (req, res) => {
  try {
    const { courseId } = req.params;
    const users = await moodleService.getEnrolledUsers(parseInt(courseId));

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled users',
      error: error.message
    });
  }
};

/**
 * @desc    Enroll user in a course
 * @route   POST /api/courses/enroll
 * @access  Private (Teacher/Admin)
 */
const enrollUser = async (req, res) => {
  try {
    const { userId, courseId, roleId } = req.body;

    await moodleService.enrollUser(
      parseInt(userId),
      parseInt(courseId),
      roleId ? parseInt(roleId) : 5
    );

    res.json({
      success: true,
      message: 'User enrolled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error enrolling user',
      error: error.message
    });
  }
};

/**
 * @desc    Sync courses from Moodle to local database
 * @route   POST /api/courses/sync
 * @access  Private (Admin)
 */
const syncCourses = async (req, res) => {
  try {
    const moodleCourses = await moodleService.getCourses();
    const syncResults = {
      created: 0,
      updated: 0,
      errors: []
    };

    for (const moodleCourse of moodleCourses) {
      try {
        const courseData = {
          moodleCourseId: moodleCourse.id,
          shortName: moodleCourse.shortname,
          fullName: moodleCourse.fullname,
          summary: moodleCourse.summary || '',
          categoryId: moodleCourse.categoryid,
          startDate: moodleCourse.startdate ? new Date(moodleCourse.startdate * 1000) : null,
          endDate: moodleCourse.enddate ? new Date(moodleCourse.enddate * 1000) : null,
          visible: moodleCourse.visible === 1,
          lastSynced: new Date()
        };

        const existingCourse = await Course.findOne({ moodleCourseId: moodleCourse.id });

        if (existingCourse) {
          await Course.updateOne({ moodleCourseId: moodleCourse.id }, courseData);
          syncResults.updated++;
        } else {
          await Course.create(courseData);
          syncResults.created++;
        }
      } catch (err) {
        syncResults.errors.push({
          courseId: moodleCourse.id,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Courses synced successfully',
      data: syncResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error syncing courses',
      error: error.message
    });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  getCourseContents,
  getUserCourses,
  getEnrolledUsers,
  enrollUser,
  syncCourses,
  courseIdValidation,
  enrollValidation
};
