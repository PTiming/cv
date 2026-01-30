const Post = require('../models/Post');
const User = require('../models/User');
const Group = require('../models/Group');
const Resource = require('../models/Resource');

// @desc    Enhanced search across posts, users, groups, resources
// @route   GET /api/search
// @access  Private
exports.search = async (req, res) => {
  try {
    const { q, type, page = 1, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const results = {};
    const skip = (page - 1) * limit;

    // Search based on type or search all
    if (!type || type === 'all' || type === 'posts') {
      const postQuery = {
        isDeleted: false,
        $or: [
          { content: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ],
        $and: [
          {
            $or: [
              { visibility: 'public' },
              { author: req.user._id },
              { visibility: 'followers', author: { $in: req.user.following } }
            ]
          }
        ]
      };

      // Check if search is for hashtag
      if (q.startsWith('#')) {
        postQuery.$or = [{ tags: q.substring(1).toLowerCase() }];
      }

      const posts = await Post.find(postQuery)
        .populate('author', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const postCount = await Post.countDocuments(postQuery);

      results.posts = {
        data: posts,
        total: postCount
      };
    }

    if (!type || type === 'all' || type === 'users') {
      const userQuery = {
        _id: { $ne: req.user._id },
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } }
        ]
      };

      const users = await User.find(userQuery)
        .select('username profilePicture firstName lastName bio followers')
        .sort({ followers: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const userCount = await User.countDocuments(userQuery);

      results.users = {
        data: users.map(u => ({
          ...u.toObject(),
          followerCount: u.followers.length,
          isFollowing: u.followers.includes(req.user._id)
        })),
        total: userCount
      };
    }

    if (!type || type === 'all' || type === 'groups') {
      const groupQuery = {
        isDeleted: false,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { topics: { $regex: q, $options: 'i' } }
        ],
        $and: [
          {
            $or: [
              { privacy: 'public' },
              { 'members.user': req.user._id }
            ]
          }
        ]
      };

      const groups = await Group.find(groupQuery)
        .populate('creator', 'username profilePicture')
        .sort({ memberCount: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const groupCount = await Group.countDocuments(groupQuery);

      results.groups = {
        data: groups.map(g => ({
          ...g.toObject(),
          isMember: g.members.some(m => m.user.toString() === req.user._id.toString())
        })),
        total: groupCount
      };
    }

    if (!type || type === 'all' || type === 'resources') {
      const resourceQuery = {
        isDeleted: false,
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ],
        $and: [
          {
            $or: [
              { visibility: 'public' },
              { author: req.user._id }
            ]
          }
        ]
      };

      const resources = await Resource.find(resourceQuery)
        .populate('author', 'username profilePicture')
        .populate('group', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const resourceCount = await Resource.countDocuments(resourceQuery);

      results.resources = {
        data: resources,
        total: resourceCount
      };
    }

    // Get hashtag suggestions if search starts with #
    if (q.startsWith('#')) {
      const hashtag = q.substring(1).toLowerCase();
      const hashtagAgg = await Post.aggregate([
        { $match: { isDeleted: false, tags: { $regex: hashtag, $options: 'i' } } },
        { $unwind: '$tags' },
        { $match: { tags: { $regex: hashtag, $options: 'i' } } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      results.hashtags = hashtagAgg.map(h => ({
        tag: h._id,
        count: h.count
      }));
    }

    res.json({
      success: true,
      query: q,
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message
    });
  }
};

// @desc    Get trending hashtags
// @route   GET /api/search/trending
// @access  Private
exports.getTrending = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get hashtags from posts in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await Post.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: sevenDaysAgo },
          tags: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          posts: { $push: '$_id' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          tag: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trending hashtags',
      error: error.message
    });
  }
};

// @desc    Search posts by hashtag
// @route   GET /api/search/hashtag/:tag
// @access  Private
exports.searchByHashtag = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const tag = req.params.tag.toLowerCase();

    const posts = await Post.find({
      isDeleted: false,
      tags: tag,
      $or: [
        { visibility: 'public' },
        { author: req.user._id },
        { visibility: 'followers', author: { $in: req.user.following } }
      ]
    })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({
      isDeleted: false,
      tags: tag
    });

    res.json({
      success: true,
      tag,
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
      message: 'Error searching by hashtag',
      error: error.message
    });
  }
};

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Private
exports.getSuggestions = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: {
          users: [],
          groups: [],
          hashtags: []
        }
      });
    }

    // Get user suggestions
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ]
    })
      .select('username profilePicture firstName lastName')
      .limit(parseInt(limit));

    // Get group suggestions
    const groups = await Group.find({
      isDeleted: false,
      name: { $regex: q, $options: 'i' },
      $or: [
        { privacy: 'public' },
        { 'members.user': req.user._id }
      ]
    })
      .select('name avatar type memberCount')
      .limit(parseInt(limit));

    // Get hashtag suggestions
    const hashtags = await Post.aggregate([
      {
        $match: {
          isDeleted: false,
          tags: { $regex: q, $options: 'i' }
        }
      },
      { $unwind: '$tags' },
      { $match: { tags: { $regex: q, $options: 'i' } } },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: {
        users,
        groups,
        hashtags: hashtags.map(h => ({ tag: h._id, count: h.count }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting suggestions',
      error: error.message
    });
  }
};

// @desc    Get recent searches (stored in user preferences)
// @route   GET /api/search/recent
// @access  Private
exports.getRecentSearches = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('recentSearches');

    res.json({
      success: true,
      data: user.recentSearches || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent searches',
      error: error.message
    });
  }
};

// @desc    Save search to recent
// @route   POST /api/search/recent
// @access  Private
exports.saveRecentSearch = async (req, res) => {
  try {
    const { query, type } = req.body;

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          recentSearches: {
            $each: [{ query, type, searchedAt: new Date() }],
            $slice: -10 // Keep only last 10 searches
          }
        }
      }
    );

    res.json({
      success: true,
      message: 'Search saved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving search',
      error: error.message
    });
  }
};

// @desc    Clear recent searches
// @route   DELETE /api/search/recent
// @access  Private
exports.clearRecentSearches = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { recentSearches: [] }
    );

    res.json({
      success: true,
      message: 'Recent searches cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing searches',
      error: error.message
    });
  }
};
