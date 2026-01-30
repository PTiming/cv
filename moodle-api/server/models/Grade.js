const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  moodleGradeId: {
    type: Number,
    default: null
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemType: {
    type: String,
    enum: ['assignment', 'quiz', 'forum', 'manual', 'category', 'course'],
    default: 'manual'
  },
  grade: {
    type: Number,
    default: null
  },
  gradeMax: {
    type: Number,
    default: 100
  },
  gradeMin: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  timeGraded: {
    type: Date,
    default: null
  },
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for user and course
gradeSchema.index({ user: 1, course: 1, itemName: 1 });

module.exports = mongoose.model('Grade', gradeSchema);
