const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const searchController = require('../controllers/searchController');

// @route   GET /api/search
router.get('/', auth, searchController.search);

// @route   GET /api/search/trending
router.get('/trending', auth, searchController.getTrending);

// @route   GET /api/search/suggestions
router.get('/suggestions', auth, searchController.getSuggestions);

// @route   GET /api/search/hashtag/:tag
router.get('/hashtag/:tag', auth, searchController.searchByHashtag);

// @route   GET /api/search/recent
router.get('/recent', auth, searchController.getRecentSearches);

// @route   POST /api/search/recent
router.post('/recent', auth, [
  body('query').notEmpty().withMessage('Search query is required'),
  body('type')
    .optional()
    .isIn(['all', 'posts', 'users', 'groups', 'resources']),
  validate
], searchController.saveRecentSearch);

// @route   DELETE /api/search/recent
router.delete('/recent', auth, searchController.clearRecentSearches);

module.exports = router;
