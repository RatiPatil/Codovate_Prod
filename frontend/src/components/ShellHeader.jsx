import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, ChevronDown, User, Settings, LogOut, Menu } from 'lucide-react';
import api from '../api/axios';

const ShellHeader = ({ onMobileMenuOpen }) => {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const [dropOpen, setDropOpen]     = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchVal, setSearchVal]   = useState('');
  const dropRef = useRef(null);

  /* Unread notifications count */
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

  /* Search submission handler */
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/opportunities?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const initials = (user?.name || 'S')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#111522] border-b border-slate-200/80 dark:border-slate-800 flex items-center px-4 sm:px-6 gap-4 shrink-0 transition-colors duration-200 print:hidden">

      {/* Mobile Hamburger Trigger */}
      <button
        onClick={onMobileMenuOpen}
        className="md:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Center Main Product Search Bar */}
      <div className="flex-1 max-w-xl mx-auto md:mx-0">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search opportunities, hackathons, skills..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={handleSearchSubmit}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 hidden md:block" />

      {/* Right Controls: Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification Bell Icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Profile Avatar Dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropOpen(o => !o)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs overflow-hidden bg-slate-200 dark:bg-slate-800"
              style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
            >
              {(user?.photoURL || user?.avatar_url) ? (
                <img src={user.photoURL || user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div className="hidden md:flex flex-col items-start text-left max-w-[160px]">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate w-full">
                {user?.name || 'Student'}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight flex items-center gap-0.5">
                <span>Student</span>
              </span>
            </div>

            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`text-slate-400 transition-transform duration-200 hidden sm:block ${dropOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {dropOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#151926] rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-1.5 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Student'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => { setDropOpen(false); navigate('/profile'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <User size={15} strokeWidth={1.8} />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => { setDropOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <Settings size={15} strokeWidth={1.8} />
                <span>Settings</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-1" />

              <button
                onClick={() => {
                  setDropOpen(false);
                  logout();
                  window.location.href = '/login';
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut size={15} strokeWidth={1.8} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
};

export default ShellHeader;
