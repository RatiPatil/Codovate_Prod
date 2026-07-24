import { 
  HomeIcon, UsersIcon, AcademicCapIcon, BriefcaseIcon, 
  DocumentTextIcon, CogIcon, ChartBarIcon, FolderOpenIcon,
  ChatBubbleLeftRightIcon, BookOpenIcon, BellIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';

/**
 * Enterprise Navigation Configuration
 * 
 * Each item supports:
 * - name: Display name in the sidebar
 * - path: Route path
 * - icon: HeroIcon component
 * - requiredPermission: String or Array of permissions (AND logic)
 * - anyPermission: String or Array of permissions (OR logic)
 * - requiredRole: String or Array of roles (used if permissions are overkill)
 */
export const navigationConfig = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: HomeIcon,
    // Everyone with dashboard access
    requiredPermission: 'dashboard:read',
  },
  {
    name: 'Admin Dashboard',
    path: '/admin',
    icon: ChartBarIcon,
    // Strict role gating for the main admin hub
    requiredRole: ['super_admin', 'admin', 'college_admin', 'company_admin', 'support_admin'],
  },
  {
    name: 'User Management',
    path: '/admin/users',
    icon: UsersIcon,
    requiredPermission: 'users:read',
  },
  {
    name: 'Students',
    path: '/admin/students',
    icon: AcademicCapIcon,
    anyPermission: ['students:read', 'students:manage'],
  },
  {
    name: 'Colleges',
    path: '/admin/colleges',
    icon: AcademicCapIcon,
    requiredPermission: 'colleges:read',
  },
  {
    name: 'Companies',
    path: '/admin/companies',
    icon: BriefcaseIcon,
    requiredPermission: 'companies:read',
  },
  {
    name: 'Opportunities',
    path: '/admin/opportunities',
    icon: BriefcaseIcon,
    anyPermission: ['jobs:read', 'jobs:create', 'jobs:manage'],
  },
  {
    name: 'Applications',
    path: '/admin/applications',
    icon: DocumentTextIcon,
    anyPermission: ['applications:read'],
  },
  {
    name: 'Projects',
    path: '/admin/projects',
    icon: FolderOpenIcon,
    requiredPermission: 'projects:read',
  },
  {
    name: 'Learning Content',
    path: '/admin/learning',
    icon: BookOpenIcon,
    requiredPermission: 'learning:read',
  },
  {
    name: 'Assessments',
    path: '/admin/assessments',
    icon: ShieldCheckIcon,
    requiredPermission: 'assessments:read',
  },
  {
    name: 'Community & Teams',
    path: '/community',
    icon: ChatBubbleLeftRightIcon,
    anyPermission: ['teams:read', 'events:read'],
  },
  {
    name: 'Notifications',
    path: '/admin/notifications',
    icon: BellIcon,
    requiredPermission: 'notifications:read',
  },
  {
    name: 'Settings',
    path: '/admin/settings',
    icon: CogIcon,
    requiredPermission: 'settings:read',
  },
  {
    name: 'Audit Logs',
    path: '/admin/audit',
    icon: ShieldCheckIcon,
    requiredPermission: 'audit_logs:read',
  }
];

/**
 * Filter navigation items based on the user's role and permissions
 */
export const getAuthorizedNavigation = (hasPermission, hasAnyPermission, hasRole) => {
  return navigationConfig.filter(item => {
    // 1. Role check (if specified)
    if (item.requiredRole && !hasRole(item.requiredRole)) {
      return false;
    }

    // 2. Exact permission check (AND logic)
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return false;
    }

    // 3. Any permission check (OR logic)
    if (item.anyPermission && !hasAnyPermission(item.anyPermission)) {
      return false;
    }

    return true;
  });
};
