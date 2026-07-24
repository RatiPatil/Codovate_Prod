/**
 * ═══════════════════════════════════════════════════════════════
 *  CODOVATE RBAC — ROLE-BASED ROUTE GUARD MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Simple role-gating for routes that need blanket role access.
 * Must be used AFTER authenticate() middleware.
 * 
 * Usage:
 *   router.use('/admin', requireRole(['super_admin', 'admin']));
 *   router.get('/mentor/stats', requireRole('mentor'), handler);
 */

const { ROLE_PRIORITIES } = require('../config/roleDefinitions');

/**
 * requireRole() — Middleware factory
 * 
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }

    const userRole = req.user.role;

    // Super admins always pass role checks
    if (userRole === 'super_admin' || userRole === 'admin') {
      return next();
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: 'Access denied. Your role does not have access to this resource.',
        code: 'ROLE_FORBIDDEN',
        yourRole: userRole,
        requiredRoles: roles,
      });
    }

    next();
  };
}

/**
 * requireMinPriority() — Middleware factory
 * 
 * Ensures the user's role has at least the given priority level.
 * Lower number = higher authority (super_admin = 1).
 * 
 * @param {number} maxPriority - Maximum allowed priority number (inclusive)
 * @returns {Function} Express middleware
 */
function requireMinPriority(maxPriority) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }

    const userPriority = ROLE_PRIORITIES[req.user.role];
    if (userPriority === undefined || userPriority > maxPriority) {
      return res.status(403).json({
        message: 'Access denied. Insufficient role authority.',
        code: 'ROLE_PRIORITY_INSUFFICIENT',
      });
    }

    next();
  };
}

module.exports = requireRole;
module.exports.requireMinPriority = requireMinPriority;
