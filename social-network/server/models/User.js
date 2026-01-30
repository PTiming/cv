const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100
  },
  website: {
    type: String,
    maxlength: 200
  },
  dateOfBirth: {
    type: Date
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Moodle LMS Integration
  moodleUserId: {
    type: Number,
    sparse: true
  },
  moodleToken: {
    type: String,
    select: false
  },
  moodleLinked: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin', 'instructor', 'student'],
    default: 'user'
  },
  // Ban information
  banReason: {
    type: String,
    maxlength: 500
  },
  bannedAt: {
    type: Date
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Warnings
  warnings: [{
    reason: String,
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    issuedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Recent searches
  recentSearches: [{
    query: String,
    type: {
      type: String,
      enum: ['all', 'posts', 'users', 'groups', 'resources']
    },
    searchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Online status
  isOnline: {
    type: Boolean,
    default: false
  },
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorBackupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.username;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.toPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    avatar: this.avatar,
    bio: this.bio,
    location: this.location,
    website: this.website,
    followersCount: this.followers ? this.followers.length : 0,
    followingCount: this.following ? this.following.length : 0,
    moodleLinked: this.moodleLinked,
    role: this.role,
    isActive: this.isActive,
    twoFactorEnabled: this.twoFactorEnabled || false,
    createdAt: this.createdAt
  };
};

// Index for search
userSchema.index({ username: 'text', firstName: 'text', lastName: 'text' });

module.exports = mongoose.model('User', userSchema);
