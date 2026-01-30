const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  moodleCourseId: {
    type: Number,
    required: true,
    unique: true
  },
  shortName: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
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
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  visible: {
    type: Boolean,
    default: true
  },
  enrolledUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
