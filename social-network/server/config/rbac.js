/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * Defines roles, permissions, and resource access rules
 */

// Available roles in the system
const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student'
};

// Permission definitions
const PERMISSIONS = {
  // User permissions
  CREATE_POST: 'create_post',
  EDIT_OWN_POST: 'edit_own_post',
  DELETE_OWN_POST: 'delete_own_post',
  EDIT_ANY_POST: 'edit_any_post',
  DELETE_ANY_POST: 'delete_any_post',
  
  // Comment permissions
  CREATE_COMMENT: 'create_comment',
  EDIT_OWN_COMMENT: 'edit_own_comment',
  DELETE_OWN_COMMENT: 'delete_own_comment',
  DELETE_ANY_COMMENT: 'delete_any_comment',
  
  // User management
  VIEW_USERS: 'view_users',
  EDIT_OWN_PROFILE: 'edit_own_profile',
  EDIT_ANY_PROFILE: 'edit_any_profile',
  BAN_USER: 'ban_user',
  UNBAN_USER: 'unban_user',
  CHANGE_USER_ROLE: 'change_user_role',
  DELETE_USER: 'delete_user',
  
  // Moderation
  FLAG_CONTENT: 'flag_content',
  REVIEW_FLAGS: 'review_flags',
  WARN_USER: 'warn_user',
  
  // Course/Moodle permissions
  VIEW_COURSES: 'view_courses',
  CREATE_COURSE_POST: 'create_course_post',
  MANAGE_COURSE: 'manage_course',
  VIEW_ALL_GRADES: 'view_all_grades',
  
  // System permissions
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_AUDIT_LOG: 'view_audit_log'
};

// Role-Permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    PERMISSIONS.CREATE_POST,
    PERMISSIONS.EDIT_OWN_POST,
    PERMISSIONS.DELETE_OWN_POST,
    PERMISSIONS.CREATE_COMMENT,
    PERMISSIONS.EDIT_OWN_COMMENT,
    PERMISSIONS.DELETE_OWN_COMMENT,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.FLAG_CONTENT,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSE_POST
  ],
  
  [ROLES.STUDENT]: [
    PERMISSIONS.CREATE_POST,
    PERMISSIONS.EDIT_OWN_POST,
    PERMISSIONS.DELETE_OWN_POST,
    PERMISSIONS.CREATE_COMMENT,
    PERMISSIONS.EDIT_OWN_COMMENT,
    PERMISSIONS.DELETE_OWN_COMMENT,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.FLAG_CONTENT,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSE_POST
  ],
  
  [ROLES.INSTRUCTOR]: [
    PERMISSIONS.CREATE_POST,
    PERMISSIONS.EDIT_OWN_POST,
    PERMISSIONS.DELETE_OWN_POST,
    PERMISSIONS.CREATE_COMMENT,
    PERMISSIONS.EDIT_OWN_COMMENT,
    PERMISSIONS.DELETE_OWN_COMMENT,
    PERMISSIONS.DELETE_ANY_COMMENT, // Can moderate comments in their courses
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.FLAG_CONTENT,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSE_POST,
    PERMISSIONS.MANAGE_COURSE,
    PERMISSIONS.VIEW_ALL_GRADES,
    PERMISSIONS.WARN_USER
  ],
  
  [ROLES.MODERATOR]: [
    PERMISSIONS.CREATE_POST,
    PERMISSIONS.EDIT_OWN_POST,
    PERMISSIONS.DELETE_OWN_POST,
    PERMISSIONS.DELETE_ANY_POST,
    PERMISSIONS.CREATE_COMMENT,
    PERMISSIONS.EDIT_OWN_COMMENT,
    PERMISSIONS.DELETE_OWN_COMMENT,
    PERMISSIONS.DELETE_ANY_COMMENT,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.BAN_USER,
    PERMISSIONS.UNBAN_USER,
    PERMISSIONS.FLAG_CONTENT,
    PERMISSIONS.REVIEW_FLAGS,
    PERMISSIONS.WARN_USER,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSE_POST,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  
  [ROLES.ADMIN]: [
    // Admins have all permissions
    ...Object.values(PERMISSIONS)
  ]
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User's role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
const hasPermission = (role, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};

/**
 * Get all permissions for a role
 * @param {string} role - User's role
 * @returns {string[]}
 */
const getPermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if role1 can manage role2 (role hierarchy)
 * @param {string} role1 - Acting user's role
 * @param {string} role2 - Target user's role
 * @returns {boolean}
 */
const canManageRole = (role1, role2) => {
  const hierarchy = {
    [ROLES.ADMIN]: 4,
    [ROLES.MODERATOR]: 3,
    [ROLES.INSTRUCTOR]: 2,
    [ROLES.USER]: 1,
    [ROLES.STUDENT]: 1
  };
  
  return (hierarchy[role1] || 0) > (hierarchy[role2] || 0);
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getPermissions,
  canManageRole
};
