/**
 * ═══════════════════════════════════════════════════════════════
 *  CODOVATE ENTERPRISE RBAC — ROLE DEFINITIONS
 * ═══════════════════════════════════════════════════════════════
 * 
 * Defines every role and its default permission set.
 * Used by the seed script and as the source of truth for RBAC.
 * 
 * Priority: 1 = highest authority (super_admin), 8 = lowest (student)
 */

const { PERMISSIONS, WILDCARD } = require('./permissions');
const P = PERMISSIONS;

// ─── Role Definitions ───────────────────────────────────────

const ROLE_DEFINITIONS = {

  // ── 1. SUPER ADMIN ─────────────────────────────────────────
  super_admin: {
    roleId: 'super_admin',
    roleName: 'Super Admin',
    description: 'Full platform access. Can manage all aspects of Codovate.',
    priority: 1,
    isSystem: true,
    permissions: [WILDCARD],  // Wildcard = all permissions
  },

  // ── 2. COLLEGE ADMIN ───────────────────────────────────────
  college_admin: {
    roleId: 'college_admin',
    roleName: 'College Admin',
    description: 'College-specific management. Can manage students, faculty, events, and reports within their college.',
    priority: 2,
    isSystem: true,
    permissions: [
      P.DASHBOARD.READ,
      // Students (scoped to college)
      P.STUDENTS.READ, P.STUDENTS.CREATE, P.STUDENTS.UPDATE, P.STUDENTS.DELETE,
      P.STUDENTS.APPROVE, P.STUDENTS.EXPORT, P.STUDENTS.MANAGE,
      // Users (read only)
      P.USERS.READ,
      // Mentors
      P.MENTORS.READ, P.MENTORS.ASSIGN,
      // Colleges (own college only)
      P.COLLEGES.READ, P.COLLEGES.UPDATE,
      // Projects (college students)
      P.PROJECTS.READ, P.PROJECTS.APPROVE,
      // Events
      P.EVENTS.READ, P.EVENTS.CREATE, P.EVENTS.UPDATE, P.EVENTS.DELETE, P.EVENTS.PUBLISH,
      // Notifications
      P.NOTIFICATIONS.READ, P.NOTIFICATIONS.CREATE, P.NOTIFICATIONS.MANAGE,
      // Reports & Analytics
      P.REPORTS.READ, P.REPORTS.EXPORT,
      P.ANALYTICS.READ,
      // Certificates
      P.ASSESSMENTS.READ, P.ASSESSMENTS.APPROVE,
      // Settings (college-level)
      P.SETTINGS.READ, P.SETTINGS.UPDATE,
    ],
  },

  // ── 3. FACULTY ─────────────────────────────────────────────
  faculty: {
    roleId: 'faculty',
    roleName: 'Faculty',
    description: 'Faculty and mentor management. Can view students, approve projects, and manage events within their department.',
    priority: 3,
    isSystem: true,
    permissions: [
      P.DASHBOARD.READ,
      // Students (read-only)
      P.STUDENTS.READ,
      // Projects
      P.PROJECTS.READ, P.PROJECTS.APPROVE, P.PROJECTS.ASSIGN,
      // Events (read)
      P.EVENTS.READ,
      // Assessments
      P.ASSESSMENTS.READ, P.ASSESSMENTS.APPROVE,
      // Notifications
      P.NOTIFICATIONS.READ,
      // Reports
      P.REPORTS.READ,
      // Analytics
      P.ANALYTICS.READ,
    ],
  },

  // ── 4. MENTOR ──────────────────────────────────────────────
  mentor: {
    roleId: 'mentor',
    roleName: 'Mentor',
    description: 'Assigned students only. Can manage mentoring sessions, queries, and resources for assigned students.',
    priority: 4,
    isSystem: true,
    permissions: [
      P.DASHBOARD.READ,
      // Students (read assigned only — enforced by checkOwnership)
      P.STUDENTS.READ,
      // Mentors (own profile)
      P.MENTORS.READ, P.MENTORS.UPDATE,
      // Projects (assigned students' projects)
      P.PROJECTS.READ, P.PROJECTS.APPROVE,
      // Notifications
      P.NOTIFICATIONS.READ, P.NOTIFICATIONS.CREATE,
      // Events (read)
      P.EVENTS.READ,
      // Teams (assigned students)
      P.TEAMS.READ,
    ],
  },

  // ── 5. RECRUITER ───────────────────────────────────────────
  recruiter: {
    roleId: 'recruiter',
    roleName: 'Recruiter',
    description: 'Company dashboard. Can manage opportunities, view applications, and access talent pool.',
    priority: 5,
    isSystem: true,
    permissions: [
      P.DASHBOARD.READ,
      // Companies (own company)
      P.COMPANIES.READ, P.COMPANIES.UPDATE,
      // Jobs / Opportunities
      P.JOBS.READ, P.JOBS.CREATE, P.JOBS.UPDATE, P.JOBS.DELETE, P.JOBS.PUBLISH,
      // Applications
      P.APPLICATIONS.READ, P.APPLICATIONS.UPDATE, P.APPLICATIONS.APPROVE,
      // Recruiters (own profile)
      P.RECRUITERS.READ, P.RECRUITERS.UPDATE,
      // Students (talent pool — read)
      P.STUDENTS.READ,
      // Analytics (company)
      P.ANALYTICS.READ,
      // Notifications
      P.NOTIFICATIONS.READ,
      // Events (company events)
      P.EVENTS.READ, P.EVENTS.CREATE, P.EVENTS.UPDATE,
    ],
  },

  // ── 6. STUDENT ─────────────────────────────────────────────
  student: {
    roleId: 'student',
    roleName: 'Student',
    description: 'Student dashboard. Full access to personal learning, career, and collaboration features.',
    priority: 6,
    isSystem: true,
    permissions: [
      P.DASHBOARD.READ,
      // Students (own profile only — enforced by checkOwnership)
      P.STUDENTS.READ, P.STUDENTS.UPDATE,
      // Resume
      P.RESUME.READ, P.RESUME.CREATE, P.RESUME.UPDATE, P.RESUME.DELETE,
      // Portfolio
      P.PORTFOLIO.READ, P.PORTFOLIO.CREATE, P.PORTFOLIO.UPDATE, P.PORTFOLIO.DELETE,
      // Projects
      P.PROJECTS.READ, P.PROJECTS.CREATE, P.PROJECTS.UPDATE, P.PROJECTS.DELETE,
      // Applications
      P.APPLICATIONS.READ, P.APPLICATIONS.CREATE, P.APPLICATIONS.UPDATE,
      // Jobs (read/search)
      P.JOBS.READ,
      // Teams
      P.TEAMS.READ, P.TEAMS.CREATE, P.TEAMS.UPDATE,
      // Learning
      P.LEARNING.READ,
      // Coding
      P.CODING.READ, P.CODING.CREATE,
      // Assessments
      P.ASSESSMENTS.READ, P.ASSESSMENTS.CREATE,
      // Events (attend)
      P.EVENTS.READ,
      // Mentors (browse/request)
      P.MENTORS.READ,
      // Notifications
      P.NOTIFICATIONS.READ, P.NOTIFICATIONS.UPDATE,
      // Analytics (personal)
      P.ANALYTICS.READ,
      // Colleges (read)
      P.COLLEGES.READ,
      // Companies (read)
      P.COMPANIES.READ,
    ],
  },

  // ── 7. CONTENT ADMIN ───────────────────────────────────────
  content_admin: {
    roleId: 'content_admin',
    roleName: 'Content Admin',
    description: 'Learning and assessment management. Can create and manage learning content, assessments, and coding challenges.',
    priority: 7,
    isSystem: true,
    permissions: [
      P.DASHBOARD.READ,
      // Learning
      P.LEARNING.READ, P.LEARNING.CREATE, P.LEARNING.UPDATE, P.LEARNING.DELETE,
      P.LEARNING.PUBLISH, P.LEARNING.MANAGE,
      // Coding
      P.CODING.READ, P.CODING.CREATE, P.CODING.UPDATE, P.CODING.DELETE,
      P.CODING.PUBLISH, P.CODING.MANAGE,
      // Assessments
      P.ASSESSMENTS.READ, P.ASSESSMENTS.CREATE, P.ASSESSMENTS.UPDATE, P.ASSESSMENTS.DELETE,
      P.ASSESSMENTS.PUBLISH, P.ASSESSMENTS.MANAGE,
      // Notifications (content-related)
      P.NOTIFICATIONS.READ, P.NOTIFICATIONS.CREATE,
      // Analytics (content performance)
      P.ANALYTICS.READ,
      // Students (read only for content targeting)
      P.STUDENTS.READ,
    ],
  },

  // ── 8. SUPPORT ADMIN ───────────────────────────────────────
  support_admin: {
    roleId: 'support_admin',
    roleName: 'Support Admin',
    description: 'Support and verification. Can view users, manage notifications, settings, and system health.',
    priority: 8,
    isSystem: true,
    permissions: [
      P.DASHBOARD.READ,
      // Users (read for support)
      P.USERS.READ,
      P.STUDENTS.READ,
      P.MENTORS.READ,
      P.RECRUITERS.READ,
      // Notifications
      P.NOTIFICATIONS.READ, P.NOTIFICATIONS.CREATE, P.NOTIFICATIONS.UPDATE, P.NOTIFICATIONS.MANAGE,
      // Settings
      P.SETTINGS.READ, P.SETTINGS.UPDATE,
      // System health
      P.SYSTEM.READ, P.SYSTEM.MANAGE,
      // Security (view)
      P.SECURITY.READ,
      // Audit logs (read for investigations)
      P.AUDIT_LOGS.READ,
      // Colleges (read)
      P.COLLEGES.READ,
      // Companies (read)
      P.COMPANIES.READ,
    ],
  },
};

// ─── Legacy role alias ──────────────────────────────────────
// The old "admin" role maps to super_admin for backward compatibility
ROLE_DEFINITIONS.admin = {
  ...ROLE_DEFINITIONS.super_admin,
  roleId: 'admin',
  roleName: 'Admin (Legacy)',
  description: 'Legacy admin role — maps to Super Admin permissions.',
  isSystem: true,
};

// ─── Also map company_admin to recruiter for backward compat ─
ROLE_DEFINITIONS.company_admin = {
  ...ROLE_DEFINITIONS.recruiter,
  roleId: 'company_admin',
  roleName: 'Company Admin',
  description: 'Company administrator — equivalent to Recruiter with full company management.',
  priority: 5,
  isSystem: true,
  permissions: [
    ...ROLE_DEFINITIONS.recruiter.permissions,
    // Additional company management permissions
    PERMISSIONS.COMPANIES.MANAGE,
    PERMISSIONS.SETTINGS.READ, PERMISSIONS.SETTINGS.UPDATE,
    PERMISSIONS.REPORTS.READ, PERMISSIONS.REPORTS.EXPORT,
  ],
};

// ─── Default Feature Flags ──────────────────────────────────
const DEFAULT_FEATURE_FLAGS = [
  {
    key: 'beta_mock_interview',
    enabled: true,
    description: 'AI Mock Interview (Beta)',
    allowedRoles: [],
  },
  {
    key: 'maintenance_mode',
    enabled: false,
    description: 'Platform Maintenance Mode — disables all non-admin access',
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    key: 'beta_team_workspace',
    enabled: true,
    description: 'Collaborative Team Workspace (Beta)',
    allowedRoles: [],
  },
  {
    key: 'public_portfolio',
    enabled: true,
    description: 'Public Portfolio pages',
    allowedRoles: [],
  },
  {
    key: 'placement_prep',
    enabled: true,
    description: 'Placement Preparation Module',
    allowedRoles: ['student'],
  },
];

// ─── Role Redirect Map ──────────────────────────────────────
const ROLE_REDIRECTS = Object.freeze({
  super_admin:   '/admin',
  admin:         '/admin',
  college_admin: '/admin',
  company_admin: '/admin',
  faculty:       '/admin',        // Placeholder — uses admin router for now
  mentor:        '/mentor/dashboard',
  recruiter:     '/admin',        // Placeholder — uses company admin router for now
  student:       '/dashboard',
  content_admin: '/admin',        // Placeholder
  support_admin: '/admin',        // Placeholder
});

// ─── Role Priority Map (for privilege escalation checks) ────
const ROLE_PRIORITIES = Object.freeze(
  Object.fromEntries(
    Object.values(ROLE_DEFINITIONS).map(r => [r.roleId, r.priority])
  )
);

module.exports = {
  ROLE_DEFINITIONS,
  DEFAULT_FEATURE_FLAGS,
  ROLE_REDIRECTS,
  ROLE_PRIORITIES,
};
