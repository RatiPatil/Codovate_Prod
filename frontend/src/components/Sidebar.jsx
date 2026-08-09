import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  GraduationCap,
  Briefcase,
  Trophy,
  Users,
  FileCheck2,
  Video,
  Code2,
  BookOpen,
  ChevronRight,
  Plus,
  Compass,
  X,
  Bell,
  MessageSquare,
} from 'lucide-react';
import Logo from './common/Logo';

/* Navigation Items matching Unstop Reference Layout */
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', Icon: Home, exact: true },
  { path: '/opportunities?type=internship', label: 'Internships', Icon: GraduationCap },
  { path: '/opportunities?type=job', label: 'Jobs', Icon: Briefcase },
  { path: '/opportunities?type=competition', label: 'Competitions', Icon: Trophy },
  { path: '/mentors', label: 'Mentorship', Icon: Users },
  { path: '/skill-assessments', label: 'Mock Tests', Icon: FileCheck2 },
  { path: '/mock-interview', label: 'Mock Interview', Icon: Video },
  { path: '/coding-practice', label: '100 Days to Code', Icon: Code2 },
  { path: '/learning', label: 'Courses', Icon: BookOpen },
  { path: '/roadmap', label: 'More', Icon: Compass, hasSub: true },
  { path: '/applications', label: 'My Activity', Icon: ChevronRight, hasSub: true },
];

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();

  const isPathActive = (item) => {
    const current = location.pathname;
    if (item.exact) return current === '/dashboard' || current === '/';
    return current.startsWith(item.path.split('?')[0]);
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
          <Logo responsive size="xs" />
        </button>

        <button
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Primary Action Button: + Post Opportunity */}
      <div className="px-4 py-2 shrink-0">
        <button
          onClick={() => navigate('/opportunities')}
          className="w-full h-11 bg-[#E0EEFF] hover:bg-[#D0E4FF] text-[#0066FF] font-bold rounded-2xl flex items-center justify-center gap-2 text-sm transition-all duration-150 active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>+ Post</span>
        </button>
      </div>

      {/* Vertical Navigation Links Stream */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto sidebar-scroll">
        {NAV_ITEMS.map((item) => {
          const active = isPathActive(item);
          const Icon = item.Icon;
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-150 ${
                active
                  ? 'bg-[#EBF3FF] text-[#0066FF]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-[#0066FF]' : 'text-slate-500'} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.hasSub && (
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              )}
            </Link>
          );
        })}
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
      {/* Desktop Fixed Left Navigation (Width: 230px) */}
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