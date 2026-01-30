const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserEnrollments
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

// User enrollments (accessible by admin or the user themselves)
router.get('/:id/enrollments', getUserEnrollments);

module.exports = router;
