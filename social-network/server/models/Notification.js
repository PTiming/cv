const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'like',
      'comment',
      'follow',
      'mention',
      'share',
      'reply',
      'moodle_assignment',
      'moodle_grade',
      'moodle_message',
      'moodle_announcement',
      'moodle_deadline',
      // Group notifications
      'group_join_request',
      'group_join',
      'group_join_approved',
      'group_added',
      // Resource notifications
      'resource_like',
      'resource_comment',
      // Assignment notifications
      'assignment_invite',
      'assignment_comment',
      'task_assigned'
    ],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  // Related entities
  relatedGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  relatedResource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  },
  relatedAssignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  // Moodle-specific notification data
  moodleData: {
    courseId: Number,
    courseName: String,
    activityId: Number,
    activityName: String,
    dueDate: Date,
    grade: Number,
    message: String
  },
  content: {
    type: String,
    maxlength: 500
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
