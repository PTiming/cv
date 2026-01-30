const { hasPermission, canManageRole, PERMISSIONS } = require('../config/rbac');

/**
 * Middleware to check if user has required permission
 * @param {string|string[]} requiredPermissions - Permission(s) required
 * @param {object} options - Additional options
 * @param {boolean} options.requireAll - If true, user must have ALL permissions (default: false)
 */
const checkPermission = (requiredPermissions, options = {}) => {
  const { requireAll = false } = options;
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    
    const hasRequiredPermissions = requireAll
      ? permissions.every(perm => hasPermission(userRole, perm))
      : permissions.some(perm => hasPermission(userRole, perm));

    if (!hasRequiredPermissions) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    // Attach permissions to request for use in controllers
    req.permissions = permissions;
    next();
  };
};

/**
 * Middleware to check if user can perform action on own resource only
 * unless they have elevated permissions
 * @param {string} elevatedPermission - Permission that allows action on any resource
 * @param {Function} getResourceOwnerId - Function to get resource owner ID from request
 */
const checkOwnershipOrPermission = (elevatedPermission, getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    
    // Check if user has elevated permission (can act on any resource)
    if (hasPermission(userRole, elevatedPermission)) {
      req.isElevated = true;
      return next();
    }

    // Otherwise, check ownership
    try {
      const resourceOwnerId = await getResourceOwnerId(req);
      
      if (!resourceOwnerId) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      if (resourceOwnerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action'
        });
      }

      req.isOwner = true;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

/**
 * Middleware to check if user can manage target user based on role hierarchy
 */
const checkRoleHierarchy = (getTargetUserRole) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      const targetRole = await getTargetUserRole(req);
      
      if (!canManageRole(req.user.role, targetRole)) {
        return res.status(403).json({
          success: false,
          message: 'You cannot perform this action on a user with equal or higher role'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking role hierarchy'
      });
    }
  };
};

/**
 * Middleware to ensure user has minimum role level
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Your role does not have access to this resource'
      });
    }

    next();
  };
};

module.exports = {
  checkPermission,
  checkOwnershipOrPermission,
  checkRoleHierarchy,
  requireRole,
  PERMISSIONS
};
