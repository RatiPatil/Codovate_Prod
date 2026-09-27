import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CollegeAdminLayout from '../layouts/CollegeAdminLayout';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import SendNoticeModal from '../modals/SendNoticeModal';

const StatCard = ({ title, value, icon }) => (
  <div className="bg-[#080812] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
    <div className="flex justify-between items-start mb-4">
      <div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
    </div>
    <div className="text-4xl font-black text-white tracking-tighter mb-1">
      {value.toLocaleString()}
    </div>
    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</div>
    
    {/* Subtle glow effect */}
    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
  </div>
);

const CollegeAdminDashboard = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalProjects: 0,
    totalCertificates: 0,
    loading: true
  });
  
  // Modal State
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  const handleGenerateReports = () => {
    // In a real implementation, you'd fetch the CSV from backend or convert local data
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Department,Projects,Certificates\nAlice Smith,alice@college.edu,Computer Science,3,2\nBob Johnson,bob@college.edu,Information Technology,1,0";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_outcomes_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
      // 1. Initial Load
    api.get('/college-admin/dashboard')
      .then(res => {
        setStats(prev => ({ ...prev, ...res.data, loading: false }));
      })
      .catch(err => {
        console.error("Failed to load college dashboard data", err);
        setStats(prev => ({ ...prev, loading: false }));
      });

    // 2. Real-time Listeners
    if (!socket || !user?.college_id) return;

    const handleUpdate = (data) => {
      setStats(prev => ({
        ...prev,
        ...data
      }));
    };

    socket.on(`college_metrics_update`, handleUpdate);

    return () => {
      socket.off(`college_metrics_update`, handleUpdate);
    };
  }, [socket, user]);

  if (stats.loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Digital Campus</h1>
          <p className="text-gray-500 font-medium">Student Outcomes & Performance Metrics</p>
        </header>
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <StatCard title="Total Students" value={stats.totalStudents} icon="🎓" isLive />
          <StatCard title="Active Faculty" value={stats.totalFaculty} icon="👨‍🏫" isLive />
          <StatCard title="Projects Built" value={stats.totalProjects} icon="💻" isLive />
          <StatCard title="Certificates Earned" value={stats.totalCertificates} icon="📜" isLive />
        </div>

        {/* Action Panel & Secondary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#080812] border border-white/5 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Placement Readiness</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Hackathon Participants</div>
                <div className="text-5xl font-black text-emerald-500">{stats.hackathonParticipants || 0}</div>
                <p className="text-xs text-gray-600 mt-2">Active builders</p>
              </div>
              <div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Placement Ready Score</div>
                <div className="text-5xl font-black text-white">{stats.avgReadiness || 0}%</div>
                <p className="text-xs text-gray-600 mt-2">Average across students</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-emerald-600 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <h2 className="text-xl font-bold text-white mb-6 relative z-10">Quick Actions</h2>
            <div className="space-y-3 relative z-10">
              <button 
                onClick={() => setNoticeModalOpen(true)}
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Send Notice
              </button>
              <button 
                onClick={() => navigate('/admin/events')}
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Publish Event
              </button>
              <button 
                onClick={handleGenerateReports}
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Generate Reports
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <SendNoticeModal 
        isOpen={noticeModalOpen} 
        onClose={() => setNoticeModalOpen(false)} 
      />
    </div>
  );
};

export default CollegeAdminDashboard;
