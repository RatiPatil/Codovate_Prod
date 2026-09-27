import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import { useSearch } from '../context/SearchContext';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, Search, Bell, Moon, Sun, ChevronDown 
} from 'lucide-react';

const AdminTopNav = () => {
  const { toggleMobileSidebar } = useSidebar();
  const { openSearch } = useSearch();
  const { user, logout } = useAuth();

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30">
      
      {/* Left section: Mobile menu toggle & Breadcrumbs (Placeholder) */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Breadcrumbs can be injected here dynamically based on route */}
        <div className="hidden md:flex text-sm text-gray-500 dark:text-gray-400">
          <span>Admin</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Dashboard</span>
        </div>
      </div>

      {/* Right section: Search, Theme, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Global Search Trigger */}
        <button
          onClick={openSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-900/80 rounded-full transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search (Ctrl+K)</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <Moon className="w-5 h-5 hidden dark:block" />
          <Sun className="w-5 h-5 block dark:hidden" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
        </button>

        {/* Profile Dropdown (Simplified for shell) */}
        <div className="relative ml-2">
          <button className="flex items-center gap-2 p-1 pl-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
          </button>
        </div>

      </div>
    </header>
  );
};

export default AdminTopNav;
