/**
 * ═══════════════════════════════════════════════════════════════
 *  CODOVATE RBAC — PERMISSION-BASED AUTHORIZATION MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Checks if the authenticated user has the required permission(s).
 * Must be used AFTER authenticate() middleware.
 * 
 * Usage:
 *   router.get('/stats', authorize('dashboard:read'), handler);
 *   router.post('/users', authorize('users:create'), handler);
 *   router.put('/config', authorize(['settings:update', 'system:manage']), handler);
 */

const { WILDCARD } = require('../config/permissions');

/**
 * authorize() — Middleware factory
 * 
 * @param {string|string[]} requiredPermissions - Single permission or array (AND logic)
 * @param {object} options
 * @param {boolean} options.any - If true, uses OR logic instead of AND
 * @returns {Function} Express middleware
 */
function authorize(requiredPermissions, options = {}) {
  const { any = false } = options;
  
  // Normalize to array
  const required = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];

  return (req, res, next) => {
    // Must be authenticated first
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED' 
      });
    }

    const userPermissions = req.user.permissions || [];

    // Wildcard = super admin bypass
    if (userPermissions.includes(WILDCARD)) {
      return next();
    }

    // Check permissions
    let hasAccess;
    if (any) {
      // OR logic: user needs at least ONE of the required permissions
      hasAccess = required.some(perm => userPermissions.includes(perm));
    } else {
      // AND logic: user needs ALL of the required permissions
      hasAccess = required.every(perm => userPermissions.includes(perm));
    }

    if (!hasAccess) {
      return res.status(403).json({
        message: 'Insufficient permissions.',
        code: 'AUTH_FORBIDDEN',
        required: required,
        hint: `You need ${any ? 'one of' : 'all of'}: ${required.join(', ')}`,
      });
    }

    next();
  };
}

module.exports = authorize;
