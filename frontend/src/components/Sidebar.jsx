import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Home,
  Map,
  BookOpen,
  Briefcase,
  Users,
  FolderGit2,
  ClipboardList,
  User,
  FileText,
  Video,
  MessageSquare,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import Logo from './common/Logo';

/* Categorized Navigation Order matching Product Shell Requirements */
const NAV_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { path: '/dashboard',     label: 'Home',          Icon: Home },
      { path: '/roadmap',       label: 'My Roadmap',    Icon: Map },
      { path: '/learning',      label: 'Learn',         Icon: BookOpen },
      { path: '/opportunities', label: 'Opportunities', Icon: Briefcase },
      { path: '/teams',         label: 'Teams',         Icon: Users },
      { path: '/projecthub',    label: 'Projects',      Icon: FolderGit2 },
    ],
  },
  {
    title: 'CAREER',
    items: [
      { path: '/applications',  label: 'Applications',  Icon: ClipboardList },
      { path: '/profile',       label: 'Portfolio',     Icon: User },
      { path: '/resume-builder',label: 'Resume',        Icon: FileText },
    ],
  },
  {
    title: 'COMMUNITY',
    items: [
      { path: '/mentors',       label: 'Mentorship',    Icon: Video },
      { path: '/community',     label: 'Community',     Icon: MessageSquare },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { path: '/profile',       label: 'Profile',       Icon: User },
      { path: '/settings',      label: 'Settings',      Icon: Settings },
    ],
  },
];

/* ── Circular Progress Ring ────────────────────────────── */
const CircularProgress = ({ pct = 0, size = 76 }) => {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#818CF8"
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

/* ── Main Sidebar Component ────────────────────────────── */
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

  /* Real-time profile update listener */
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail?.completion !== undefined) {
        setProfilePct(Number(e.detail.completion) || 0);
      }
    };
    window.addEventListener('profile_updated', handleUpdate);
    return () => window.removeEventListener('profile_updated', handleUpdate);
  }, []);

  const isPathActive = (itemPath, sectionTitle, label) => {
    const current = location.pathname;
    if (itemPath === '/dashboard') return current === '/dashboard' || current === '/';
    if (itemPath === '/profile') {
      if (sectionTitle === 'CAREER' && label === 'Portfolio') return current === '/profile';
      if (sectionTitle === 'ACCOUNT' && label === 'Profile') return current === '/profile';
      return current === '/profile';
    }
    return current.startsWith(itemPath);
  };

  const isComplete = profilePct >= 100;

  /* Sidebar Content */
  const Content = () => (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-100 border-r border-slate-800/80 select-none overflow-hidden font-sans">
      
      {/* Top Header: Codovate Logo & Branding */}
      <div className="px-5 pt-6 pb-4 flex flex-col items-start justify-center relative shrink-0 border-b border-slate-800/60">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => navigate('/dashboard')}
            className="focus:outline-none text-left"
          >
            <Logo responsive variant="dark" size="xs" />
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-[11px] font-medium text-slate-400 mt-2 tracking-wide">
          Learn. Build. Compete. Grow.
        </p>
      </div>

      {/* Categorized Navigation Stream */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto sidebar-scroll">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={section.title || idx} className="space-y-1">
            <h3 className="px-3 text-[11px] font-bold text-slate-400/80 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-0.5 mt-1">
              {section.items.map(({ path, label, Icon }) => {
                const active = isPathActive(path, section.title, label);
                return (
                  <Link
                    key={`${section.title}-${label}`}
                    to={path}
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-lg font-medium text-[13.5px] transition-all duration-150 ${
                      active
                        ? 'bg-[#4F46E5] text-white shadow-sm shadow-indigo-900/40 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2 : 1.75} className={active ? 'text-white' : 'text-slate-400'} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile Upgrade Card — Anchored to bottom */}
      <div className="p-3 shrink-0 mt-auto border-t border-slate-800/60 bg-[#0B0F19]/50">
        <div className="rounded-xl p-3.5 bg-slate-900/90 border border-slate-800 text-white relative overflow-hidden flex flex-col items-center text-center shadow-sm">
          {/* Subtle Accent Radial Glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-600/15 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-1.5 mb-1 relative z-10">
            <Sparkles size={14} className="text-indigo-400" />
            <p className="font-bold text-[13.5px] text-white">
              {isComplete ? 'Profile Ready ✓' : 'Upgrade Profile'}
            </p>
          </div>
          <p className="text-[11px] leading-snug mb-3 text-slate-400 max-w-[190px] relative z-10">
            {isComplete
              ? 'Your profile is 100% complete and ready for recruiters'
              : 'Complete your details to unlock relevant opportunities'}
          </p>

          {/* Dynamic Progress Ring */}
          <div className="relative mb-3 flex items-center justify-center z-10">
            <CircularProgress pct={loadingPct ? 0 : profilePct} size={70} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-bold text-[14px] text-white tracking-tight">
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
            className="w-full bg-[#4F46E5] hover:bg-indigo-600 font-bold text-[12.5px] rounded-lg py-2 px-3 text-white transition-all relative z-10 flex items-center justify-center gap-1 shadow-xs active:scale-[0.98]"
          >
            <span>{isComplete ? 'View Profile' : 'Complete Now'}</span>
            <span className="text-xs">→</span>
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Navigation (Width: 245px) */}
      <aside className="hidden md:flex flex-col w-[245px] h-screen sticky top-0 shrink-0 z-20 print:hidden">
        <Content />
      </aside>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen w-[245px] z-50 transition-transform duration-300 ease-out print:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Content />
      </aside>
    </>
  );
};

export default Sidebar;