const Group = require('../models/Group');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const { name, description, type, privacy, subject, topics, moodleCourseId, courseName } = req.body;

    const group = await Group.create({
      name,
      description,
      type: type || 'general',
      privacy: privacy || 'public',
      creator: req.user._id,
      admins: [req.user._id],
      members: [{ user: req.user._id, role: 'admin' }],
      subject,
      topics,
      moodleCourseId,
      courseName
    });

    await group.populate('creator', 'username profilePicture');

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating group',
      error: error.message
    });
  }
};

// @desc    Get all groups (with filters)
// @route   GET /api/groups
// @access  Private
exports.getGroups = async (req, res) => {
  try {
    const { type, privacy, search, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: false };

    if (type) query.type = type;
    if (privacy) query.privacy = privacy;
    if (search) {
      query.$text = { $search: search };
    }

    // Only show public groups and groups user is member of
    query.$or = [
      { privacy: 'public' },
      { 'members.user': req.user._id }
    ];

    const groups = await Group.find(query)
      .populate('creator', 'username profilePicture')
      .populate('members.user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Group.countDocuments(query);

    res.json({
      success: true,
      data: groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching groups',
      error: error.message
    });
  }
};

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Private
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'username profilePicture')
      .populate('admins', 'username profilePicture')
      .populate('moderators', 'username profilePicture')
      .populate('members.user', 'username profilePicture')
      .populate('pendingMembers.user', 'username profilePicture');

    if (!group || group.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user can access private/secret groups
    if (group.privacy === 'secret' && !group.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching group',
      error: error.message
    });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private (Admin only)
exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group || group.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.isAdmin(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update group'
      });
    }

    const allowedUpdates = ['name', 'description', 'avatar', 'coverImage', 'privacy', 'subject', 'topics', 'settings'];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('creator', 'username profilePicture');

    res.json({
      success: true,
      data: updatedGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating group',
      error: error.message
    });
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private (Creator only)
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group || group.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can delete this group'
      });
    }

    group.isDeleted = true;
    await group.save();

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting group',
      error: error.message
    });
  }
};

// @desc    Join group
// @route   POST /api/groups/:id/join
// @access  Private
exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group || group.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.isMember(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this group'
      });
    }

    if (group.privacy === 'private') {
      // Add to pending members
      const alreadyPending = group.pendingMembers.some(
        p => p.user.toString() === req.user._id.toString()
      );

      if (alreadyPending) {
        return res.status(400).json({
          success: false,
          message: 'Join request already pending'
        });
      }

      group.pendingMembers.push({ user: req.user._id });
      await group.save();

      // Notify admins
      for (const adminId of group.admins) {
        await Notification.create({
          recipient: adminId,
          sender: req.user._id,
          type: 'group_join_request',
          content: `${req.user.username} wants to join ${group.name}`,
          relatedGroup: group._id
        });
      }

      return res.json({
        success: true,
        message: 'Join request sent'
      });
    }

    // Public group - join directly
    group.members.push({ user: req.user._id, role: 'member' });
    await group.save();

    // Notify creator
    await Notification.create({
      recipient: group.creator,
      sender: req.user._id,
      type: 'group_join',
      content: `${req.user.username} joined ${group.name}`,
      relatedGroup: group._id
    });

    res.json({
      success: true,
      message: 'Successfully joined the group'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error joining group',
      error: error.message
    });
  }
};

// @desc    Leave group
// @route   POST /api/groups/:id/leave
// @access  Private
exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group || group.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.isMember(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Not a member of this group'
      });
    }

    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Creator cannot leave the group. Transfer ownership or delete the group.'
      });
    }

    group.members = group.members.filter(
      m => m.user.toString() !== req.user._id.toString()
    );
    group.admins = group.admins.filter(
      a => a.toString() !== req.user._id.toString()
    );
    group.moderators = group.moderators.filter(
      m => m.toString() !== req.user._id.toString()
    );

    await group.save();

    res.json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error leaving group',
      error: error.message
    });
  }
};

// @desc    Approve join request
// @route   POST /api/groups/:id/approve/:userId
// @access  Private (Admin/Moderator)
exports.approveJoinRequest = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group || group.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.isModerator(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and moderators can approve join requests'
      });
    }

    const pendingIndex = group.pendingMembers.findIndex(
      p => p.user.toString() === req.params.userId
    );

    if (pendingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    // Remove from pending and add to members
    group.pendingMembers.splice(pendingIndex, 1);
    group.members.push({ user: req.params.userId, role: 'member' });
    await group.save();

    // Notify user
    await Notification.create({
      recipient: req.params.userId,
      sender: req.user._id,
      type: 'group_join_approved',
      content: `Your request to join ${group.name} was approved`,
      relatedGroup: group._id
    });

    res.json({
      success: true,
      message: 'Join request approved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving join request',
      error: error.message
    });
  }
};

// @desc    Reject join request
// @route   POST /api/groups/:id/reject/:userId
// @access  Private (Admin/Moderator)
exports.rejectJoinRequest = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group || group.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.isModerator(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and moderators can reject join requests'
      });
    }

    const pendingIndex = group.pendingMembers.findIndex(
      p => p.user.toString() === req.params.userId
    );

    if (pendingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    group.pendingMembers.splice(pendingIndex, 1);
    await group.save();

    res.json({
      success: true,
      message: 'Join request rejected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting join request',
      error: error.message
    });
  }
};

// @desc    Get user's groups
// @route   GET /api/groups/my-groups
// @access  Private
exports.getMyGroups = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const query = {
      isDeleted: false,
      'members.user': req.user._id
    };

    if (type) query.type = type;

    const groups = await Group.find(query)
      .populate('creator', 'username profilePicture')
      .populate('members.user', 'username profilePicture')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Group.countDocuments(query);

    res.json({
      success: true,
      data: groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching groups',
      error: error.message
    });
  }
};

// @desc    Get group posts
// @route   GET /api/groups/:id/posts
// @access  Private
exports.getGroupPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const group = await Group.findById(req.params.id);

    if (!group || group.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.privacy !== 'public' && !group.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const posts = await Post.find({
      group: group._id,
      isDeleted: false
    })
      .populate('author', 'username profilePicture')
      .populate('comments')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({
      group: group._id,
      isDeleted: false
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching group posts',
      error: error.message
    });
  }
};

// @desc    Create post in group
// @route   POST /api/groups/:id/posts
// @access  Private (Members only)
exports.createGroupPost = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group || group.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only members can post in this group'
      });
    }

    if (!group.settings.allowMemberPosts && !group.isModerator(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and moderators can post in this group'
      });
    }

    const { content, images } = req.body;

    const post = await Post.create({
      author: req.user._id,
      content,
      images,
      group: group._id,
      visibility: 'group'
    });

    await post.populate('author', 'username profilePicture');

    // Update group post count
    group.postCount += 1;
    await group.save();

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
};

// @desc    Get study groups by course
// @route   GET /api/groups/course/:courseId
// @access  Private
exports.getStudyGroupsByCourse = async (req, res) => {
  try {
    const groups = await Group.find({
      moodleCourseId: parseInt(req.params.courseId),
      type: 'study',
      isDeleted: false
    })
      .populate('creator', 'username profilePicture')
      .populate('members.user', 'username profilePicture')
      .sort({ memberCount: -1 });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching study groups',
      error: error.message
    });
  }
};
