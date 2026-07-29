import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  BookOpen,
  FileText,
  Video,
  Bot,
  User,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

// Navigation items for student sidebar
const NAV_ITEMS = [
  { path: '/dashboard',     label: 'Dashboard',       Icon: LayoutDashboard, reqPerm: 'dashboard:read'    },
  { path: '/opportunities', label: 'Opportunities',   Icon: Briefcase,       reqPerm: 'jobs:read'         },
  { path: '/applications',  label: 'My Applications', Icon: ClipboardList,   reqPerm: 'applications:read' },
  { path: '/learning',      label: 'Learning',        Icon: BookOpen                                       },
  { path: '/resume-builder',label: 'Resume Builder',  Icon: FileText                                       },
  { path: '/career-coach',  label: 'AI Career Coach', Icon: Bot                                           },
  { path: '/profile',       label: 'Profile',         Icon: User,            reqPerm: 'students:read'     },
];

/* ── Circular progress ring ─────────────────────────────────────── */
const CircularProgress = ({ pct = 0, size = 72 }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle className="progress-ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={6} />
      <circle
        className="progress-ring__fill"
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={dash}
      />
    </svg>
  );
};

/* ── Sidebar Component ──────────────────────────────────────────── */
const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { logout }          = useAuth();
  const { hasPermission }   = useRole();
  const navigate            = useNavigate();
  const { socket }          = useSocket();

  const [unreadCount, setUnreadCount] = useState(0);
  const [profilePct, setProfilePct]   = useState(0);
  const [loadingPct, setLoadingPct]   = useState(true);

  /* Notification count ------------------------------------------ */
  useEffect(() => {
    api.get('/notifications/unread/count')
      .then(r => setUnreadCount(r.data?.count || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => setUnreadCount(p => p + 1);
    socket.on('new_notification', handler);
    return () => socket.off('new_notification', handler);
  }, [socket]);

  useEffect(() => {
    const handler = () => setUnreadCount(0);
    window.addEventListener('notifications_read', handler);
    return () => window.removeEventListener('notifications_read', handler);
  }, []);

  /* Profile completion for upgrade card -------------------------- */
  useEffect(() => {
    api.get('/students/workspace')
      .then(r => setProfilePct(r.data?.profile?.profile_completion || 0))
      .catch(() => setProfilePct(0))
      .finally(() => setLoadingPct(false));
  }, []);

  const isVisible = (item) => {
    if (!item.reqPerm) return true;
    return hasPermission(item.reqPerm);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  /* Shared sidebar content --------------------------------------- */
  const Content = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 pt-6 pb-6 lg:pt-8 flex items-center justify-center relative shrink-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
        >
          {/* Official Codovate Icon Only */}
          <img 
            src="/favicon.png?v=3" 
            alt="Codovate Icon" 
            className="h-20 md:h-24 lg:h-32 object-contain drop-shadow-2xl" 
          />
        </button>

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="md:hidden absolute right-4 top-6 text-white/30 hover:text-white transition-colors p-1"
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto sidebar-scroll">
        {NAV_ITEMS.filter(isVisible).map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className={({ isActive }) => `nav-item-v3${isActive ? ' active' : ''}`}
          >
            <Icon size={18} strokeWidth={1.75} className="shrink-0" />
            <span className="flex-1">{label}</span>
            {path === '/notifications' && unreadCount > 0 && (
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse shrink-0" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade Your Profile card */}
      <div className="px-3 pb-3 shrink-0">
        <div
          className="rounded-2xl p-4 text-white relative overflow-hidden mb-2"
          style={{ background: 'linear-gradient(135deg, #6c3aff 0%, #3a9bff 100%)', color: '#ffffff' }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-5 -right-5 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <p className="font-bold text-sm mb-0.5 relative z-10" style={{ color: '#ffffff' }}>Upgrade Your Profile</p>
          <p className="text-[11px] leading-relaxed mb-3 relative z-10" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Complete your profile to get better opportunities
          </p>

          {/* Circular progress */}
          <div className="flex justify-center mb-3 relative z-10">
            <div className="relative">
              <CircularProgress pct={loadingPct ? 0 : profilePct} size={72} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold text-[15px]" style={{ color: '#ffffff' }}>
                  {loadingPct ? '…' : `${profilePct}%`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="w-full bg-white font-bold text-[12px] rounded-xl py-2.5 hover:bg-white/90 active:scale-95 transition-all relative z-10 flex items-center justify-center gap-1"
            style={{ color: '#3a1fff' }}
          >
            Complete Now <span>→</span>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{ color: 'rgba(255,255,255,0.30)' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.10)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.30)';
          }}
        >
          <LogOut size={16} strokeWidth={1.75} />
          <span>Logout</span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-64 sidebar-v3 h-screen sticky top-0 shrink-0 z-20 print:hidden">
        <Content />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen w-64 sidebar-v3 z-50 transition-transform duration-300 print:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Content />
      </aside>
    </>
  );
};

export default Sidebar;