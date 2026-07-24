/**
 * ═══════════════════════════════════════════════════════════════
 *  CODOVATE ENTERPRISE RBAC — PERMISSION CONSTANTS REGISTRY
 * ═══════════════════════════════════════════════════════════════
 * 
 * Central source of truth for every permission in the system.
 * Permissions follow the format: "category:action"
 * 
 * Usage:
 *   const { PERMISSIONS, CATEGORIES, ACTIONS } = require('./permissions');
 *   authorize(PERMISSIONS.USERS.CREATE)  // "users:create"
 */

// ─── Permission Actions ─────────────────────────────────────
const ACTIONS = Object.freeze({
  CREATE:  'create',
  READ:    'read',
  UPDATE:  'update',
  DELETE:  'delete',
  APPROVE: 'approve',
  PUBLISH: 'publish',
  ASSIGN:  'assign',
  EXPORT:  'export',
  MANAGE:  'manage',
});

// ─── Permission Categories ──────────────────────────────────
const CATEGORIES = Object.freeze({
  DASHBOARD:     'dashboard',
  USERS:         'users',
  STUDENTS:      'students',
  MENTORS:       'mentors',
  RECRUITERS:    'recruiters',
  COLLEGES:      'colleges',
  COMPANIES:     'companies',
  PROJECTS:      'projects',
  LEARNING:      'learning',
  CODING:        'coding',
  ASSESSMENTS:   'assessments',
  RESUME:        'resume',
  PORTFOLIO:     'portfolio',
  JOBS:          'jobs',
  APPLICATIONS:  'applications',
  EVENTS:        'events',
  TEAMS:         'teams',
  ANALYTICS:     'analytics',
  REPORTS:       'reports',
  NOTIFICATIONS: 'notifications',
  SETTINGS:      'settings',
  SYSTEM:        'system',
  SECURITY:      'security',
  AUDIT_LOGS:    'audit_logs',
  FEATURE_FLAGS: 'feature_flags',
});

// ─── Build Permission Map ───────────────────────────────────
// Generates: PERMISSIONS.USERS.CREATE = "users:create", etc.
const PERMISSIONS = {};
const ALL_PERMISSIONS = [];

for (const [catKey, catValue] of Object.entries(CATEGORIES)) {
  PERMISSIONS[catKey] = {};
  for (const [actKey, actValue] of Object.entries(ACTIONS)) {
    const perm = `${catValue}:${actValue}`;
    PERMISSIONS[catKey][actKey] = perm;
    ALL_PERMISSIONS.push(perm);
  }
}

Object.freeze(PERMISSIONS);
Object.freeze(ALL_PERMISSIONS);

// ─── Wildcard Permission ────────────────────────────────────
// Super admin gets this — matches everything
const WILDCARD = '*';

module.exports = {
  ACTIONS,
  CATEGORIES,
  PERMISSIONS,
  ALL_PERMISSIONS,
  WILDCARD,
};
