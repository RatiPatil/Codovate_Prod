import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, Map, BookOpen, Briefcase, Users, FolderGit2,
  ClipboardList, User, FileText, Video, MessageSquare,
  Settings, X, ChevronRight,
} from 'lucide-react';
import Logo from './common/Logo';

/* ─── Sectioned Navigation matching wireframe ─── */
const NAV_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { path: '/dashboard',                 label: 'Home',         Icon: Home,          exact: true },
      { path: '/roadmap',                   label: 'Roadmap',      Icon: Map                        },
      { path: '/learning',                  label: 'Learn',        Icon: BookOpen                   },
      { path: '/opportunities/internship',  label: 'Opportunities', Icon: Briefcase,    exact: true },
      { path: '/teams',                     label: 'Teams',        Icon: Users                      },
      { path: '/projecthub',               label: 'Projects',     Icon: FolderGit2                 },
    ],
  },
  {
    title: 'CAREER',
    items: [
      { path: '/applications',   label: 'Applications', Icon: ClipboardList },
      { path: '/profile',        label: 'Portfolio',    Icon: User          },
      { path: '/resume-builder', label: 'Resume',       Icon: FileText      },
    ],
  },
  {
    title: 'COMMUNITY',
    items: [
      { path: '/mentors',    label: 'Mentorship', Icon: Video          },
      { path: '/community',  label: 'Community',  Icon: MessageSquare  },
    ],
  },
];

/* Bottom account links (no section header, just at bottom) */
const BOTTOM_ITEMS = [
  { path: '/profile',  label: 'Profile',  Icon: User     },
  { path: '/settings', label: 'Settings', Icon: Settings },
];

/* ─── isPathActive — exact or prefix, never bleeds across siblings ─── */
const checkActive = (item, pathname) => {
  if (item.exact) {
    if (item.path === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname === item.path;
  }
  return pathname === item.path || pathname.startsWith(item.path + '/');
};

/* ─── Single Nav Link Row ─── */
const NavLink = ({ item, onClick, pathname }) => {
  const navigate = useNavigate();
  const active   = checkActive(item, pathname);
  const Icon     = item.Icon;

  return (
    <button
      onClick={() => { navigate(item.path); onClick?.(); }}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-150 text-left focus:outline-none ${
        active
          ? 'bg-[#4F46E5] text-white shadow-sm font-bold'
          : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
      }`}
    >
      <Icon
        size={17}
        strokeWidth={active ? 2.2 : 1.75}
        className={active ? 'text-white shrink-0' : 'text-slate-500 shrink-0'}
      />
      <span className="truncate">{item.label}</span>
    </button>
  );
};

/* ═══════════════════════════════ SIDEBAR ═══════════════════ */
const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();

  const initials = (user?.name || 'S')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const close = () => setMobileOpen && setMobileOpen(false);

  const Content = () => (
    <div className="flex flex-col h-full bg-[#0F172A] text-white select-none overflow-hidden font-sans">

      {/* ── Logo ─────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0 border-b border-white/[0.06]">
        <button
          onClick={() => { navigate('/dashboard'); close(); }}
          className="focus:outline-none group"
        >
          <Logo responsive variant="dark" />
        </button>

        <button
          onClick={close}
          className="md:hidden text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Scrollable Nav Body ───────────────────────── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-scroll space-y-5">

        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-0.5">
            {/* Section header label */}
            <p className="px-3.5 mb-1.5 text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">
              {section.title}
            </p>

            {section.items.map(item => (
              <NavLink
                key={item.path + item.label}
                item={item}
                pathname={location.pathname}
                onClick={close}
              />
            ))}
          </div>
        ))}

      </nav>

      {/* ── Bottom: Profile + Settings + Avatar ──────── */}
      <div className="px-3 pb-4 pt-3 border-t border-white/[0.06] shrink-0 space-y-0.5">
        {BOTTOM_ITEMS.map(item => (
          <NavLink
            key={item.path + item.label}
            item={item}
            pathname={location.pathname}
            onClick={close}
          />
        ))}

        {/* User Avatar Row */}
        <button
          onClick={() => { navigate('/profile'); close(); }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl mt-2 hover:bg-white/[0.08] transition-colors focus:outline-none group"
        >
          <div
            className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
          >
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
              : initials
            }
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Student'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <ChevronRight size={13} className="text-slate-600 shrink-0" />
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-[240px] h-screen sticky top-0 shrink-0 z-20 print:hidden">
        <Content />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={close}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen w-[240px] z-50 transition-transform duration-300 ease-out print:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Content />
      </aside>
    </>
  );
};

export default Sidebar;