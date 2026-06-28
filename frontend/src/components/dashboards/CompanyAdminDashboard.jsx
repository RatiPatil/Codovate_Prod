import React, { useState, useEffect } from 'react';
import CompanyAdminLayout from '../layouts/CompanyAdminLayout';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import PostOpportunityModal from '../modals/PostOpportunityModal';

const StatCard = ({ title, value, icon, isLive }) => (
  <div className="bg-[#080812] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
    {isLive && (
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#F59E0B]"></span>
        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Live</span>
      </div>
    )}
    <div className="text-3xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
    <div className="text-4xl font-black text-white tracking-tighter mb-1">
      {value.toLocaleString()}
    </div>
    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</div>
    
    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
  </div>
);

const CompanyAdminDashboard = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    activeJobs: 0,
    activeInternships: 0,
    totalApplications: 0,
    shortlistedCandidates: 0,
    selectedCandidates: 0,
    loading: true
  });
  
  // Modal States
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postType, setPostType] = useState('job');

  const handleDownloadCSV = () => {
    // In a real implementation, you'd fetch the CSV from backend or convert local data
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Status,AppliedRole\nJane Doe,jane@example.com,Selected,Frontend Engineer\nJohn Smith,john@example.com,Shortlisted,Backend Intern";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "candidates_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // 1. Initial Load
    api.get('/admin/company/dashboard')
      .then(res => {
        setStats(prev => ({ ...prev, ...res.data, loading: false }));
      })
      .catch(err => {
        console.error("Failed to load company dashboard data", err);
        setStats(prev => ({ ...prev, loading: false }));
      });

    // 2. Real-time Listeners
    if (!socket || !user) return;

    const handleMetricsUpdate = (data) => {
      setStats(prev => ({
        ...prev,
        activeJobs: data.jobs !== undefined ? data.jobs : prev.activeJobs,
        activeInternships: data.internships !== undefined ? data.internships : prev.activeInternships
      }));
    };

    const handleAppsUpdate = (data) => {
      setStats(prev => ({
        ...prev,
        totalApplications: data.total !== undefined ? data.total : prev.totalApplications,
        shortlistedCandidates: data.shortlisted !== undefined ? data.shortlisted : prev.shortlistedCandidates,
        selectedCandidates: data.selected !== undefined ? data.selected : prev.selectedCandidates
      }));
    };

    socket.on(`company_metrics_update`, handleMetricsUpdate);
    socket.on(`company_applications_update`, handleAppsUpdate);

    return () => {
      socket.off(`company_metrics_update`, handleMetricsUpdate);
      socket.off(`company_applications_update`, handleAppsUpdate);
    };
  }, [socket, user]);

  if (stats.loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Recruitment Pipeline</h1>
          <p className="text-gray-500 font-medium">Talent Sourcing & Candidate Management</p>
        </header>
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <StatCard title="Active Jobs" value={stats.activeJobs} icon="💼" isLive />
          <StatCard title="Active Internships" value={stats.activeInternships} icon="🚀" isLive />
          <StatCard title="Applications" value={stats.totalApplications} icon="📥" isLive />
          <StatCard title="Shortlisted" value={stats.shortlistedCandidates} icon="⭐" isLive />
        </div>

        {/* Action Panel & Secondary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#080812] border border-white/5 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Candidate Funnel</h2>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Total Applied</div>
                <div className="text-4xl font-black text-amber-500">{stats.totalApplications}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Interviewing</div>
                <div className="text-4xl font-black text-white">--</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Selected</div>
                <div className="text-4xl font-black text-green-500">{stats.selectedCandidates}</div>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
                <div className="bg-amber-500 h-full" style={{ width: '40%' }}></div>
                <div className="bg-white/40 h-full" style={{ width: '20%' }}></div>
                <div className="bg-green-500 h-full" style={{ width: '10%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">
                <span>Applied</span>
                <span>Shortlisted</span>
                <span>Hired</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-amber-600 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <h2 className="text-xl font-bold text-white mb-6 relative z-10">Quick Actions</h2>
            <div className="space-y-3 relative z-10">
              <button 
                onClick={() => { setPostType('job'); setPostModalOpen(true); }}
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Post New Job
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
              <button 
                onClick={() => { setPostType('internship'); setPostModalOpen(true); }}
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Post Internship
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
              <button 
                onClick={handleDownloadCSV}
                className="w-full bg-black/20 hover:bg-black/40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-left flex items-center justify-between group"
              >
                Download Candidates
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">↓</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <PostOpportunityModal 
        isOpen={postModalOpen} 
        onClose={() => setPostModalOpen(false)} 
        initialType={postType} 
      />
    </div>
  );
};

export default CompanyAdminDashboard;
