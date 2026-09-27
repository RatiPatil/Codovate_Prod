import React, { useState, useEffect, useMemo } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import api from '../../api/axios';
import { showAlert } from '../../utils/uiUtils';
import { formatDate } from '../../utils/dateUtils';

const SuperAdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filterTab, setFilterTab] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/applications');
      setApplications(res.data);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/applications/${id}/status`, { status });
      setApplications(p => p.map(a => a.id === id ? { ...a, status } : a));
      showAlert(`Application status updated to ${status}`);
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp({ ...selectedApp, status });
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to update status');
    }
  };

  const filteredApps = useMemo(() => {
    if (filterTab === 'pending') {
      return applications.filter(a => a.status === 'Applied' || a.status === 'Under Review');
    }
    if (filterTab === 'selected') {
      return applications.filter(a => a.status === 'Selected');
    }
    if (filterTab === 'rejected') {
      return applications.filter(a => a.status === 'Rejected');
    }
    return applications;
  }, [applications, filterTab]);

  const columns = [
    { 
      header: 'Applicant', 
      render: (row) => (
        <div>
          <p className="font-bold text-white">{row.student_name}</p>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{row.student_email}</p>
        </div>
      )
    },
    { 
      header: 'Opportunity', 
      render: (row) => (
        <div>
          <p className="font-bold text-white">{row.opportunity_title}</p>
          <p className="text-[10px] text-[#2015FF] font-bold tracking-wide uppercase mt-0.5">{row.company}</p>
        </div>
      )
    },
    { 
      header: 'Status', 
      render: (row) => {
        const sc = {
          'Applied': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          'Under Review': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          'Selected': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20'
        };
        const colorClass = sc[row.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase border ${colorClass}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Change Status',
      render: (row) => (
        <select 
          value={row.status} 
          onChange={e => updateStatus(row.id, e.target.value)}
          className="bg-[#0d0d1a] border border-white/10 rounded-lg py-1.5 px-3 text-xs font-bold text-gray-300 focus:outline-none focus:border-[#2015FF] [&>option]:bg-[#0d0d1a]"
        >
          {['Applied', 'Under Review', 'Selected', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <button 
          onClick={() => setSelectedApp(row)}
          className="px-3 py-1 bg-[#2015FF]/10 hover:bg-[#2015FF]/20 text-[#6060FF] border border-[#2015FF]/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
        >
          <span>👁️</span> View
        </button>
      )
    }
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto relative">
      
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'all' ? 'bg-[#2015FF] text-white shadow-lg shadow-[#2015FF]/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          All Applications
        </button>
        <button
          onClick={() => setFilterTab('pending')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setFilterTab('selected')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'selected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          Selected
        </button>
      </div>

      <AdminDataTable 
        title="Manage Applications"
        data={filteredApps}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by student name, email or opportunity..."
        searchableKeys={['student_name', 'student_email', 'opportunity_title', 'company']}
      />

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedApp(null)} />
          <div className="relative bg-[#080812] border border-white/10 p-8 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-[modal-slide-up_0.2s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>📄</span> Application Details
              </h2>
              <button 
                onClick={() => setSelectedApp(null)} 
                className="w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Applicant</p>
                <p className="text-white font-bold">{selectedApp.student_name}</p>
                <p className="text-gray-400 text-sm">{selectedApp.student_email}</p>
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Opportunity</p>
                <p className="text-white font-bold">{selectedApp.opportunity_title}</p>
                <p className="text-[#6060FF] text-sm font-semibold">{selectedApp.company}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Applied Date</p>
                  <p className="text-white text-sm font-bold">
                    {formatDate(selectedApp.applied_at || selectedApp.created_at, {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Status</p>
                  <select 
                    value={selectedApp.status} 
                    onChange={e => updateStatus(selectedApp.id, e.target.value)}
                    className="w-full bg-[#0d0d1a] border border-white/10 rounded-lg py-2 px-3 text-sm font-bold text-gray-300 focus:outline-none focus:border-[#2015FF] [&>option]:bg-[#0d0d1a]"
                  >
                    {['Applied', 'Under Review', 'Selected', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              
              {selectedApp.answers && Object.keys(selectedApp.answers).length > 0 && (
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Custom Answers</p>
                  <div className="space-y-4">
                    {Object.entries(selectedApp.answers).map(([q, a]) => (
                      <div key={q}>
                        <p className="text-gray-400 text-xs mb-1.5 font-bold">{q}</p>
                        <p className="text-white text-sm bg-black/40 p-3 rounded-lg border border-white/5">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminApplications;
