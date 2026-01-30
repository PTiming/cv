const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { checkPermission, requireRole, PERMISSIONS } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const adminController = require('../controllers/adminController');

// All admin routes require authentication
router.use(auth);

// @route   GET /api/admin/stats
router.get('/stats', 
  checkPermission(PERMISSIONS.VIEW_ANALYTICS),
  adminController.getStats
);

// @route   GET /api/admin/users
router.get('/users', 
  checkPermission(PERMISSIONS.VIEW_USERS),
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  adminController.getAllUsers
);

// @route   GET /api/admin/users/:id
router.get('/users/:id',
  checkPermission(PERMISSIONS.VIEW_USERS),
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  adminController.getUserById
);

// @route   PUT /api/admin/users/:id/role
router.put('/users/:id/role',
  checkPermission(PERMISSIONS.CHANGE_USER_ROLE),
  requireRole(ROLES.ADMIN),
  [
    body('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn(Object.values(ROLES))
      .withMessage('Invalid role'),
    validate
  ],
  adminController.updateUserRole
);

// @route   PUT /api/admin/users/:id/ban
router.put('/users/:id/ban',
  checkPermission(PERMISSIONS.BAN_USER),
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  [
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 }),
    validate
  ],
  adminController.banUser
);

// @route   PUT /api/admin/users/:id/unban
router.put('/users/:id/unban',
  checkPermission(PERMISSIONS.UNBAN_USER),
  requireRole(ROLES.ADMIN, ROLES.MODERATOR),
  adminController.unbanUser
);

// @route   DELETE /api/admin/users/:id
router.delete('/users/:id',
  checkPermission(PERMISSIONS.DELETE_USER),
  requireRole(ROLES.ADMIN),
  adminController.deleteUser
);

module.exports = router;
