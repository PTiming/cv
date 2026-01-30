const Resource = require('../models/Resource');
const Group = require('../models/Group');
const Notification = require('../models/Notification');

// @desc    Create a new resource
// @route   POST /api/resources
// @access  Private
exports.createResource = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      file,
      externalUrl,
      content,
      group,
      moodleCourseId,
      courseName,
      moodleResource,
      subject,
      tags,
      visibility
    } = req.body;

    // If resource belongs to a group, check membership
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
          message: 'Only group members can add resources'
        });
      }
    }

    const resource = await Resource.create({
      title,
      description,
      type: type || 'document',
      file,
      externalUrl,
      content,
      author: req.user._id,
      group,
      moodleCourseId,
      courseName,
      moodleResource,
      subject,
      tags,
      visibility: visibility || (group ? 'group' : 'public')
    });

    await resource.populate('author', 'username profilePicture');

    // Update group resource count if applicable
    if (group) {
      await Group.findByIdAndUpdate(group, { $inc: { resourceCount: 1 } });
    }

    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating resource',
      error: error.message
    });
  }
};

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
exports.getResources = async (req, res) => {
  try {
    const { type, subject, search, courseId, groupId, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: false };

    if (type) query.type = type;
    if (subject) query.subject = subject;
    if (courseId) query.moodleCourseId = parseInt(courseId);
    if (groupId) query.group = groupId;
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by visibility
    query.$or = [
      { visibility: 'public' },
      { author: req.user._id },
      { 
        visibility: 'group',
        group: { $in: await getUserGroupIds(req.user._id) }
      }
    ];

    const resources = await Resource.find(query)
      .populate('author', 'username profilePicture')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments(query);

    res.json({
      success: true,
      data: resources,
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
      message: 'Error fetching resources',
      error: error.message
    });
  }
};

// Helper function to get user's group IDs
async function getUserGroupIds(userId) {
  const groups = await Group.find({
    'members.user': userId,
    isDeleted: false
  }).select('_id');
  return groups.map(g => g._id);
}

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
exports.getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('author', 'username profilePicture')
      .populate('group', 'name')
      .populate('comments.user', 'username profilePicture');

    if (!resource || resource.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check access
    if (resource.visibility === 'private' && resource.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (resource.visibility === 'group' && resource.group) {
      const group = await Group.findById(resource.group);
      if (!group.isMember(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Increment view count
    resource.views += 1;
    await resource.save();

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching resource',
      error: error.message
    });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Author only)
exports.updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource || resource.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (resource.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the author can update this resource'
      });
    }

    const allowedUpdates = ['title', 'description', 'type', 'file', 'externalUrl', 'content', 'subject', 'tags', 'visibility'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'username profilePicture');

    res.json({
      success: true,
      data: updatedResource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating resource',
      error: error.message
    });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Author only)
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource || resource.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (resource.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the author can delete this resource'
      });
    }

    resource.isDeleted = true;
    await resource.save();

    // Update group resource count if applicable
    if (resource.group) {
      await Group.findByIdAndUpdate(resource.group, { $inc: { resourceCount: -1 } });
    }

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting resource',
      error: error.message
    });
  }
};

// @desc    Like resource
// @route   POST /api/resources/:id/like
// @access  Private
exports.likeResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource || resource.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (resource.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Already liked this resource'
      });
    }

    resource.likes.push(req.user._id);
    await resource.save();

    // Notify author
    if (resource.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: resource.author,
        sender: req.user._id,
        type: 'resource_like',
        content: `${req.user.username} liked your resource "${resource.title}"`,
        relatedResource: resource._id
      });
    }

    res.json({
      success: true,
      data: { likeCount: resource.likes.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error liking resource',
      error: error.message
    });
  }
};

// @desc    Unlike resource
// @route   DELETE /api/resources/:id/like
// @access  Private
exports.unlikeResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource || resource.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (!resource.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Not liked this resource'
      });
    }

    resource.likes = resource.likes.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await resource.save();

    res.json({
      success: true,
      data: { likeCount: resource.likes.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unliking resource',
      error: error.message
    });
  }
};

// @desc    Save resource
// @route   POST /api/resources/:id/save
// @access  Private
exports.saveResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource || resource.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (resource.savedBy.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Already saved this resource'
      });
    }

    resource.savedBy.push(req.user._id);
    await resource.save();

    res.json({
      success: true,
      message: 'Resource saved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving resource',
      error: error.message
    });
  }
};

// @desc    Unsave resource
// @route   DELETE /api/resources/:id/save
// @access  Private
exports.unsaveResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource || resource.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    resource.savedBy = resource.savedBy.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await resource.save();

    res.json({
      success: true,
      message: 'Resource unsaved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unsaving resource',
      error: error.message
    });
  }
};

// @desc    Add comment to resource
// @route   POST /api/resources/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource || resource.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    const { content } = req.body;

    resource.comments.push({
      user: req.user._id,
      content
    });
    await resource.save();

    await resource.populate('comments.user', 'username profilePicture');

    // Notify author
    if (resource.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: resource.author,
        sender: req.user._id,
        type: 'resource_comment',
        content: `${req.user.username} commented on your resource "${resource.title}"`,
        relatedResource: resource._id
      });
    }

    res.status(201).json({
      success: true,
      data: resource.comments[resource.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// @desc    Download resource (increment counter)
// @route   POST /api/resources/:id/download
// @access  Private
exports.downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource || resource.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    resource.downloads += 1;
    await resource.save();

    res.json({
      success: true,
      data: {
        file: resource.file,
        downloads: resource.downloads
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downloading resource',
      error: error.message
    });
  }
};

// @desc    Get my resources
// @route   GET /api/resources/my-resources
// @access  Private
exports.getMyResources = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const resources = await Resource.find({
      author: req.user._id,
      isDeleted: false
    })
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments({
      author: req.user._id,
      isDeleted: false
    });

    res.json({
      success: true,
      data: resources,
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
      message: 'Error fetching resources',
      error: error.message
    });
  }
};

// @desc    Get saved resources
// @route   GET /api/resources/saved
// @access  Private
exports.getSavedResources = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const resources = await Resource.find({
      savedBy: req.user._id,
      isDeleted: false
    })
      .populate('author', 'username profilePicture')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments({
      savedBy: req.user._id,
      isDeleted: false
    });

    res.json({
      success: true,
      data: resources,
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
      message: 'Error fetching saved resources',
      error: error.message
    });
  }
};

// @desc    Get resources by course
// @route   GET /api/resources/course/:courseId
// @access  Private
exports.getResourcesByCourse = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const resources = await Resource.find({
      moodleCourseId: parseInt(req.params.courseId),
      isDeleted: false,
      $or: [
        { visibility: 'public' },
        { author: req.user._id },
        { 
          visibility: 'group',
          group: { $in: await getUserGroupIds(req.user._id) }
        }
      ]
    })
      .populate('author', 'username profilePicture')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments({
      moodleCourseId: parseInt(req.params.courseId),
      isDeleted: false
    });

    res.json({
      success: true,
      data: resources,
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
      message: 'Error fetching resources',
      error: error.message
    });
  }
};
