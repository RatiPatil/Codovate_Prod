import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Home,
  Briefcase,
  ClipboardList,
  BookOpen,
  FileText,
  Users,
  X,
} from 'lucide-react';
import Logo from './common/Logo';

// Exact navigation order requested in specification
const NAV_ITEMS = [
  { path: '/dashboard',     label: 'Dashboard',       Icon: Home          },
  { path: '/opportunities', label: 'Opportunities',   Icon: Briefcase     },
  { path: '/applications',  label: 'My Applications', Icon: ClipboardList },
  { path: '/teams',         label: 'Teams',           Icon: Users         },
  { path: '/learning',      label: 'Learning',        Icon: BookOpen      },
  { path: '/resume-builder',label: 'Resume Builder',  Icon: FileText      },
];

/* ── Circular progress ring matching reference screenshot ───── */
const CircularProgress = ({ pct = 0, size = 80 }) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#ffffff"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        fill="transparent"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

/* ── Shared Student Sidebar Component ────────────────────────────── */
const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();

  const [profilePct, setProfilePct] = useState(0);
  const [loadingPct, setLoadingPct] = useState(true);

  /* Profile completion fetch and sync */
  useEffect(() => {
    let isMounted = true;
    api.get('/students/workspace')
      .then(r => {
        if (!isMounted) return;
        const pct = r.data?.profile?.profile_completion ?? user?.profileCompletion ?? 0;
        setProfilePct(Number(pct) || 0);
      })
      .catch(() => {
        if (isMounted) setProfilePct(Number(user?.profileCompletion) || 0);
      })
      .finally(() => {
        if (isMounted) setLoadingPct(false);
      });

    return () => { isMounted = false; };
  }, [user]);

  /* Listen for real-time profile updates */
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail?.completion !== undefined) {
        setProfilePct(Number(e.detail.completion) || 0);
      }
    };
    window.addEventListener('profile_updated', handleUpdate);
    return () => window.removeEventListener('profile_updated', handleUpdate);
  }, []);

  const isPathActive = (itemPath) => {
    const current = location.pathname;
    if (itemPath === '/dashboard') return current === '/dashboard';
    if (itemPath === '/settings') return current === '/settings';
    if (itemPath === '/profile') return current === '/profile';
    return current.startsWith(itemPath);
  };

  const isComplete = profilePct >= 100;

  /* Sidebar Content */
  const Content = () => (
    <div className="flex flex-col h-full bg-[#05060f] text-white border-r border-white/5 select-none overflow-hidden">

      {/* Logo Container — STRICTLY UNTOUCHED */}
      <div className="flex items-center justify-center py-8 lg:py-10 relative shrink-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
        >
          <Logo responsive className="drop-shadow-2xl" />
        </button>

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="md:hidden absolute right-4 top-6 text-white/40 hover:text-white transition-colors p-1"
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>

      {/* Navigation Links matching reference screenshot */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto sidebar-scroll">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const active = isPathActive(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-[#2563FF] via-[#5B21B6] to-[#8B00FF] text-white shadow-lg shadow-purple-900/40 font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2 : 1.75} className={active ? 'text-white' : 'text-gray-300'} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Your Profile Card — Anchored to bottom */}
      <div className="p-3 shrink-0 mt-auto">
        <div
          className="rounded-2xl p-4 text-white relative overflow-hidden flex flex-col items-center text-center shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #5b21b6 50%, #7e22ce 100%)',
          }}
        >
          {/* Subtle background glow */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <p className="font-bold text-[15px] mb-1 leading-tight text-white relative z-10">
            {isComplete ? 'Profile Complete ✓' : 'Upgrade Your Profile'}
          </p>
          <p className="text-[11px] leading-snug mb-3.5 text-white/80 max-w-[190px] relative z-10">
            {isComplete
              ? 'Your profile is 100% complete and ready for recruiters'
              : 'Complete your profile to get better opportunities'}
          </p>

          {/* Dynamic Progress Ring */}
          <div className="relative mb-3.5 flex items-center justify-center relative z-10">
            <CircularProgress pct={loadingPct ? 0 : profilePct} size={80} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-extrabold text-[17px] text-white tracking-tight">
                {loadingPct ? '…' : `${profilePct}%`}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              if (setMobileOpen) setMobileOpen(false);
              navigate('/profile');
            }}
            className="w-full bg-white font-bold text-[13px] rounded-xl py-2.5 px-4 text-[#6b21a8] hover:bg-white/95 active:scale-95 transition-all relative z-10 flex items-center justify-center gap-1.5 shadow-md"
          >
            <span>{isComplete ? 'View Profile' : 'Complete Now'}</span>
            <span className="text-sm">→</span>
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 shrink-0 z-20 print:hidden">
        <Content />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen w-64 z-50 transition-transform duration-300 print:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Content />
      </aside>
    </>
  );
};

export default Sidebar;