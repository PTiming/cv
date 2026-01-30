const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
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
  moodleEnrollmentId: {
    type: Number,
    default: null
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'manager', 'editingteacher'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'completed'],
    default: 'active'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  grades: [{
    activityId: Number,
    activityName: String,
    grade: Number,
    maxGrade: Number,
    gradedAt: Date
  }]
});

// Compound index for unique enrollment
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
