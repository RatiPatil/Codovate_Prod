import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  GraduationCap,
  Briefcase,
  Trophy,
  Users,
  Code2,
  BookOpen,
  ChevronRight,
  Compass,
  X,
  Bell,
  MessageSquare,
  User,
  Settings,
} from 'lucide-react';
import Logo from './common/Logo';

/* Student Navigation Config */
const NAV_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { path: '/dashboard', label: 'Home', Icon: Home, exact: true },
      { path: '/roadmap', label: 'My Roadmap', Icon: Compass },
      { path: '/learning', label: 'Learn', Icon: BookOpen },
      { path: '/opportunities/internship', label: 'Opportunities', Icon: GraduationCap },
      { path: '/mentors', label: 'Mentorship', Icon: Users },
      { path: '/teams', label: 'Teams', Icon: Users },
      { path: '/projecthub', label: 'Projects', Icon: Code2 },
    ]
  },
  {
    title: 'CAREER',
    items: [
      { path: '/applications', label: 'Applications', Icon: ChevronRight },
      { path: '/portfolio', label: 'Portfolio', Icon: Trophy },
      { path: '/resume-builder', label: 'Resume', Icon: Briefcase },
    ]
  },
  {
    title: 'PROFILE',
    items: [
      { path: '/profile', label: 'Profile', Icon: User },
      { path: '/settings', label: 'Settings', Icon: Settings },
    ]
  }
];

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();

  const isPathActive = (item) => {
    const current = location.pathname;
    if (item.exact) {
      if (item.path === '/dashboard') return current === '/dashboard' || current === '/';
      return current === item.path;
    }
    return current === item.path || current.startsWith(item.path + '/');
  };

  const initials = (user?.name || 'R')
    .split(' ')
    .map(w => w[0])
    .slice(0, 1)
    .join('')
    .toUpperCase();

  const Content = () => (
    <div className="flex flex-col h-full bg-white text-slate-700 border-r border-slate-200/80 select-none overflow-hidden font-sans">
      
      {/* Top Header: Logo + Toggle & Mobile Close */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="focus:outline-none flex items-center gap-2"
        >
          <Logo size="md" className="h-12 sm:h-14 object-contain" />
        </button>

        <button
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Vertical Navigation Links Stream */}
      <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto sidebar-scroll">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            {section.items.map((item) => {
              const active = isPathActive(item);
              const Icon = item.Icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-150 ${
                    active
                      ? 'bg-[#EBF3FF] text-[#0066FF]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-[#0066FF]' : 'text-slate-500'} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Control Bar: Notifications, Chat, Profile Avatar */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <button
          onClick={() => navigate('/community')}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          aria-label="Community Chat"
        >
          <MessageSquare size={18} />
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-[#0066FF] text-white font-bold text-xs flex items-center justify-center shadow-xs hover:opacity-90 transition-opacity"
          aria-label="Profile"
        >
          {initials}
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Navigation */}
      <aside className="hidden md:flex flex-col w-[230px] h-screen sticky top-0 shrink-0 z-20 print:hidden">
        <Content />
      </aside>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen w-[230px] z-50 transition-transform duration-300 ease-out print:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Content />
      </aside>
    </>
  );
};

export default Sidebar;