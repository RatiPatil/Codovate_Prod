import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { formatDate } from '../utils/dateUtils';
import { showAlert, showConfirm } from '../utils/uiUtils';

const statusStyles = {
  Applied: 'bg-primary/10 text-primary border-primary/20',
  'Under Review': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Selected: 'bg-green-500/10 text-green-400 border-green-500/20',
  Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  'External Link Opened': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const typeColors = {
  Internship: 'text-blue-400',
  Hackathon: 'text-purple-400',
  Competition: 'text-yellow-400',
};

const Applications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const { socket } = useSocket();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const fetchApps = useCallback(() => {
    api.get('/applications/my')
      .then(res => setApps(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  useEffect(() => {
    if (!socket) return;
    socket.on('application_update', (data) => {
      if (data.type === 'status_change') {
        setApps(prev => prev.map(a =>
          a.id === data.application_id ? { ...a, status: data.status } : a
        ));
        showToast(`🔔 Status updated to: ${data.status}`, 'success');
      }
    });
    socket.on('application_withdrawn', ({ application_id }) => {
      setApps(prev => prev.filter(a => a.id !== application_id));
    });
    return () => {
      socket.off('application_update');
      socket.off('application_withdrawn');
    };
  }, [socket]);

  const handleWithdraw = async (appId) => {
    if (!await showConfirm('Are you sure you want to withdraw this application? This cannot be undone.')) return;
    setWithdrawing(appId);
    try {
      await api.delete(`/applications/${appId}`);
      setApps(prev => prev.filter(a => a.id !== appId));
      showToast('Application withdrawn successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to withdraw.', 'error');
    } finally {
      setWithdrawing(null);
    }
  };

  const counts = {
    total: apps.length,
    applied: apps.filter(a => a.status === 'Applied').length,
    review: apps.filter(a => a.status === 'Under Review').length,
    selected: apps.filter(a => a.status === 'Selected').length,
    rejected: apps.filter(a => a.status === 'Rejected').length,
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center h-full min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10 max-w-7xl mx-auto w-full">
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl glass-panel ${
          toast.type === 'success' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-8 text-center md:text-left relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          <span className="text-gradient">My Applications</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">Track all your opportunity applications in real-time</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10 relative z-10">
        {[
          { label: 'Total', value: counts.total, color: 'text-white' },
          { label: 'Pending', value: counts.applied, color: 'text-primary' },
          { label: 'In Review', value: counts.review, color: 'text-yellow-400' },
          { label: 'Selected', value: counts.selected, color: 'text-green-400' },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 text-center">
            <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Applications List */}
      {apps.length === 0 ? (
        <div className="text-center py-24 glass-card border-dashed">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-400 text-sm mb-4">No applications yet.</p>
          <Link to="/opportunities" className="btn-primary text-sm inline-block">
            Browse opportunities
          </Link>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            {apps.map(app => (
              <div
                key={app.id}
                className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">
                        {app.title}
                      </h3>
                      <p className="text-gray-400 text-sm font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        {app.company}
                      </p>
                    </div>
                  </div>
                  
                  {app.is_external && (
                    <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-xs text-blue-400">
                        <span className="font-bold">Note:</span> You opened the original application page. Since this opportunity is hosted externally, Codovate cannot track whether your application was successfully submitted.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-auto">
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Applied on {formatDate(app.applied_at, {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Deadline</p>
                    <p className="text-gray-300 text-xs font-semibold">
                      {app.deadline ? formatDate(app.deadline, { day: 'numeric', month: 'short' }) : '—'}
                    </p>
                  </div>
                  <span className={`text-xs px-4 py-1.5 rounded-full border font-bold shadow-sm backdrop-blur-sm ${statusStyles[app.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {app.status}
                  </span>
                  {app.status === 'Applied' && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      disabled={withdrawing === app.id}
                      title="Withdraw application"
                      className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    >
                      {withdrawing === app.id ? (
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;