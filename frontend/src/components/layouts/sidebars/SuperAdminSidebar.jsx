import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  LayoutDashboard, 
  LineChart, 
  Users, 
  Briefcase, 
  FileText, 
  Building2, 
  GraduationCap, 
  UserCheck, 
  Rocket, 
  Award, 
  Image as ImageIcon, 
  Bell, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  UserSquare2
} from 'lucide-react';

const NAV_CONFIG = {
  super_admin: [
    {
      label: 'DASHBOARD',
      items: [
        { path: '/admin',              label: 'Overview',       icon: LayoutDashboard, exact: true },
        { path: '/admin/analytics',    label: 'Analytics',      icon: LineChart },
      ]
    },
    {
      label: 'USER MANAGEMENT',
      items: [
        { path: '/admin/users',        label: 'Users',          icon: Users },
        { path: '/admin/students',     label: 'Students',       icon: UserSquare2 },
        { path: '/admin/colleges',     label: 'Colleges',       icon: GraduationCap },
        { path: '/admin/companies',    label: 'Companies',      icon: Building2 },
        { path: '/admin/mentors',      label: 'Mentors',        icon: UserCheck },
      ]
    },
    {
      label: 'ECOSYSTEM',
      items: [
        { path: '/admin/opportunities',label: 'Opportunities',  icon: Briefcase },
        { path: '/admin/applications', label: 'Applications',   icon: FileText },
        { path: '/admin/projects',     label: 'Projects',       icon: Rocket },
        { path: '/admin/certificates', label: 'Certificates',   icon: Award },
        { path: '/admin/content',      label: 'Content Mgmt',   icon: ImageIcon },
      ]
    },
    {
      label: 'SYSTEM & SETTINGS',
      items: [
        { path: '/admin/notifications',label: 'Notifications',  icon: Bell },
        { path: '/admin/settings',     label: 'Platform Settings',icon: Settings },
        { path: '/admin/system',       label: 'System Health',  icon: ShieldAlert },
        { path: '/admin/audit',        label: 'Audit Logs',     icon: ShieldAlert },
      ]
    }
  ],
  college_admin: [
    {
      label: 'MY COLLEGE',
      items: [
        { path: '/admin',              label: 'Overview',       icon: LayoutDashboard, exact: true },
        { path: '/admin/users',        label: 'Students',       icon: Users },
        { path: '/admin/applications', label: 'Applications',   icon: FileText },
        { path: '/admin/projects',     label: 'Projects',       icon: Rocket },
        { path: '/admin/certificates', label: 'Certificates',   icon: Award },
      ]
    }
  ],
  company_admin: [
    {
      label: 'RECRUITING',
      items: [
        { path: '/admin',              label: 'Overview',       icon: LayoutDashboard, exact: true },
        { path: '/admin/opportunities',label: 'My Listings',    icon: Briefcase },
        { path: '/admin/applications', label: 'Applicants',     icon: FileText },
      ]
    }
  ],
};

NAV_CONFIG['admin'] = NAV_CONFIG['super_admin'];

const ROLE_META = {
  super_admin:   { label: 'Super Admin',    color: '#3B82F6', bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  admin:         { label: 'Admin',          color: '#F59E0B', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  college_admin: { label: 'College Admin',  color: '#8B5CF6', bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
  company_admin: { label: 'Company Admin',  color: '#10B981', bg: 'bg-green-500/10',  border: 'border-green-500/20' },
};

const SidebarContent = ({ setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role || 'admin';
  const sections = NAV_CONFIG[role] || NAV_CONFIG['admin'];
  const meta = ROLE_META[role] || ROLE_META['admin'];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === '/admin' || location.pathname === '/admin/';
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/admin-login';
  };

  return (
    <div className="flex flex-col h-full bg-[#030308] border-r border-white/5 relative overflow-hidden select-none">
      <div className="px-6 py-6 border-b border-white/5 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0"
            style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)` }}>
            <span className="text-white font-black text-xl">C</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-black text-lg tracking-tight leading-none">CODOVATE</p>
            <p className="text-[11px] font-bold uppercase tracking-widest mt-1 truncate" style={{ color: meta.color }}>
              ADMIN PANEL
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 border-b border-white/5 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${meta.bg} border ${meta.border} flex items-center justify-center font-bold text-lg shrink-0`}
            style={{ color: meta.color }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-gray-200 text-sm font-bold truncate leading-none">{user?.name || 'Administrator'}</p>
            <p className="text-xs text-gray-500 font-medium truncate mt-1">
              {meta.label}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 px-3 relative z-10 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const active = isActive(item.path, item.exact);
                const Icon = item.icon;
                return (
                  <li key={itemIdx}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen?.(false)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
                        active 
                          ? 'bg-blue-500/10 text-blue-500' 
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-colors ${active ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-300'}`} />
                        {item.label}
                      </div>
                      {active && (
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 border-t border-white/5 shrink-0 z-10 bg-[#030308]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-bold text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const AdminSidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-[#12121A] border border-white/10 rounded-xl flex items-center justify-center text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-[100dvh] w-[260px] z-[80]
        transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        lg:translate-x-0 lg:sticky lg:top-0
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden absolute top-4 -right-12 w-10 h-10 bg-[#12121A] border border-white/10 rounded-xl flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <SidebarContent setMobileOpen={setMobileOpen} />
      </aside>
    </>
  );
};

export default AdminSidebar;
