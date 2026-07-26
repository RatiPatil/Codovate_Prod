/**
 * ═══════════════════════════════════════════════════════════════
 *  CODOVATE RBAC — MANAGEMENT API
 * ═══════════════════════════════════════════════════════════════
 * 
 * Admin-only endpoints for managing roles, permissions, audit logs,
 * login history, and feature flags.
 * 
 * All routes are prefixed with /api/rbac and protected by
 * authenticate + requireRole(['super_admin', 'admin']).
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { ALL_PERMISSIONS, CATEGORIES, ACTIONS } = require('../config/permissions');
const { ROLE_DEFINITIONS, ROLE_PRIORITIES } = require('../config/roleDefinitions');
const { clearPermissionCache } = require('../middleware/authenticate');
const { logAuditDirect, AUDIT_ACTIONS } = require('../middleware/auditLog');
const requireRole = require('../middleware/requireRole');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

// ─── PUBLIC (Authenticated) ROUTES ──────────────────────────

// ─── GET /users/me/permissions — Get current user's permissions ─
router.get('/users/me/permissions', async (req, res) => {
  try {
    const roleDoc = await db.collection('roles').doc(req.user.role).get();
    const permissions = roleDoc.exists ? (mapDoc(roleDoc).permissions || []) : [];
    
    res.json({
      role: req.user.role,
      permissions,
      isWildcard: permissions.includes('*'),
    });
  } catch (err) {
    console.error('[RBAC] Get user permissions error:', err);
    res.status(500).json({ message: 'Failed to fetch permissions.' });
  }
});

// ─── ADMIN-ONLY ROUTES ────────────────────────────────────────
router.use(requireRole(['super_admin', 'admin']));


// ─── GET /roles — List all roles ────────────────────────────
router.get('/roles', async (req, res) => {
  try {
    const snapshot = await db.collection('roles').orderBy('priority', 'asc').get();
    const roles = snapshot.docs.map(doc => ({ id: doc.id, ...mapDoc(doc) }));
    res.json({ roles });
  } catch (err) {
    console.error('[RBAC] List roles error:', err);
    res.status(500).json({ message: 'Failed to fetch roles.' });
  }
});

// ─── GET /roles/:roleId — Get role with permissions ─────────
router.get('/roles/:roleId', async (req, res) => {
  try {
    const doc = await db.collection('roles').doc(req.params.roleId).get();
    if (!doc.exists) return res.status(404).json({ message: 'Role not found.' });
    res.json({ role: { id: doc.id, ...mapDoc(doc) } });
  } catch (err) {
    console.error('[RBAC] Get role error:', err);
    res.status(500).json({ message: 'Failed to fetch role.' });
  }
});

// ─── PUT /roles/:roleId/permissions — Update role permissions ─
router.put('/roles/:roleId/permissions', async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'permissions must be an array.' });
    }

    // Validate permissions exist
    const invalid = permissions.filter(p => p !== '*' && !ALL_PERMISSIONS.includes(p));
    if (invalid.length > 0) {
      return res.status(400).json({ message: `Invalid permissions: ${invalid.join(', ')}` });
    }

    // Prevent escalation: non-super-admins cannot grant wildcard
    if (permissions.includes('*') && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super_admin can grant wildcard permissions.' });
    }

    const roleRef = db.collection('roles').doc(req.params.roleId);
    const roleDoc = await roleRef.get();
    if (!roleDoc.exists) return res.status(404).json({ message: 'Role not found.' });

    await roleRef.update({
      permissions,
      updatedAt: new Date(),
    });

    // Clear permission cache so changes take effect immediately
    clearPermissionCache(req.params.roleId);

    // Audit log
    logAuditDirect({
      userId: req.user.id,
      userEmail: req.user.email,
      role: req.user.role,
      action: AUDIT_ACTIONS.PERMISSION_CHANGE,
      resource: 'role',
      resourceId: req.params.roleId,
      details: { newPermissions: permissions },
    });

    res.json({ message: 'Permissions updated successfully.' });
  } catch (err) {
    console.error('[RBAC] Update permissions error:', err);
    res.status(500).json({ message: 'Failed to update permissions.' });
  }
});

// ─── GET /permissions — List all available permissions ───────
router.get('/permissions', (req, res) => {
  res.json({
    categories: CATEGORIES,
    actions: ACTIONS,
    allPermissions: ALL_PERMISSIONS,
    totalCount: ALL_PERMISSIONS.length,
  });
});



// ─── GET /users/:userId/permissions — Get specific user's permissions ─
router.get('/users/:userId/permissions', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.userId).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found.' });

    const userData = mapDoc(userDoc);
    const roleDoc = await db.collection('roles').doc(userData.role).get();
    const permissions = roleDoc.exists ? (mapDoc(roleDoc).permissions || []) : [];

    res.json({
      userId: req.params.userId,
      role: userData.role,
      permissions,
      isWildcard: permissions.includes('*'),
    });
  } catch (err) {
    console.error('[RBAC] Get user permissions error:', err);
    res.status(500).json({ message: 'Failed to fetch permissions.' });
  }
});

// ─── PUT /users/:userId/role — Change user's role ───────────
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { roleId } = req.body;
    if (!roleId) return res.status(400).json({ message: 'roleId is required.' });

    // Validate role exists
    const roleDoc = await db.collection('roles').doc(roleId).get();
    if (!roleDoc.exists) return res.status(400).json({ message: `Role "${roleId}" does not exist.` });

    // Privilege escalation check
    const targetPriority = ROLE_PRIORITIES[roleId];
    const callerPriority = ROLE_PRIORITIES[req.user.role];
    if (targetPriority !== undefined && callerPriority !== undefined && targetPriority < callerPriority) {
      return res.status(403).json({ 
        message: 'Cannot assign a role with higher authority than your own.',
        code: 'PRIVILEGE_ESCALATION_DENIED',
      });
    }

    const userRef = db.collection('users').doc(req.params.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found.' });

    const oldRole = mapDoc(userDoc).role;

    await userRef.update({
      role: roleId,
      updatedAt: new Date(),
    });

    // Audit log
    logAuditDirect({
      userId: req.user.id,
      userEmail: req.user.email,
      role: req.user.role,
      action: AUDIT_ACTIONS.ROLE_CHANGE,
      resource: 'user',
      resourceId: req.params.userId,
      details: { oldRole, newRole: roleId, targetEmail: mapDoc(userDoc).email },
    });

    res.json({ message: `User role changed from "${oldRole}" to "${roleId}".` });
  } catch (err) {
    console.error('[RBAC] Change role error:', err);
    res.status(500).json({ message: 'Failed to change role.' });
  }
});

// ─── GET /audit-logs — Query audit logs ─────────────────────
router.get('/audit-logs', async (req, res) => {
  try {
    const { action, resource, userId, limit: limitParam = 50, startAfter } = req.query;
    const limitNum = Math.min(parseInt(limitParam) || 50, 200);

    let query = db.collection('auditLogs').orderBy('timestamp', 'desc');
    if (action) query = query.where('action', '==', action);
    if (resource) query = query.where('resource', '==', resource);
    if (userId) query = query.where('userId', '==', userId);
    
    if (startAfter) {
      const startDoc = await db.collection('auditLogs').doc(startAfter).get();
      if (startDoc.exists) query = query.startAfter(startDoc);
    }

    const snapshot = await query.limit(limitNum).get();
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...mapDoc(doc) }));

    res.json({ 
      logs, 
      count: logs.length,
      hasMore: logs.length === limitNum,
      lastId: logs.length > 0 ? logs[logs.length - 1].id : null,
    });
  } catch (err) {
    console.error('[RBAC] Audit logs error:', err);
    res.status(500).json({ message: 'Failed to fetch audit logs.' });
  }
});

// ─── GET /login-history — Query login history ───────────────
router.get('/login-history', async (req, res) => {
  try {
    const { userId, status, limit: limitParam = 50 } = req.query;
    const limitNum = Math.min(parseInt(limitParam) || 50, 200);

    let query = db.collection('loginHistory').orderBy('timestamp', 'desc');
    if (userId) query = query.where('userId', '==', userId);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.limit(limitNum).get();
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...mapDoc(doc) }));

    res.json({ logs, count: logs.length });
  } catch (err) {
    console.error('[RBAC] Login history error:', err);
    res.status(500).json({ message: 'Failed to fetch login history.' });
  }
});

// ─── GET /feature-flags — List feature flags ────────────────
router.get('/feature-flags', async (req, res) => {
  try {
    const snapshot = await db.collection('featureFlags').get();
    const flags = snapshot.docs.map(doc => ({ id: doc.id, ...mapDoc(doc) }));
    res.json({ flags });
  } catch (err) {
    console.error('[RBAC] Feature flags error:', err);
    res.status(500).json({ message: 'Failed to fetch feature flags.' });
  }
});

// ─── PUT /feature-flags/:flagId — Toggle feature flag ───────
router.put('/feature-flags/:flagId', async (req, res) => {
  try {
    const { enabled, allowedRoles } = req.body;
    const updates = { updatedAt: new Date() };
    
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (Array.isArray(allowedRoles)) updates.allowedRoles = allowedRoles;

    const flagRef = db.collection('featureFlags').doc(req.params.flagId);
    const flagDoc = await flagRef.get();
    if (!flagDoc.exists) return res.status(404).json({ message: 'Feature flag not found.' });

    await flagRef.update(updates);

    logAuditDirect({
      userId: req.user.id,
      userEmail: req.user.email,
      role: req.user.role,
      action: AUDIT_ACTIONS.SETTINGS_CHANGE,
      resource: 'feature_flag',
      resourceId: req.params.flagId,
      details: updates,
    });

    res.json({ message: 'Feature flag updated.' });
  } catch (err) {
    console.error('[RBAC] Update feature flag error:', err);
    res.status(500).json({ message: 'Failed to update feature flag.' });
  }
});

module.exports = router;
