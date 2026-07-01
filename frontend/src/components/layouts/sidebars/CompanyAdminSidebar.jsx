import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const CompanyAdminSidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin-login');
  };

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: '📊' },
    { label: 'Jobs', path: '/admin/jobs', icon: '💼' },
    { label: 'Internships', path: '/admin/internships', icon: '🚀' },
    { label: 'Applications', path: '/admin/applications', icon: '📥' },
    { label: 'Candidates', path: '/admin/candidates', icon: '👥' },
    { label: 'Interviews', path: '/admin/interviews', icon: '📅' },
    { label: 'Hiring Analytics', path: '/admin/hiring', icon: '📈' },
    { label: 'Notifications', path: '/admin/notifications', icon: '🔔' },
  ];

  return (
    <>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/80 z-40" onClick={() => setMobileOpen(false)} />
      )}
      
      <aside className={`fixed md:relative top-0 right-0 h-screen w-64 bg-[#080812] border-l border-white/5 z-50 transition-transform duration-300 flex flex-col ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        
        <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-lg shadow-[0_0_20px_rgba(245,158,11,0.4)]">C</div>
          <div>
            <span className="text-white font-black text-lg tracking-tight block leading-tight">CODOVATE</span>
            <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest">Company Admin</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map(item => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${isActive ? 'bg-amber-500/10 text-amber-500' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
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

export default CompanyAdminSidebar;
