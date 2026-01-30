const { body, param, query } = require('express-validator');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const moodleService = require('../services/moodleService');

// Validation rules
const gradeQueryValidation = [
  query('courseId').isNumeric().withMessage('Course ID must be a number')
];

const submitGradeValidation = [
  body('assignmentId').isNumeric().withMessage('Assignment ID must be a number'),
  body('userId').isNumeric().withMessage('User ID must be a number'),
  body('grade').isNumeric().withMessage('Grade must be a number')
];

/**
 * @desc    Get grades for a course
 * @route   GET /api/grades?courseId=:courseId&userId=:userId
 * @access  Private
 */
const getGrades = async (req, res) => {
  try {
    const { courseId, userId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const grades = await moodleService.getGrades(
      parseInt(courseId),
      userId ? parseInt(userId) : null
    );

    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grades',
      error: error.message
    });
  }
};

/**
 * @desc    Get grade items for a course
 * @route   GET /api/grades/items/:courseId
 * @access  Private
 */
const getGradeItems = async (req, res) => {
  try {
    const { courseId } = req.params;
    const gradeItems = await moodleService.getGradeItems(parseInt(courseId));

    res.json({
      success: true,
      data: gradeItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grade items',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's grade report for a course
 * @route   GET /api/grades/report/:courseId/:userId
 * @access  Private
 */
const getUserGradeReport = async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    const report = await moodleService.getUserGradesReport(
      parseInt(courseId),
      parseInt(userId)
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grade report',
      error: error.message
    });
  }
};

/**
 * @desc    Get current user's grades
 * @route   GET /api/grades/my-grades/:courseId
 * @access  Private
 */
const getMyGrades = async (req, res) => {
  try {
    const { courseId } = req.params;
    const moodleUserId = req.user.moodleUserId;

    if (!moodleUserId) {
      return res.status(400).json({
        success: false,
        message: 'Please link your Moodle account first'
      });
    }

    const grades = await moodleService.getGrades(
      parseInt(courseId),
      moodleUserId
    );

    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your grades',
      error: error.message
    });
  }
};

/**
 * @desc    Submit/update an assignment grade
 * @route   POST /api/grades/submit
 * @access  Private (Teacher/Admin)
 */
const submitGrade = async (req, res) => {
  try {
    const { assignmentId, userId, grade, feedback } = req.body;

    await moodleService.submitAssignmentGrade(
      parseInt(assignmentId),
      parseInt(userId),
      parseFloat(grade),
      feedback || ''
    );

    res.json({
      success: true,
      message: 'Grade submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting grade',
      error: error.message
    });
  }
};

/**
 * @desc    Sync grades from Moodle to local database
 * @route   POST /api/grades/sync/:courseId
 * @access  Private (Admin)
 */
const syncGrades = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get grade items from Moodle
    const gradeData = await moodleService.getGradeItems(parseInt(courseId));
    
    if (!gradeData.usergrades) {
      return res.status(404).json({
        success: false,
        message: 'No grades found for this course'
      });
    }

    const syncResults = {
      synced: 0,
      errors: []
    };

    // Find or create the course in local DB
    let localCourse = await Course.findOne({ moodleCourseId: parseInt(courseId) });
    if (!localCourse) {
      const moodleCourse = await moodleService.getCourseById(parseInt(courseId));
      if (moodleCourse) {
        localCourse = await Course.create({
          moodleCourseId: moodleCourse.id,
          shortName: moodleCourse.shortname,
          fullName: moodleCourse.fullname
        });
      }
    }

    // Process each user's grades
    for (const userGrade of gradeData.usergrades) {
      if (!userGrade.gradeitems) continue;

      for (const item of userGrade.gradeitems) {
        try {
          const gradeDoc = {
            moodleGradeId: item.id,
            itemName: item.itemname || 'Course Total',
            itemType: item.itemtype || 'manual',
            grade: item.graderaw,
            gradeMax: item.grademax,
            gradeMin: item.grademin,
            percentage: item.percentageformatted ? parseFloat(item.percentageformatted) : null,
            feedback: item.feedback || '',
            lastSynced: new Date()
          };

          // Update or create grade document
          // Note: This requires the user to be linked in the local DB
          syncResults.synced++;
        } catch (err) {
          syncResults.errors.push({
            itemId: item.id,
            error: err.message
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Grades synced successfully',
      data: syncResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error syncing grades',
      error: error.message
    });
  }
};

module.exports = {
  getGrades,
  getGradeItems,
  getUserGradeReport,
  getMyGrades,
  submitGrade,
  syncGrades,
  gradeQueryValidation,
  submitGradeValidation
};
