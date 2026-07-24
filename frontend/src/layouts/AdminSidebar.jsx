import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useRole } from '../context/RoleContext';
import { useOrganization } from '../context/OrganizationContext';
import { 
  LayoutDashboard, Users, Briefcase, 
  Settings, Shield, ChevronLeft, ChevronRight, X
} from 'lucide-react';

const AdminSidebar = () => {
  const { isOpen, isMobileOpen, toggleSidebar, closeMobileSidebar } = useSidebar();
  const { hasPermission } = useRole();
  const { currentOrg } = useOrganization();

  // Dynamic Navigation Engine
  // In a real scenario, this is pulled from a config file or API based on role/permissions.
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', permission: 'dashboard:view' },
    { name: 'Users', icon: Users, path: '/admin/users', permission: 'users:manage' },
    { name: 'Organizations', icon: Briefcase, path: '/admin/organizations', permission: 'colleges:manage' },
    { name: 'Security', icon: Shield, path: '/admin/security', permission: 'system:manage' },
    { name: 'Settings', icon: Settings, path: '/admin/settings', permission: 'system:manage' },
    { name: 'UI Sandbox', icon: LayoutDashboard, path: '/admin/sandbox', permission: 'dashboard:view' }, // For testing
  ];

  const filteredMenu = menuItems.filter(item => hasPermission(item.permission));

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
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className={`flex items-center gap-2 overflow-hidden ${!isOpen && 'lg:hidden'}`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg shrink-0 flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="font-semibold text-lg whitespace-nowrap dark:text-white">Codovate Admin</span>
        </div>

        {/* Mobile Close Button */}
        <button 
          onClick={closeMobileSidebar}
          className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Org Context Indicator */}
      {isOpen && currentOrg && (
        <div className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 uppercase tracking-wider truncate">
          {currentOrg.name}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => (
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
            <item.icon className={`w-5 h-5 shrink-0 ${isOpen ? '' : 'mx-auto'}`} />
            {isOpen && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle Footer (Desktop Only) */}
      <div className="hidden lg:flex items-center justify-end p-3 border-t border-gray-200 dark:border-gray-700">
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
