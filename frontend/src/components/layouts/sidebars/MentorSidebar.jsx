import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const MentorSidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin-login');
  };

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: '📊' },
    { label: 'Student Queries', path: '/admin/queries', icon: '❓' },
    { label: 'Calendar', path: '/admin/calendar', icon: '📅' },
    { label: 'Availability', path: '/admin/availability', icon: '🕒' },
  ];

  return (
    <>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/80 z-40" onClick={() => setMobileOpen(false)} />
      )}
      
      <aside className={`fixed md:relative top-0 right-0 h-screen w-64 bg-[#080812] border-l border-white/5 z-50 transition-transform duration-300 flex flex-col ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        
        <div className="h-24 flex items-center justify-center border-b border-white/5 shrink-0">
          <img src="/favicon.png?v=3" alt="Codovate" className="h-14 w-auto object-contain drop-shadow-lg" />
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map(item => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
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

export default MentorSidebar;
