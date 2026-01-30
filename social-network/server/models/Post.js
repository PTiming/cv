const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [5000, 'Post cannot exceed 5000 characters']
  },
  images: [{
    url: String,
    publicId: String
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Original post reference for shared posts
  originalPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  isShared: {
    type: Boolean,
    default: false
  },
  // Moodle integration - link posts to courses
  moodleCourseId: {
    type: Number
  },
  moodleActivityId: {
    type: Number
  },
  moodleActivityType: {
    type: String,
    enum: ['assignment', 'quiz', 'forum', 'resource', 'announcement']
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private', 'course'],
    default: 'public'
  },
  tags: [{
    type: String,
    trim: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
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
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for share count
postSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

// Index for efficient querying
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ moodleCourseId: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ content: 'text' });

module.exports = mongoose.model('Post', postSchema);
