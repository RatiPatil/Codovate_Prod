/**
 * ═══════════════════════════════════════════════════════════════
 *  CODOVATE RBAC — AUDIT LOGGING MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Automatically logs actions to the `auditLogs` Firestore collection.
 * Runs as a "fire and forget" — never blocks the response.
 * 
 * Usage:
 *   router.post('/users', auditLog('CREATE', 'user'), handler);
 *   router.delete('/users/:id', auditLog('DELETE', 'user', 'id'), handler);
 *   router.put('/settings', auditLog('UPDATE', 'settings'), handler);
 */

const { db } = require('../config/firebase');

// ─── Supported Actions ──────────────────────────────────────
const AUDIT_ACTIONS = Object.freeze({
  LOGIN:             'LOGIN',
  LOGOUT:            'LOGOUT',
  CREATE:            'CREATE',
  READ:              'READ',
  UPDATE:            'UPDATE',
  DELETE:            'DELETE',
  APPROVE:           'APPROVE',
  REJECT:            'REJECT',
  ASSIGN:            'ASSIGN',
  EXPORT:            'EXPORT',
  SETTINGS_CHANGE:   'SETTINGS_CHANGE',
  ROLE_CHANGE:        'ROLE_CHANGE',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
  PUBLISH:           'PUBLISH',
  SUSPEND:           'SUSPEND',
  ACTIVATE:          'ACTIVATE',
});

/**
 * auditLog() — Middleware factory
 * 
 * @param {string} action - The action type (from AUDIT_ACTIONS)
 * @param {string} resource - The resource type (e.g., 'user', 'opportunity')
 * @param {string} [resourceIdParam] - Route param name for the resource ID (e.g., 'id')
 * @returns {Function} Express middleware
 */
function auditLog(action, resource, resourceIdParam = null) {
  return (req, res, next) => {
    // Capture the original res.json to log after response
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Log the audit entry (fire and forget)
      const logEntry = {
        userId: req.user?.uid || 'anonymous',
        userEmail: req.user?.email || 'unknown',
        role: req.user?.role || 'unknown',
        orgId: req.user?.orgId || req.dbUser?.orgId || null,
        deptId: req.user?.deptId || req.dbUser?.deptId || null,
        action: action,
        resource: resource,
        resourceId: resourceIdParam ? (req.params[resourceIdParam] || null) : null,
        details: {
          method: req.method,
          path: req.originalUrl,
          body: sanitizeBody(req.body),
          query: req.query,
        },
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        status: res.statusCode >= 400 ? 'failure' : 'success',
        statusCode: res.statusCode,
        timestamp: new Date(),
      };

      db.collection('auditLogs').add(logEntry)
        .catch(err => console.error('[AUDIT] Failed to write audit log:', err.message));

      return originalJson(data);
    };

    next();
  };
}

/**
 * logAuditDirect() — Direct audit logging (not middleware)
 * Use this for logging events outside of route handlers (e.g., login, cron jobs).
 * 
 * @param {object} entry - Audit log entry
 */
async function logAuditDirect(entry) {
  try {
    await db.collection('auditLogs').add({
      userId: entry.userId || 'system',
      userEmail: entry.userEmail || 'system',
      role: entry.role || 'system',
      orgId: entry.orgId || null,
      deptId: entry.deptId || null,
      action: entry.action,
      resource: entry.resource || null,
      resourceId: entry.resourceId || null,
      details: entry.details || {},
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      status: entry.status || 'success',
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[AUDIT] Direct log failed:', err.message);
  }
}

/**
 * logLoginHistory() — Logs login attempts
 * 
 * @param {object} entry - Login history entry
 */
async function logLoginHistory(entry) {
  try {
    await db.collection('loginHistory').add({
      userId: entry.userId || null,
      email: entry.email || null,
      phone: entry.phone || null,
      provider: entry.provider || 'unknown',
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      status: entry.status || 'success', // "success", "failed", "blocked"
      failureReason: entry.failureReason || null,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[AUDIT] Login history log failed:', err.message);
  }
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Strips sensitive fields from request body before logging
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return {};
  const sanitized = { ...body };
  const SENSITIVE_FIELDS = ['password', 'password_hash', 'idToken', 'token', 'refreshToken', 'secret', 'apiKey'];
  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field]) sanitized[field] = '[REDACTED]';
  }
  // Limit body size in logs
  const str = JSON.stringify(sanitized);
  if (str.length > 2000) {
    return { _truncated: true, keys: Object.keys(sanitized) };
  }
  return sanitized;
}

/**
 * Extracts client IP from request (handles proxies)
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress 
    || req.socket?.remoteAddress 
    || null;
}

module.exports = auditLog;
module.exports.AUDIT_ACTIONS = AUDIT_ACTIONS;
module.exports.logAuditDirect = logAuditDirect;
module.exports.logLoginHistory = logLoginHistory;
module.exports.getClientIP = getClientIP;
