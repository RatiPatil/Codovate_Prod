import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/axios';
import BroadcastNotificationModal from '../modals/BroadcastNotificationModal';
import ApproveUsersModal from '../modals/ApproveUsersModal';

const StatCard = ({ title, value, icon, isLive }) => (
  <div className="bg-[#080812] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
    {isLive && (
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2015FF] animate-pulse shadow-[0_0_8px_#2015FF]"></span>
        <span className="text-[9px] font-bold text-[#2015FF] uppercase tracking-widest">Live</span>
      </div>
    )}
    <div className="text-3xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
    <div className="text-4xl font-black text-white tracking-tighter mb-1">
      {value.toLocaleString()}
    </div>
    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</div>
    
    {/* Subtle glow effect */}
    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#2015FF]/5 rounded-full blur-2xl group-hover:bg-[#2015FF]/10 transition-colors" />
  </div>
);

const SuperAdminDashboard = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalMentors: 0,
    totalOpportunities: 0,
    totalApplications: 0,
    loading: true
  });
  
  // Modal States
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null); // null, 'college_admin', 'company_admin'

  useEffect(() => {
    // 1. Initial Load
    api.get('/admin/super/dashboard')
      .then(res => {
        setStats(prev => ({ ...prev, ...res.data, loading: false }));
      })
      .catch(err => {
        console.error("Failed to load dashboard data", err);
        setStats(prev => ({ ...prev, loading: false }));
      });

    // 2. Real-time Listeners
    if (!socket) return;

    const handleMetricsUpdate = (data) => {
      setStats(prev => ({
        ...prev,
        totalUsers: data.totalUsers,
        totalStudents: data.totalStudents,
        totalMentors: data.totalMentors
      }));
    };

    const handleAppsUpdate = (data) => {
      setStats(prev => ({ ...prev, totalApplications: data.totalApplications }));
    };

    const handleOppsUpdate = (data) => {
      setStats(prev => ({ ...prev, totalOpportunities: data.totalOpportunities }));
    };

    socket.on('super_admin_metrics_update', handleMetricsUpdate);
    socket.on('super_admin_applications_update', handleAppsUpdate);
    socket.on('super_admin_opportunities_update', handleOppsUpdate);

    return () => {
      socket.off('super_admin_metrics_update', handleMetricsUpdate);
      socket.off('super_admin_applications_update', handleAppsUpdate);
      socket.off('super_admin_opportunities_update', handleOppsUpdate);
    };
  }, [socket]);

  if (stats.loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-[#2015FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Command Center</h1>
          <p className="text-gray-500 font-medium">Platform Health & Global Intelligence</p>
        </header>
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <StatCard title="Total Users" value={stats.totalUsers} icon="👥" isLive />
          <StatCard title="Students" value={stats.totalStudents} icon="🎓" isLive />
          <StatCard title="Mentors" value={stats.totalMentors} icon="🧑‍🏫" isLive />
          <StatCard title="Opportunities" value={stats.totalOpportunities} icon="💼" isLive />
        </div>

        {/* Action Panel & Secondary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#080812] border border-white/5 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Engagement Pipeline</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Total Applications</div>
                <div className="text-5xl font-black text-[#2015FF]">{stats.totalApplications.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Active DAU</div>
                <div className="text-5xl font-black text-white">--</div>
                <p className="text-xs text-gray-600 mt-2">Requires analytics plugin</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#2015FF] rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <h2 className="text-xl font-bold text-white mb-6 relative z-10">Quick Actions</h2>
            <div className="space-y-3 relative z-10">
              <button 
                onClick={() => setIsBroadcastOpen(true)}
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Broadcast Notification
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
              <button 
                onClick={() => setApproveTarget('college_admin')}
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Approve Colleges
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
              <button 
                onClick={() => setApproveTarget('company_admin')}
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Approve Companies
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <BroadcastNotificationModal 
        isOpen={isBroadcastOpen} 
        onClose={() => setIsBroadcastOpen(false)} 
      />
      
      <ApproveUsersModal 
        isOpen={!!approveTarget} 
        onClose={() => setApproveTarget(null)} 
        targetRole={approveTarget} 
      />
    </div>
  );
};

export default SuperAdminDashboard;
