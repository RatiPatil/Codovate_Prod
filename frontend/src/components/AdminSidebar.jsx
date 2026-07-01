import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// ─── Nav Config per Role ──────────────────────────────────────────────────────
const NAV_CONFIG = {
  // Super Admin + Admin — full access
  super_admin: [
    {
      label: 'PLATFORM',
      items: [
        { path: '/admin',              label: 'Overview',       icon: '⊞',  exact: true },
        { path: '/admin/analytics',    label: 'Analytics',      icon: '📈' },
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { path: '/admin/users',        label: 'Users',          icon: '👥' },
        { path: '/admin/opportunities',label: 'Opportunities',  icon: '🔍' },
        { path: '/admin/applications', label: 'Applications',   icon: '📋' },
        { path: '/admin/colleges',     label: 'Colleges',       icon: '🏛️' },
        { path: '/admin/companies',    label: 'Companies',      icon: '🏢' },
        { path: '/admin/mentors',      label: 'Mentors',        icon: '🧑‍🏫' },
        { path: '/admin/teams',        label: 'Teams',          icon: '🤝' },
      ]
    },
    {
      label: 'CONTENT',
      items: [
        { path: '/admin/projects',     label: 'Projects',       icon: '🚀' },
        { path: '/admin/certificates', label: 'Certificates',   icon: '📜' },
        { path: '/admin/content',      label: 'Content Mgmt',   icon: '🖼️' },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { path: '/admin/notifications',label: 'Notifications',  icon: '🔔' },
        { path: '/admin/gamification', label: 'Gamification',   icon: '🎮' },
        { path: '/admin/settings',     label: 'Settings',       icon: '⚙️' },
        { path: '/admin/audit',        label: 'Audit Logs',     icon: '📜' },
      ]
    }
  ],

  // College Admin — restricted
  college_admin: [
    {
      label: 'MY COLLEGE',
      items: [
        { path: '/admin',              label: 'Overview',       icon: '⊞',  exact: true },
        { path: '/admin/users',        label: 'Students',       icon: '👥' },
        { path: '/admin/applications', label: 'Applications',   icon: '📋' },
        { path: '/admin/projects',     label: 'Projects',       icon: '🚀' },
        { path: '/admin/certificates', label: 'Certificates',   icon: '📜' },
      ]
    }
  ],

  // Company Admin — restricted to jobs & internships
  company_admin: [
    {
      label: 'RECRUITING',
      items: [
        { path: '/admin',              label: 'Overview',       icon: '⊞',  exact: true },
        { path: '/admin/opportunities',label: 'My Listings',    icon: '🔍' },
        { path: '/admin/applications', label: 'Applicants',     icon: '📋' },
      ]
    }
  ],
};

// admin role falls back to super_admin nav
NAV_CONFIG['admin'] = NAV_CONFIG['super_admin'];

// ─── Role Meta ────────────────────────────────────────────────────────────────
const ROLE_META = {
  super_admin:   { label: 'Super Admin',    color: '#FF4444', bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: '⚡' },
  admin:         { label: 'Admin',          color: '#F59E0B', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: '🛡️' },
  college_admin: { label: 'College Admin',  color: '#2015FF', bg: 'bg-[#2015FF]/10',  border: 'border-[#2015FF]/20',  icon: '🏛️' },
  company_admin: { label: 'Company Admin',  color: '#10B981', bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: '🏢' },
};

// ─── Sidebar Content ──────────────────────────────────────────────────────────
const SidebarContent = ({ setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected } = useSocket();

  const role = user?.role || 'admin';
  const sections = NAV_CONFIG[role] || NAV_CONFIG['admin'];
  const meta = ROLE_META[role] || ROLE_META['admin'];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === '/admin' || location.pathname === '/admin/';
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <div className="flex flex-col h-full bg-[#050510] relative overflow-hidden select-none">
      {/* Ambient glow */}
      <div className="absolute top-0 left-0 w-full h-48 opacity-[0.06] blur-[60px] pointer-events-none" style={{ background: meta.color }} />

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shrink-0"
            style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}99)`, boxShadow: `0 0 20px ${meta.color}40` }}>
            <span className="text-white font-black text-base">C</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-black text-sm tracking-tight leading-none">CODOVATE</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-0.5 truncate" style={{ color: meta.color }}>
              {meta.icon} {meta.label}
            </p>
          </div>

        </div>
      </div>

      {/* Admin Badge */}
      <div className={`mx-4 mt-4 mb-2 p-3 rounded-xl ${meta.bg} border ${meta.border} relative z-10 shrink-0`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center font-black text-sm shrink-0`}
            style={{ color: meta.color }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-white text-xs font-bold truncate leading-none">{user?.name || 'Administrator'}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest truncate mt-0.5" style={{ color: `${meta.color}99` }}>
              {meta.label}
            </p>
          </div>
        </div>
        {/* College / Company sub-info */}
        {user?.college_name && (
          <p className="text-[9px] text-gray-600 mt-2 truncate">{user.college_name}</p>
        )}
        {user?.company_name && (
          <p className="text-[9px] text-gray-600 mt-2 truncate">{user.company_name}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto scrollbar-hide relative z-10">
        {sections.map(section => (
          <div key={section.label}>
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] px-3 mb-1.5">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.path, item.exact);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group ${
                      active
                        ? 'text-white shadow-lg'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                    style={active ? { background: meta.color, boxShadow: `0 4px 16px ${meta.color}40` } : {}}
                  >
                    <span className="text-sm w-5 text-center shrink-0">{item.icon}</span>
                    <span className="tracking-wide truncate">{item.label}</span>
                    {active && <div className="ml-auto w-1 h-4 bg-white/40 rounded-full shrink-0" />}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {/* Student Portal Link */}
        <div className="border-t border-white/5 pt-4">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] px-3 mb-1.5">EXTERNAL</p>
          <NavLink
            to="/dashboard"
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-white hover:bg-white/5 transition-all"
          >
            <span className="text-sm w-5 text-center">🎓</span>
            <span>Student Portal</span>
            <span className="ml-auto text-[9px] text-gray-700">↗</span>
          </NavLink>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/5 relative z-10 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500/60 hover:text-white hover:bg-red-500 transition-all duration-200 group"
        >
          <span className="text-sm w-5 text-center">🚪</span>
          <span>Secure Logout</span>
          <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[9px]">→</span>
        </button>
      </div>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
const AdminSidebar = ({ mobileOpen, setMobileOpen }) => (
  <>
    {/* Desktop */}
    <aside className="hidden md:flex flex-col w-56 border-l border-white/5 h-screen sticky top-0 shrink-0 z-20">
      <SidebarContent setMobileOpen={setMobileOpen} />
    </aside>

    {/* Mobile Overlay */}
    {mobileOpen && (
      <div className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
    )}
    
    {/* Mobile Drawer */}
    <aside className={`md:hidden fixed top-0 right-0 h-screen w-56 z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <SidebarContent setMobileOpen={setMobileOpen} />
    </aside>
  </>
);

export default AdminSidebar;
