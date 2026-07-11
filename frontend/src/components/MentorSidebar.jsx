import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  FolderOpen, 
  Settings, 
  LogOut 
} from 'lucide-react';

const MentorSidebar = () => {
  const { logout } = useAuth();

  const links = [
    { to: '/mentor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/mentor/chat', icon: MessageSquare, label: 'Student Chat' },
    { to: '/mentor/students', icon: Users, label: 'My Students' },
    { to: '/mentor/resources', icon: FolderOpen, label: 'Resources' },
    { to: '/mentor/profile', icon: Settings, label: 'Profile Settings' },
  ];

  return (
    <aside className="w-64 bg-[#0A0A1B] border-r border-white/10 h-screen sticky top-0 flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
          Codovate <span className="text-white text-sm">Mentor</span>
        </h2>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400 shadow-[inset_4px_0_0_0_#3b82f6]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-medium"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default MentorSidebar;
