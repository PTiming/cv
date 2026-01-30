const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  moodleActivityId: {
    type: Number,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  modname: {
    type: String,
    required: true,
    enum: ['assign', 'quiz', 'forum', 'resource', 'url', 'page', 'book', 'folder', 'label', 'workshop', 'glossary', 'wiki', 'choice', 'feedback', 'lesson', 'scorm', 'data', 'chat', 'survey', 'lti']
  },
  description: {
    type: String,
    default: ''
  },
  visible: {
    type: Boolean,
    default: true
  },
  section: {
    type: Number,
    default: 0
  },
  completion: {
    type: String,
    enum: ['none', 'manual', 'automatic'],
    default: 'none'
  },
  dueDate: {
    type: Date,
    default: null
  },
  allowSubmissionsFrom: {
    type: Date,
    default: null
  },
  cutoffDate: {
    type: Date,
    default: null
  },
  maxGrade: {
    type: Number,
    default: 100
  },
  lastSynced: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
ActivitySchema.index({ moodleActivityId: 1 });
ActivitySchema.index({ course: 1 });
ActivitySchema.index({ modname: 1 });

module.exports = mongoose.model('Activity', ActivitySchema);
