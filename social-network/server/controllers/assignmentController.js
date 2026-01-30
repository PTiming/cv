const Assignment = require('../models/Assignment');
const Group = require('../models/Group');
const Notification = require('../models/Notification');

// @desc    Create a new collaborative assignment
// @route   POST /api/assignments
// @access  Private
exports.createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      group,
      moodleCourseId,
      moodleAssignmentId,
      courseName,
      dueDate,
      collaborators,
      visibility
    } = req.body;

    // If assignment belongs to a group, check membership
    if (group) {
      const groupDoc = await Group.findById(group);
      if (!groupDoc || groupDoc.isDeleted) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }
      if (!groupDoc.isMember(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Only group members can create assignments'
        });
      }
    }

    const assignment = await Assignment.create({
      title,
      description,
      creator: req.user._id,
      group,
      moodleCourseId,
      moodleAssignmentId,
      courseName,
      dueDate,
      collaborators: [
        { user: req.user._id, role: 'owner' },
        ...(collaborators || []).map(c => ({ user: c, role: 'editor' }))
      ],
      visibility: visibility || (group ? 'group' : 'private'),
      activityLog: [{
        user: req.user._id,
        action: 'created',
        details: 'Created the assignment'
      }]
    });

    await assignment.populate('creator', 'username profilePicture');
    await assignment.populate('collaborators.user', 'username profilePicture');

    // Notify collaborators
    if (collaborators && collaborators.length > 0) {
      for (const userId of collaborators) {
        await Notification.create({
          recipient: userId,
          sender: req.user._id,
          type: 'assignment_invite',
          content: `${req.user.username} added you to the assignment "${title}"`,
          relatedAssignment: assignment._id
        });
      }
    }

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating assignment',
      error: error.message
    });
  }
};

// @desc    Get all assignments for user
// @route   GET /api/assignments
// @access  Private
exports.getAssignments = async (req, res) => {
  try {
    const { status, courseId, groupId, page = 1, limit = 20 } = req.query;
    const query = {
      isDeleted: false,
      $or: [
        { creator: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    };

    if (status) query.status = status;
    if (courseId) query.moodleCourseId = parseInt(courseId);
    if (groupId) query.group = groupId;

    const assignments = await Assignment.find(query)
      .populate('creator', 'username profilePicture')
      .populate('collaborators.user', 'username profilePicture')
      .populate('group', 'name')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Assignment.countDocuments(query);

    res.json({
      success: true,
      data: assignments,
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
      message: 'Error fetching assignments',
      error: error.message
    });
  }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('creator', 'username profilePicture')
      .populate('collaborators.user', 'username profilePicture')
      .populate('group', 'name')
      .populate('tasks.assignedTo', 'username profilePicture')
      .populate('discussions.user', 'username profilePicture')
      .populate('files.uploadedBy', 'username profilePicture')
      .populate('activityLog.user', 'username profilePicture');

    if (!assignment || assignment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check access
    const isCollaborator = assignment.collaborators.some(
      c => c.user._id.toString() === req.user._id.toString()
    );

    if (!isCollaborator && assignment.visibility === 'private') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (assignment.visibility === 'group' && assignment.group) {
      const group = await Group.findById(assignment.group);
      if (!group.isMember(req.user._id) && !isCollaborator) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment',
      error: error.message
    });
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private (Owner/Editor)
exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const userRole = assignment.collaborators.find(
      c => c.user.toString() === req.user._id.toString()
    )?.role;

    if (!userRole || userRole === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'Only owners and editors can update this assignment'
      });
    }

    const allowedUpdates = ['title', 'description', 'dueDate', 'status', 'visibility'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Add activity log
    if (Object.keys(updates).length > 0) {
      assignment.activityLog.push({
        user: req.user._id,
        action: 'updated',
        details: `Updated ${Object.keys(updates).join(', ')}`
      });
    }

    Object.assign(assignment, updates);
    await assignment.save();

    await assignment.populate('creator', 'username profilePicture');
    await assignment.populate('collaborators.user', 'username profilePicture');

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating assignment',
      error: error.message
    });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Owner only)
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can delete this assignment'
      });
    }

    assignment.isDeleted = true;
    await assignment.save();

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting assignment',
      error: error.message
    });
  }
};

// @desc    Add task to assignment
// @route   POST /api/assignments/:id/tasks
// @access  Private (Owner/Editor)
exports.addTask = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const userRole = assignment.collaborators.find(
      c => c.user.toString() === req.user._id.toString()
    )?.role;

    if (!userRole || userRole === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'Only owners and editors can add tasks'
      });
    }

    const { title, description, assignedTo, dueDate } = req.body;

    assignment.tasks.push({
      title,
      description,
      assignedTo: assignedTo || [],
      dueDate,
      status: 'todo'
    });

    assignment.activityLog.push({
      user: req.user._id,
      action: 'task_added',
      details: `Added task: ${title}`
    });

    await assignment.save();
    await assignment.populate('tasks.assignedTo', 'username profilePicture');

    // Notify assigned users
    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        if (userId.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: userId,
            sender: req.user._id,
            type: 'task_assigned',
            content: `${req.user.username} assigned you a task: "${title}"`,
            relatedAssignment: assignment._id
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: assignment.tasks[assignment.tasks.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding task',
      error: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/assignments/:id/tasks/:taskId
// @access  Private (Owner/Editor/Assigned)
exports.updateTask = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const task = assignment.tasks.id(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const userRole = assignment.collaborators.find(
      c => c.user.toString() === req.user._id.toString()
    )?.role;

    const isAssigned = task.assignedTo.some(
      u => u.toString() === req.user._id.toString()
    );

    if (!userRole && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { title, description, status, assignedTo, dueDate } = req.body;
    const oldStatus = task.status;

    if (title) task.title = title;
    if (description) task.description = description;
    if (status) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
      }
    }
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = dueDate;

    if (status && status !== oldStatus) {
      assignment.activityLog.push({
        user: req.user._id,
        action: status === 'completed' ? 'task_completed' : 'updated',
        details: `Changed task "${task.title}" status to ${status}`
      });
    }

    await assignment.save();

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

// @desc    Add collaborator
// @route   POST /api/assignments/:id/collaborators
// @access  Private (Owner only)
exports.addCollaborator = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const userRole = assignment.collaborators.find(
      c => c.user.toString() === req.user._id.toString()
    )?.role;

    if (userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owners can add collaborators'
      });
    }

    const { userId, role = 'editor' } = req.body;

    const alreadyCollaborator = assignment.collaborators.some(
      c => c.user.toString() === userId
    );

    if (alreadyCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'User is already a collaborator'
      });
    }

    assignment.collaborators.push({ user: userId, role });
    assignment.activityLog.push({
      user: req.user._id,
      action: 'collaborator_added',
      details: `Added a new collaborator`
    });

    await assignment.save();

    // Notify new collaborator
    await Notification.create({
      recipient: userId,
      sender: req.user._id,
      type: 'assignment_invite',
      content: `${req.user.username} added you to the assignment "${assignment.title}"`,
      relatedAssignment: assignment._id
    });

    await assignment.populate('collaborators.user', 'username profilePicture');

    res.json({
      success: true,
      data: assignment.collaborators
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding collaborator',
      error: error.message
    });
  }
};

// @desc    Remove collaborator
// @route   DELETE /api/assignments/:id/collaborators/:userId
// @access  Private (Owner only)
exports.removeCollaborator = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const userRole = assignment.collaborators.find(
      c => c.user.toString() === req.user._id.toString()
    )?.role;

    if (userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owners can remove collaborators'
      });
    }

    if (req.params.userId === assignment.creator.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the creator'
      });
    }

    assignment.collaborators = assignment.collaborators.filter(
      c => c.user.toString() !== req.params.userId
    );

    await assignment.save();

    res.json({
      success: true,
      message: 'Collaborator removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing collaborator',
      error: error.message
    });
  }
};

// @desc    Add discussion comment
// @route   POST /api/assignments/:id/discussions
// @access  Private (Collaborators)
exports.addDiscussion = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const isCollaborator = assignment.collaborators.some(
      c => c.user.toString() === req.user._id.toString()
    );

    if (!isCollaborator) {
      return res.status(403).json({
        success: false,
        message: 'Only collaborators can add comments'
      });
    }

    const { content, attachments } = req.body;

    assignment.discussions.push({
      user: req.user._id,
      content,
      attachments
    });

    assignment.activityLog.push({
      user: req.user._id,
      action: 'comment_added',
      details: 'Added a comment'
    });

    await assignment.save();
    await assignment.populate('discussions.user', 'username profilePicture');

    // Notify other collaborators
    for (const collab of assignment.collaborators) {
      if (collab.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: collab.user,
          sender: req.user._id,
          type: 'assignment_comment',
          content: `${req.user.username} commented on "${assignment.title}"`,
          relatedAssignment: assignment._id
        });
      }
    }

    res.status(201).json({
      success: true,
      data: assignment.discussions[assignment.discussions.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// @desc    Upload file to assignment
// @route   POST /api/assignments/:id/files
// @access  Private (Owner/Editor)
exports.uploadFile = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const userRole = assignment.collaborators.find(
      c => c.user.toString() === req.user._id.toString()
    )?.role;

    if (!userRole || userRole === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'Only owners and editors can upload files'
      });
    }

    const { url, filename } = req.body;

    assignment.files.push({
      url,
      filename,
      uploadedBy: req.user._id
    });

    assignment.activityLog.push({
      user: req.user._id,
      action: 'file_uploaded',
      details: `Uploaded file: ${filename}`
    });

    await assignment.save();

    res.status(201).json({
      success: true,
      data: assignment.files[assignment.files.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

// @desc    Get assignments by course
// @route   GET /api/assignments/course/:courseId
// @access  Private
exports.getAssignmentsByCourse = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const assignments = await Assignment.find({
      moodleCourseId: parseInt(req.params.courseId),
      isDeleted: false,
      $or: [
        { 'collaborators.user': req.user._id },
        { visibility: 'public' },
        { 
          visibility: 'group',
          group: { $in: await getUserGroupIds(req.user._id) }
        }
      ]
    })
      .populate('creator', 'username profilePicture')
      .populate('collaborators.user', 'username profilePicture')
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Assignment.countDocuments({
      moodleCourseId: parseInt(req.params.courseId),
      isDeleted: false
    });

    res.json({
      success: true,
      data: assignments,
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
      message: 'Error fetching assignments',
      error: error.message
    });
  }
};

// Helper function
async function getUserGroupIds(userId) {
  const groups = await Group.find({
    'members.user': userId,
    isDeleted: false
  }).select('_id');
  return groups.map(g => g._id);
}
