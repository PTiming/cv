const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  moodleCourseId: {
    type: Number,
    required: true,
    unique: true
  },
  shortname: {
    type: String,
    required: true,
    trim: true
  },
  fullname: {
    type: String,
    required: true,
    trim: true
  },
  displayname: {
    type: String,
    trim: true
  },
  summary: {
    type: String,
    default: ''
  },
  categoryId: {
    type: Number,
    default: null
  },
  visible: {
    type: Boolean,
    default: true
  },
  format: {
    type: String,
    default: 'topics'
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  enrolledUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastSynced: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
CourseSchema.index({ moodleCourseId: 1 });
CourseSchema.index({ shortname: 1 });

module.exports = mongoose.model('Course', CourseSchema);
