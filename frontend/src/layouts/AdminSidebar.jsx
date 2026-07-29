import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useRole } from '../context/RoleContext';
import { useOrganization } from '../context/OrganizationContext';
import { 
  LayoutDashboard, Users, Briefcase, 
  Settings, Shield, ChevronLeft, ChevronRight, X,
  BarChart3, FileText, Activity, ShieldCheck, UserCog,
  Building, GraduationCap, Map, FolderOpen, Clock, 
  Layers, UsersRound, Contact, Handshake, Target, Brain, 
  MapPin, AlertCircle, Flag, Search, Key, BookOpen, Award
} from 'lucide-react';

const AdminSidebar = () => {
  const { isOpen, isMobileOpen, toggleSidebar, closeMobileSidebar } = useSidebar();
  const { hasPermission } = useRole();
  const { currentOrg } = useOrganization();

  // Filtered strictly to implemented production modules as requested by user
  const menuGroups = [
    {
      group: "Core",
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', permission: 'dashboard:view' },
        { name: 'Analytics', icon: BarChart3, path: '/admin/analytics', permission: 'dashboard:view' },
      ]
    },
    {
      group: "Identity & Access",
      items: [
        { name: 'Users', icon: Users, path: '/admin/users', permission: 'users:manage' },
        { name: 'Organizations', icon: Building, path: '/admin/organizations', permission: 'colleges:manage' },
      ]
    },
    {
      group: "Academic",
      items: [
        { name: 'Colleges', icon: GraduationCap, path: '/admin/colleges', permission: 'colleges:manage' },
        { name: 'Academic Base', icon: BookOpen, path: '/admin/academic', permission: 'colleges:manage' },
      ]
    },
    {
      group: "People",
      items: [
        { name: 'Students', icon: UsersRound, path: '/admin/students', permission: 'users:manage' },
        { name: 'Staff', icon: Contact, path: '/admin/staff', permission: 'users:manage' },
      ]
    },
    {
      group: "Corporate",
      items: [
        { name: 'Companies', icon: Briefcase, path: '/admin/companies', permission: 'companies:manage' },
        { name: 'Recruiters', icon: Users, path: '/admin/recruiters', permission: 'companies:manage' },
      ]
    },
    {
      group: "Hiring",
      items: [
        { name: 'Jobs', icon: Briefcase, path: '/admin/jobs', permission: 'jobs:manage' },
        { name: 'Placement Drives', icon: Handshake, path: '/admin/placements', permission: 'jobs:manage' },
        { name: 'Applications', icon: FileText, path: '/admin/applications', permission: 'jobs:manage' },
        { name: 'Interviews', icon: Users, path: '/admin/interviews', permission: 'jobs:manage' },
        { name: 'Offers', icon: Award, path: '/admin/offers', permission: 'jobs:manage' },
        { name: 'Placement Records', icon: FolderOpen, path: '/admin/placement-records', permission: 'jobs:manage' },
      ]
    }
  ];

  const renderIcon = (IconCmp) => <IconCmp className={`w-5 h-5 shrink-0 ${isOpen ? '' : 'mx-auto'}`} />;

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-50 flex flex-col
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-20'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className={`flex items-center gap-2 overflow-hidden ${!isOpen && 'lg:hidden'}`}>
          <img src="/logo.png" alt="Codovate Logo" className="w-8 h-8 object-contain rounded-lg shrink-0" />
          <span className="font-semibold text-lg whitespace-nowrap dark:text-white">Codovate Admin</span>
        </div>

        <button 
          onClick={closeMobileSidebar}
          className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isOpen && currentOrg && (
        <div className="px-4 py-3 shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 uppercase tracking-wider truncate border-b border-gray-200 dark:border-gray-700">
          {currentOrg.name}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {menuGroups.map((group, idx) => {
          // In a real app we filter by hasPermission, but skipping here to expose all for QA
          const visibleItems = group.items;
          
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {isOpen && (
                <div className="px-3 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  {group.group}
                </div>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => closeMobileSidebar()}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
                    ${isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }
                  `}
                  title={!isOpen ? item.name : undefined}
                >
                  {item.icon ? renderIcon(item.icon) : <div className="w-5 h-5" />}
                  {isOpen && <span className="truncate">{item.name}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Toggle Footer */}
      <div className="hidden lg:flex shrink-0 items-center justify-end p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleSidebar}
          className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
