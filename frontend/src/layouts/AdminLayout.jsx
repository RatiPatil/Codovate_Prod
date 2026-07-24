import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopNav from './AdminTopNav';
import { useSidebar } from '../context/SidebarContext';
import { useSearch } from '../context/SearchContext';
import GlobalSearchModal from '../components/admin/ui/GlobalSearchModal';

const AdminLayout = () => {
  const { isOpen, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { isSearchOpen } = useSearch();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* Top Navigation */}
        <AdminTopNav />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Search Overlay */}
      {isSearchOpen && <GlobalSearchModal />}
    </div>
  );
};

export default AdminLayout;
