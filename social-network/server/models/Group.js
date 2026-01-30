const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    maxlength: [100, 'Group name cannot exceed 100 characters'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['general', 'study', 'course'],
    default: 'general'
  },
  avatar: {
    type: String
  },
  coverImage: {
    type: String
  },
  privacy: {
    type: String,
    enum: ['public', 'private', 'secret'],
    default: 'public'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    }
  }],
  pendingMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Course-specific fields for study groups
  moodleCourseId: {
    type: Number
  },
  courseName: {
    type: String
  },
  // Study group specific
  subject: {
    type: String
  },
  topics: [{
    type: String,
    trim: true
  }],
  // Group settings
  settings: {
    allowMemberPosts: {
      type: Boolean,
      default: true
    },
    requirePostApproval: {
      type: Boolean,
      default: false
    },
    allowMemberInvites: {
      type: Boolean,
      default: true
    }
  },
  // Statistics
  postCount: {
    type: Number,
    default: 0
  },
  resourceCount: {
    type: Number,
    default: 0
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

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Indexes for efficient querying
groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ type: 1, privacy: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ moodleCourseId: 1 });
groupSchema.index({ topics: 1 });
groupSchema.index({ createdAt: -1 });

// Method to check if user is a member
groupSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

// Method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  return this.admins.some(a => a.toString() === userId.toString()) || 
         this.creator.toString() === userId.toString();
};

// Method to check if user is moderator
groupSchema.methods.isModerator = function(userId) {
  return this.moderators.some(m => m.toString() === userId.toString()) || 
         this.isAdmin(userId);
};

module.exports = mongoose.model('Group', groupSchema);
