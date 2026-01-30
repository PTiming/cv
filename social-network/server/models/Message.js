const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'moodle_link'],
    default: 'text'
  },
  attachments: [{
    url: String,
    filename: String,
    fileType: String,
    size: Number
  }],
  // Moodle resource link
  moodleResource: {
    courseId: Number,
    activityId: Number,
    activityType: String,
    activityName: String,
    url: String
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
