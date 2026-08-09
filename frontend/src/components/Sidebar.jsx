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
  ChevronDown,
  Plus,
  Compass,
  X,
  Bell,
  MessageSquare,
  Brain,
  HelpCircle,
  PenTool,
  Mic,
  Globe,
  PartyPopper,
  Book,
  PlaySquare,
  Lock,
  Terminal,
  Activity,
  CheckCheck,
  Waypoints,
  Library,
  Calendar,
  Award,
  History,
  Heart,
  Bookmark
} from 'lucide-react';
import Logo from './common/Logo';
import toast from 'react-hot-toast';

/* Navigation Items — use clean URL segments, NOT query params */
const NAV_ITEMS = [
  { path: '/dashboard',                  label: 'Home',          Icon: Home,         exact: true  },
  { path: '/opportunities/internship',   label: 'Internships',   Icon: GraduationCap, exact: true },
  { path: '/opportunities/job',          label: 'Jobs',          Icon: Briefcase,     exact: true },
  { path: '/opportunities/competition',  label: 'Competitions',  Icon: Trophy,        exact: true },
  { path: '/mentors',                    label: 'Mentorship',    Icon: Users                      },
  { path: '/skill-assessments',          label: 'Mock Tests',    Icon: FileCheck2                 },
  { path: '/learning',                   label: 'Courses',       Icon: BookOpen                   },
  { isToggle: true, id: 'more',          label: 'More',          Icon: Compass,      hasSub: true },
  { isToggle: true, id: 'activity',      label: 'My Activity',   Icon: Activity,     hasSub: true },
];

const MORE_ITEMS = [
  { label: 'Practice', Icon: Brain },
  { label: 'Hackathons', Icon: Terminal },
  { label: 'Quizzes', Icon: HelpCircle },
  { label: 'Scholarships', Icon: GraduationCap },
  { label: 'Workshops', Icon: PenTool },
  { label: 'Conferences', Icon: Mic },
  { label: 'Cultural Events', Icon: Globe },
  { label: 'College Festivals', Icon: PartyPopper },
  { label: 'Articles', Icon: Book },
  { label: 'Resources', Icon: PlaySquare },
];

const ACTIVITY_ITEMS = [
  { label: 'My Applications', Icon: CheckCheck },
  { label: 'My Rounds', Icon: Waypoints },
  { label: 'My Courses', Icon: Library },
  { label: 'My Sessions', Icon: Calendar },
  { label: 'My Certificates', Icon: Award },
  { label: 'Recently Viewed', Icon: History },
  { label: 'Watchlist', Icon: Heart },
  { label: 'Bookmarked Questions', Icon: Bookmark },
];

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const isPathActive = (item) => {
    if (item.isToggle) return false;
    const current = location.pathname;
    // Exact match — used for dashboard and all opportunity types (prevents triple highlight)
    if (item.exact) {
      if (item.path === '/dashboard') return current === '/dashboard' || current === '/';
      return current === item.path;
    }
    // Prefix match for non-exact items (e.g. /learning matches /learning/course/:id)
    return current === item.path || current.startsWith(item.path + '/');
  };

  const initials = (user?.name || 'R')
    .split(' ')
    .map(w => w[0])
    .slice(0, 1)
    .join('')
    .toUpperCase();

  const Content = () => (
    <div className="flex flex-col h-full bg-white text-slate-700 border-r border-slate-200/80 select-none font-sans relative">
      
      {/* Top Header: Logo + Toggle & Mobile Close */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="focus:outline-none flex items-center gap-2"
        >
          <Logo size="lg" className="h-14 sm:h-16 object-contain" />
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
      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          if (item.isToggle) {
            const isOpen = item.id === 'more' ? isMoreOpen : isActivityOpen;
            const toggle = () => item.id === 'more' ? setIsMoreOpen(!isMoreOpen) : setIsActivityOpen(!isActivityOpen);
            const subItems = item.id === 'more' ? MORE_ITEMS : ACTIVITY_ITEMS;

            return (
              <div key={item.id} className="relative">
                <button
                  onClick={toggle}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-150 ${isOpen ? 'bg-slate-100/80 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <item.Icon size={19} strokeWidth={1.8} className={isOpen ? 'text-slate-900' : 'text-slate-500'} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className={isOpen ? 'text-slate-900' : 'text-slate-400'} />
                </button>
                {isOpen && (
                  <div className="absolute left-[102%] top-0 w-60 bg-white border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] rounded-3xl py-2 z-[100] animate-fadeIn">
                    {subItems.map(subItem => (
                      <button
                        key={subItem.label}
                        onClick={() => toast('This feature is currently under development.', { icon: '🚧' })}
                        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <subItem.Icon size={18} strokeWidth={1.8} className="text-slate-500" />
                          <span className="truncate">{subItem.label}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                          <Lock size={8} /> Dev
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

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