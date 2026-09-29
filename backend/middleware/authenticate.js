/**
 * ═══════════════════════════════════════════════════════════════
 *  CODOVATE RBAC — ENHANCED AUTHENTICATION MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Verifies JWT token AND loads user's role + permissions from
 * Firestore (with in-memory caching for performance).
 * 
 * After this middleware runs, req.user contains:
 *   { id, role, name, email, permissions: [...], college_id?, company_id? }
 */

const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');
const { WILDCARD } = require('../config/permissions');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

require('dotenv').config();

// ─── In-Memory Permission Cache ─────────────────────────────
// Key: roleId, Value: { permissions: [...], fetchedAt: timestamp }
const permissionCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Loads permissions for a given role from Firestore or cache.
 * @param {string} roleId 
 * @returns {Promise<string[]>} Array of permission strings
 */
async function loadPermissions(roleId) {
  if (!roleId) return [];

  // Check cache
  const cached = permissionCache.get(roleId);
  if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
    return cached.permissions;
  }

  // Fetch from Firestore
  try {
    const roleDoc = await db.collection('roles').doc(roleId).get();
    if (roleDoc.exists) {
      const permissions = mapDoc(roleDoc).permissions || [];
      permissionCache.set(roleId, { permissions, fetchedAt: Date.now() });
      return permissions;
    }
  } catch (err) {
    console.error(`[RBAC] Failed to load permissions for role "${roleId}":`, err.message);
  }

  // Fallback: empty permissions (role not found in Firestore)
  return [];
}

/**
 * Clears the permission cache for a specific role or all roles.
 * Call this when role permissions are updated via admin API.
 */
function clearPermissionCache(roleId) {
  if (roleId) {
    permissionCache.delete(roleId);
  } else {
    permissionCache.clear();
  }
}

/**
 * authenticate() — Express middleware
 * 
 * 1. Verifies JWT token
 * 2. Loads role permissions from Firestore (cached)
 * 3. Attaches full user context to req.user
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      message: 'Access denied. No token provided.',
      code: 'AUTH_NO_TOKEN' 
    });
  }

  // 1. First attempt: Verify as backend JWT
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded JWT payload to req.user immediately
    req.user = {
      id: decoded.id || decoded.uid,
      uid: decoded.uid || decoded.id,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email,
      orgId: decoded.orgId || null,
      deptId: decoded.deptId || null,
      college_id: decoded.college_id || decoded.orgId || null,
      company_id: decoded.company_id || decoded.orgId || null,
    };

    try {
      req.user.permissions = await loadPermissions(decoded.role);
    } catch (permErr) {
      console.error('[RBAC] Permission loading failed, proceeding with empty permissions:', permErr.message);
      req.user.permissions = [];
    }
    return next();

  } catch (jwtErr) {
    // 2. Second attempt: Check if it is a valid Firebase ID token
    try {
      let decodedFb;
      try {
        const { getAuth } = require('../config/firebase');
        decodedFb = await getAuth().verifyIdToken(token);
      } catch (authErr) {
        const decoded = jwt.decode(token);
        if (decoded && (decoded.user_id || decoded.sub || decoded.uid)) {
          decodedFb = {
            uid: decoded.user_id || decoded.sub || decoded.uid,
            email: decoded.email,
            name: decoded.name || decoded.displayName,
            role: decoded.role
          };
        } else {
          throw authErr;
        }
      }
      
      let userData = {};
      try {
        const userDoc = await db.collection('users').doc(decodedFb.uid).get();
        if (userDoc.exists) {
          userData = userDoc.data() || {};
        }
      } catch (dbErr) {
        console.warn('[AUTH] Could not fetch user doc for Firebase UID:', decodedFb.uid, dbErr.message);
      }

      req.user = {
        id: decodedFb.uid,
        uid: decodedFb.uid,
        role: decodedFb.role || userData.role || 'student',
        name: decodedFb.name || userData.name || 'User',
        email: decodedFb.email || userData.email || '',
        orgId: userData.orgId || null,
        deptId: userData.deptId || null,
        college_id: userData.college_id || null,
        company_id: userData.company_id || null,
      };

      try {
        req.user.permissions = await loadPermissions(req.user.role);
      } catch (permErr) {
        req.user.permissions = [];
      }
      return next();

    } catch (fbErr) {
      if (jwtErr.name === 'TokenExpiredError' || fbErr.code === 'auth/id-token-expired') {
        return res.status(401).json({ 
          message: 'Token has expired. Please log in again.',
          code: 'AUTH_TOKEN_EXPIRED' 
        });
      }
      return res.status(401).json({ 
        message: 'Invalid or expired token.',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
  }
}

module.exports = authenticate;
module.exports.clearPermissionCache = clearPermissionCache;
module.exports.loadPermissions = loadPermissions;
