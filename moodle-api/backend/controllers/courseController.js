const Course = require('../models/Course');
const MoodleService = require('../services/moodleService');
const User = require('../models/User');

/**
 * @desc    Get all courses from local database
 * @route   GET /api/courses
 * @access  Private
 */
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get single course
 * @route   GET /api/courses/:id
 * @access  Private
 */
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Sync courses from Moodle
 * @route   POST /api/courses/sync
 * @access  Private/Admin
 */
exports.syncCourses = async (req, res) => {
  try {
    const moodleService = new MoodleService();
    const moodleCourses = await moodleService.getCourses();

    const syncedCourses = [];

    for (const moodleCourse of moodleCourses) {
      const courseData = {
        moodleCourseId: moodleCourse.id,
        shortname: moodleCourse.shortname,
        fullname: moodleCourse.fullname,
        displayname: moodleCourse.displayname,
        summary: moodleCourse.summary,
        categoryId: moodleCourse.categoryid,
        visible: moodleCourse.visible === 1,
        format: moodleCourse.format,
        startDate: moodleCourse.startdate ? new Date(moodleCourse.startdate * 1000) : null,
        endDate: moodleCourse.enddate ? new Date(moodleCourse.enddate * 1000) : null,
        lastSynced: new Date()
      };

      const course = await Course.findOneAndUpdate(
        { moodleCourseId: moodleCourse.id },
        courseData,
        { upsert: true, new: true }
      );

      syncedCourses.push(course);
    }

    res.status(200).json({
      success: true,
      count: syncedCourses.length,
      data: syncedCourses
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Create course in Moodle and sync
 * @route   POST /api/courses
 * @access  Private/Admin
 */
exports.createCourse = async (req, res) => {
  try {
    const { fullname, shortname, categoryId, summary } = req.body;

    if (!fullname || !shortname) {
      return res.status(400).json({
        success: false,
        error: 'Please provide fullname and shortname'
      });
    }

    const moodleService = new MoodleService();
    const moodleCourses = await moodleService.createCourses([{
      fullname,
      shortname,
      categoryid: categoryId || 1,
      summary: summary || ''
    }]);

    // Create local course record
    const course = await Course.create({
      moodleCourseId: moodleCourses[0].id,
      shortname,
      fullname,
      summary: summary || '',
      categoryId: categoryId || 1,
      lastSynced: new Date()
    });

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get course by Moodle ID
 * @route   GET /api/courses/moodle/:moodleId
 * @access  Private
 */
exports.getCourseByMoodleId = async (req, res) => {
  try {
    const course = await Course.findOne({ moodleCourseId: req.params.moodleId });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
