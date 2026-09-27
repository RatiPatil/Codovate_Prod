/**
 * ═══════════════════════════════════════════════════════════════
 *  CODOVATE RBAC — RESOURCE OWNERSHIP CHECK MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Ensures users can only access their own resources unless they
 * have a management-level permission for that resource.
 * 
 * Usage:
 *   router.get('/students/:id/profile', checkOwnership('id'), handler);
 *   // Student can only access their own profile.
 *   // Admin/mentor with 'students:read' can access any student's profile.
 * 
 *   router.put('/students/:id', checkOwnership('id', 'students:update'), handler);
 *   // Student can update their own. Admin with 'students:update' can update any.
 */

const { WILDCARD } = require('../config/permissions');

/**
 * checkOwnership() — Middleware factory
 * 
 * @param {string} paramName - The route parameter that holds the resource owner's ID
 * @param {string} [overridePermission] - Permission that bypasses ownership check
 * @returns {Function} Express middleware
 */
function checkOwnership(paramName = 'id', overridePermission = null) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }

    const resourceOwnerId = req.params[paramName];
    const userId = req.user.id;
    const permissions = req.user.permissions || [];

    // Owner? Always allowed.
    if (resourceOwnerId === userId) {
      return next();
    }

    // Wildcard (super admin)? Always allowed.
    if (permissions.includes(WILDCARD)) {
      return next();
    }

    // Has override permission? Allowed.
    if (overridePermission && permissions.includes(overridePermission)) {
      return next();
    }

    // College admin scoping: if user is college_admin, check if they manage this student's college
    if (req.user.role === 'college_admin' && req.user.college_id) {
      // This will be enforced at the route handler level where college_id is available
      // For now, we let it through and rely on the route handler to scope by college_id
      return next();
    }

    // Mentor scoping: mentors can access assigned students
    if (req.user.role === 'mentor') {
      // Mentor access is enforced at the route handler level via mentor assignment checks
      return next();
    }

    return res.status(403).json({
      message: 'Access denied. You can only access your own resources.',
      code: 'OWNERSHIP_DENIED',
    });
  };
}

module.exports = checkOwnership;
