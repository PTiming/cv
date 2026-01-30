const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['document', 'link', 'video', 'image', 'note', 'other'],
    default: 'document'
  },
  // File information for uploaded resources
  file: {
    url: String,
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number
  },
  // External link
  externalUrl: {
    type: String
  },
  // For notes/text content
  content: {
    type: String,
    maxlength: [50000, 'Content cannot exceed 50000 characters']
  },
  // Resource ownership
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Can belong to a group or be standalone
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  // Course-specific
  moodleCourseId: {
    type: Number
  },
  courseName: {
    type: String
  },
  // Moodle resource link
  moodleResource: {
    activityId: Number,
    activityType: String,
    activityName: String,
    sectionId: Number,
    sectionName: String
  },
  // Categorization
  subject: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Access control
  visibility: {
    type: String,
    enum: ['public', 'group', 'private'],
    default: 'public'
  },
  // Engagement
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Comments on the resource
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for like count
resourceSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
resourceSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Indexes
resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });
resourceSchema.index({ author: 1, createdAt: -1 });
resourceSchema.index({ group: 1 });
resourceSchema.index({ moodleCourseId: 1 });
resourceSchema.index({ type: 1 });
resourceSchema.index({ tags: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
