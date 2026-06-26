import React, { useState, useEffect } from 'react';
import MentorLayout from '../layouts/MentorLayout';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import PendingRequestsModal from '../modals/PendingRequestsModal';

const StatCard = ({ title, value, icon, isLive }) => (
  <div className="bg-[#080812] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
    {isLive && (
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06B6D4]"></span>
        <span className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest">Live</span>
      </div>
    )}
    <div className="text-3xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
    <div className="text-4xl font-black text-white tracking-tighter mb-1">
      {value.toLocaleString()}
    </div>
    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</div>
    
    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
  </div>
);

const MentorDashboard = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalSessions: 0,
    pendingRequests: 0,
    completedSessions: 0,
    averageRating: "4.8", // Mocked until feedback DB is structured
    loading: true
  });
  
  // Modal State
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);

  useEffect(() => {
    // 1. Initial Load
    api.get('/admin/mentor/dashboard')
      .then(res => {
        setStats(prev => ({ ...prev, ...res.data, loading: false }));
      })
      .catch(err => {
        console.error("Failed to load mentor dashboard data", err);
        setStats(prev => ({ ...prev, loading: false }));
      });

    // 2. Real-time Listeners
    if (!socket || !user) return;

    const handleSessionUpdate = (data) => {
      setStats(prev => ({
        ...prev,
        ...data
      }));
    };

    socket.on(`mentor_session_update`, handleSessionUpdate);

    return () => {
      socket.off(`mentor_session_update`, handleSessionUpdate);
    };
  }, [socket, user]);

  if (stats.loading) {
    return (
      <MentorLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </MentorLayout>
    );
  }

  return (
    <MentorLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Mentorship Overview</h1>
          <p className="text-gray-500 font-medium">Session Management & Student Guidance</p>
        </header>
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <StatCard title="Upcoming Sessions" value={stats.totalSessions - stats.completedSessions} icon="🎥" isLive />
          <StatCard title="Pending Requests" value={stats.pendingRequests} icon="⏳" isLive />
          <StatCard title="Completed Sessions" value={stats.completedSessions} icon="✅" isLive />
          <StatCard title="Average Rating" value={stats.averageRating} icon="⭐" isLive={false} />
        </div>

        {/* Action Panel & Secondary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#080812] border border-white/5 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Recent Feedback Summary</h2>
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-start gap-4">
                <div className="text-2xl">⭐</div>
                <div>
                  <p className="text-gray-300 font-medium italic">"Amazing session! The mentor really helped me structure my resume for off-campus placements."</p>
                  <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">- Student from SVERI</p>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-start gap-4">
                <div className="text-2xl">⭐</div>
                <div>
                  <p className="text-gray-300 font-medium italic">"Very clear explanations of system design concepts."</p>
                  <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">- Student from VIT</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-cyan-600 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <h2 className="text-xl font-bold text-white mb-6 relative z-10">Quick Actions</h2>
            <div className="space-y-3 relative z-10">
              <button 
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Open Availability
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
              <button 
                onClick={() => setRequestsModalOpen(true)}
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Review Pending Requests
                <span className="bg-white text-cyan-700 text-xs px-2 py-0.5 rounded-full font-black">{stats.pendingRequests}</span>
              </button>
              <button 
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Review Feedback
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <PendingRequestsModal 
        isOpen={requestsModalOpen} 
        onClose={() => setRequestsModalOpen(false)} 
      />
    </MentorLayout>
  );
};

export default MentorDashboard;
