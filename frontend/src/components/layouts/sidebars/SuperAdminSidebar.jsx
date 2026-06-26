import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const SuperAdminSidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin-login');
  };

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: '📊' },
    { label: 'Users', path: '/admin/users', icon: '👥' },
    { label: 'Colleges', path: '/admin/colleges', icon: '🏛️' },
    { label: 'Companies', path: '/admin/companies', icon: '🏢' },
    { label: 'Mentors', path: '/admin/mentors', icon: '🧑‍🏫' },
    { label: 'Opportunities', path: '/admin/opportunities', icon: '🔍' },
    { label: 'Projects', path: '/admin/projects', icon: '💻' },
    { label: 'Certificates', path: '/admin/certificates', icon: '📜' },
    { label: 'Analytics', path: '/admin/analytics', icon: '📈' },
    { label: 'Notifications', path: '/admin/notifications', icon: '🔔' },
    { label: 'System Health', path: '/admin/system', icon: '⚙️' },
    { label: 'Settings', path: '/admin/settings', icon: '🔧' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/80 z-40" onClick={() => setMobileOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed md:relative top-0 left-0 h-screen w-64 bg-[#080812] border-r border-white/5 z-50 transition-transform duration-300 flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Brand */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#2015FF] flex items-center justify-center text-white font-black text-lg shadow-[0_0_20px_rgba(32,21,255,0.4)]">C</div>
          <div>
            <span className="text-white font-black text-lg tracking-tight block leading-tight">CODOVATE</span>
            <span className="text-[#2015FF] text-[10px] font-bold uppercase tracking-widest">Super Admin</span>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map(item => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${isActive ? 'bg-[#2015FF]/10 text-[#6060FF]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold">
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default SuperAdminSidebar;
