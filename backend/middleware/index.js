/**
 * ═══════════════════════════════════════════════════════════════
 *  CODOVATE RBAC — MIDDLEWARE BARREL EXPORT
 * ═══════════════════════════════════════════════════════════════
 * 
 * Clean import for all RBAC middleware:
 *   const { authenticate, authorize, requireRole, checkOwnership, auditLog } = require('./middleware');
 */

const authenticate = require('./authenticate');
const authorize = require('./authorize');
const requireRole = require('./requireRole');
const checkOwnership = require('./checkOwnership');
const auditLog = require('./auditLog');
const sessionValidation = require('./sessionValidation');
const { organizationScope, departmentScope } = require('./scopes');

module.exports = {
  authenticate,
  authorize,
  requireRole,
  checkOwnership,
  auditLog,
  sessionValidation,
  organizationScope,
  departmentScope,
  // Re-export utilities
  clearPermissionCache: authenticate.clearPermissionCache,
  logAuditDirect: auditLog.logAuditDirect,
  logLoginHistory: auditLog.logLoginHistory,
  AUDIT_ACTIONS: auditLog.AUDIT_ACTIONS,
};
