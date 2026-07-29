import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const CollegeAdminSidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin-login');
  };

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: '📊' },
    { label: 'Students', path: '/admin/students', icon: '🎓' },
    { label: 'Faculty', path: '/admin/faculty', icon: '👨‍🏫' },
    { label: 'Projects', path: '/admin/projects', icon: '💻' },
    { label: 'Certificates', path: '/admin/certificates', icon: '📜' },
    { label: 'Events', path: '/admin/events', icon: '📅' },
    { label: 'Reports', path: '/admin/reports', icon: '📈' },
    { label: 'Notifications', path: '/admin/notifications', icon: '🔔' },
  ];

  return (
    <>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/80 z-40" onClick={() => setMobileOpen(false)} />
      )}
      
      <aside className={`fixed md:relative top-0 right-0 h-screen w-64 bg-[#080812] border-l border-white/5 z-50 transition-transform duration-300 flex flex-col ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        
        <div className="h-28 flex items-center justify-center border-b border-white/5 shrink-0">
          <img src="/favicon.png?v=3" alt="Codovate" className="h-[100px] w-auto object-contain drop-shadow-[0_0_25px_rgba(32,21,255,0.4)]" draggable={false} />
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map(item => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold">
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default CollegeAdminSidebar;
