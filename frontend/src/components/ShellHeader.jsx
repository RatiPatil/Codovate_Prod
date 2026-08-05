import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, ChevronDown, User, Settings, LogOut, Menu } from 'lucide-react';
import api from '../api/axios';

/* Route → page title mapping */
const PAGE_TITLES = {
  '/dashboard':     'Dashboard',
  '/opportunities': 'Opportunities',
  '/applications':  'My Applications',
  '/learning':      'Learning Hub',
  '/resume-builder':'Resume Builder',
  '/mock-interview':'Mock Interviews',
  '/profile':       'My Profile',
  '/settings':      'Settings',
  '/roadmap':       'AI Roadmap',
  '/community':     'Community',
  '/teams':         'Teams',
  '/mentors':       'Mentors',
  '/events':        'Events',
  '/gamification':  'Rewards & Quests',
  '/leaderboard':   'Leaderboard',
  '/calendar':      'Calendar',
  '/notifications': 'Notifications',
};

const ShellHeader = ({ onMobileMenuOpen }) => {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();
  const [dropOpen, setDropOpen]     = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchVal, setSearchVal]   = useState('');
  const dropRef = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname]
    || PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => location.pathname.startsWith(k)) || '']
    || 'Codovate';

  /* Unread count */
  useEffect(() => {
    api.get('/notifications/unread/count')
      .then(r => setUnreadCount(r.data?.count || 0))
      .catch(() => {});
  }, []);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const initials = (user?.name || 'S')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="shell-header sticky top-0 z-30 h-[60px] flex items-center px-6 gap-4 shrink-0 print:hidden">

      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuOpen}
        className="md:hidden text-gray-500 hover:text-gray-800 transition-colors mr-1"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Page title */}
      <h1 className="font-bold text-gray-900 text-[15px] tracking-tight hidden md:block">
        {pageTitle}
      </h1>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden sm:block">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search..."
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          className="pl-9 pr-4 py-2 rounded-xl bg-gray-100 border border-gray-200/80 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-52 transition-all"
        />
      </div>

      {/* Notification bell */}
      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
        aria-label="Notifications"
      >
        <Bell size={19} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Profile dropdown */}
      <div className="relative" ref={dropRef}>
        <button
          onClick={() => setDropOpen(o => !o)}
          className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] text-white shrink-0 shadow-sm overflow-hidden bg-gray-100"
            style={{ background: 'linear-gradient(135deg, #6c3aff 0%, #3a9bff 100%)' }}
          >
            {(user?.photoURL || user?.avatar_url) ? (
              <img src={user.photoURL || user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="hidden md:flex flex-col items-start mr-2 max-w-[200px]">
            <span className="text-sm font-bold text-gray-900 leading-tight truncate w-full text-left">
              {user?.name || 'Student'}
            </span>
            <span className="text-[11px] font-medium text-gray-500 leading-tight">
              Student
            </span>
          </div>
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`text-gray-400 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dropOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 py-1.5 z-50 animate-fadeIn">
            <div className="px-4 py-2 border-b border-gray-100 mb-1">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { setDropOpen(false); navigate('/profile'); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <User size={15} strokeWidth={1.8} />
              My Profile
            </button>
            <button
              onClick={() => { setDropOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Settings size={15} strokeWidth={1.8} />
              Settings
            </button>
            <div className="h-px bg-gray-100 my-1"></div>
            <button
              onClick={() => {
                setDropOpen(false);
                logout();
                window.location.href = '/login';
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} strokeWidth={1.8} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default ShellHeader;
