import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, ChevronDown, User, Settings, LogOut, Menu, Building2, SlidersHorizontal } from 'lucide-react';
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

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/opportunities?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const initials = (user?.name || 'R')
    .split(' ')
    .map(w => w[0])
    .slice(0, 1)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 gap-4 shrink-0 transition-colors duration-200 print:hidden">

      {/* Left Controls: Sidebar Collapse Button & Mobile Menu */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMobileMenuOpen}
          className="text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-slate-100 border border-slate-200/60"
          aria-label="Toggle navigation menu"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Center Search Pill Bar (Exact Unstop Pill Style) */}
      <div className="flex-1 max-w-xl mx-2 sm:mx-4">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search Opportunities"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={handleSearchSubmit}
            className="w-full h-11 pl-11 pr-4 rounded-full bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Business Button, Notifications & Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Business / Enterprise Pill Button */}
        <button
          onClick={() => navigate('/opportunities')}
          className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-full bg-[#E0EEFF] hover:bg-[#D0E4FF] text-[#0066FF] font-bold text-xs sm:text-sm transition-all"
        >
          <Building2 size={16} />
          <span>For Business</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropOpen(o => !o)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-[#0066FF] text-white font-extrabold text-sm flex items-center justify-center shadow-xs overflow-hidden">
              {(user?.photoURL || user?.avatar_url) ? (
                <img src={user.photoURL || user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`text-slate-400 transition-transform duration-200 hidden sm:block ${dropOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {dropOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Student'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => { setDropOpen(false); navigate('/profile'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User size={15} strokeWidth={1.8} />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => { setDropOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings size={15} strokeWidth={1.8} />
                <span>Settings</span>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <button
                onClick={() => {
                  setDropOpen(false);
                  logout();
                  window.location.href = '/login';
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
