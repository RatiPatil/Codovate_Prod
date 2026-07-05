import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/opportunities', label: 'Opportunities', icon: '🔍' },
  { path: '/applications', label: 'Applications', icon: '📋' },
  { path: '/teams', label: 'Teams', icon: '🤝' },
  { path: '/mentors', label: 'Mentors', icon: '👨‍🏫' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { path: '/resume', label: 'Resume Builder', icon: '📄' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isConnected, socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_notification', () => {
      setUnreadCount(prev => prev + 1);
    });
    return () => socket.off('new_notification');
  }, [socket]);

  useEffect(() => {
    const handler = () => setUnreadCount(0);
    window.addEventListener('notifications_read', handler);
    return () => window.removeEventListener('notifications_read', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const countRes = await api.get('/notifications/unread/count');
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error("Failed to load notifications count", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Content = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="text-white font-bold text-lg">Codovate</span>

        </div>
      </div>

      {/* User */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-primary/90 text-white shadow-[0_4px_20px_rgba(32,21,255,0.4)] backdrop-blur-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/10 hover:translate-x-1'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.path === '/notifications' && unreadCount > 0 && (
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0"></span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all duration-300 hover:translate-x-1"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-l border-white/10 h-screen sticky top-0 shrink-0 z-20 print:hidden">
        <Content />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
      )}
      
      {/* Mobile Drawer */}
      <aside className={`md:hidden fixed top-0 right-0 h-screen w-64 glass-panel border-l border-white/10 z-50 shadow-[-4px_0_24px_rgba(0,0,0,0.5)] transition-transform duration-300 print:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <Content />
      </aside>
    </>
  );
};

export default Sidebar;