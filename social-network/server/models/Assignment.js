const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 2000
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'completed'],
    default: 'todo'
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  attachments: [{
    url: String,
    filename: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  // Creator of the collaborative assignment
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Group this assignment belongs to
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  // Collaborators
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'editor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Course-specific
  moodleCourseId: {
    type: Number
  },
  moodleAssignmentId: {
    type: Number
  },
  courseName: {
    type: String
  },
  // Due date
  dueDate: {
    type: Date
  },
  // Tasks breakdown
  tasks: [taskSchema],
  // Overall progress (calculated)
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Status
  status: {
    type: String,
    enum: ['planning', 'in_progress', 'review', 'completed', 'submitted'],
    default: 'planning'
  },
  // Shared files
  files: [{
    url: String,
    filename: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    }
  }],
  // Discussion/comments
  discussions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      maxlength: 2000
    },
    attachments: [{
      url: String,
      filename: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Activity log
  activityLog: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'task_added', 'task_completed', 'file_uploaded', 'comment_added', 'collaborator_added', 'status_changed']
    },
    details: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['private', 'group', 'public'],
    default: 'private'
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

// Virtual for collaborator count
assignmentSchema.virtual('collaboratorCount').get(function() {
  return this.collaborators.length;
});

// Virtual for task count
assignmentSchema.virtual('taskCount').get(function() {
  return this.tasks.length;
});

// Virtual for completed task count
assignmentSchema.virtual('completedTaskCount').get(function() {
  return this.tasks.filter(t => t.status === 'completed').length;
});

// Calculate progress based on tasks
assignmentSchema.methods.calculateProgress = function() {
  if (this.tasks.length === 0) return 0;
  const completed = this.tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / this.tasks.length) * 100);
};

// Pre-save hook to update progress
assignmentSchema.pre('save', function(next) {
  this.progress = this.calculateProgress();
  next();
});

// Indexes
assignmentSchema.index({ title: 'text', description: 'text' });
assignmentSchema.index({ creator: 1, createdAt: -1 });
assignmentSchema.index({ 'collaborators.user': 1 });
assignmentSchema.index({ group: 1 });
assignmentSchema.index({ moodleCourseId: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ status: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
