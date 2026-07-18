import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { formatDate } from '../utils/dateUtils';
import { showConfirm, showAlert } from '../utils/uiUtils';
import SkeletonLoader from '../components/common/SkeletonLoader';

const KANBAN_STAGES = [
  'Applied',
  'Under Review',
  'Online Assessment',
  'Interview',
  'Offer',
  'Accepted',
  'Rejected'
];

const statusStyles = {
  Applied: 'bg-primary/10 text-primary border-primary/20',
  'Under Review': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Online Assessment': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Interview: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Offer: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
  Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  'External Link Opened': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const TrackerModal = ({ app, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    status: app.status || 'Applied',
    notes: app.notes || '',
    follow_up_date: app.follow_up_date ? new Date(app.follow_up_date.seconds ? app.follow_up_date.seconds * 1000 : app.follow_up_date).toISOString().split('T')[0] : '',
    interview_date: app.interview_date ? new Date(app.interview_date.seconds ? app.interview_date.seconds * 1000 : app.interview_date).toISOString().split('T')[0] : '',
    documents_submitted: app.documents_submitted || ''
  });

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl glass-panel rounded-2xl shadow-2xl animate-[scale-in_0.2s_ease-out] flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">{app.title || app.internship_title}</h2>
            <p className="text-primary text-sm font-semibold">{app.company}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/10 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Timeline Visualizer */}
          <div className="relative pt-2 pb-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center min-w-[600px]">
              {KANBAN_STAGES.map((stage, idx) => {
                const isActive = stage === formData.status;
                const isPast = KANBAN_STAGES.indexOf(formData.status) > idx;
                return (
                  <div key={stage} className="flex-1 relative flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full z-10 border-2 transition-colors ${
                      isActive ? 'bg-primary border-primary' :
                      isPast ? 'bg-primary/50 border-primary/50' : 'bg-gray-800 border-gray-600'
                    }`} />
                    <span className={`text-[10px] uppercase tracking-widest mt-2 font-bold text-center ${
                      isActive ? 'text-primary' : isPast ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {stage}
                    </span>
                    {idx < KANBAN_STAGES.length - 1 && (
                      <div className={`absolute top-2 left-1/2 w-full h-[2px] -translate-y-1/2 ${
                        isPast ? 'bg-primary/50' : 'bg-gray-800'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                {KANBAN_STAGES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
                <option value="External Link Opened" className="bg-gray-900">External Link Opened</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Interview Date</label>
              <input type="date" name="interview_date" value={formData.interview_date} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary outline-none" style={{ colorScheme: 'dark' }} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Follow-up Date</label>
              <input type="date" name="follow_up_date" value={formData.follow_up_date} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary outline-none" style={{ colorScheme: 'dark' }} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Documents Submitted</label>
              <input type="text" name="documents_submitted" value={formData.documents_submitted} onChange={handleChange} placeholder="e.g. Resume, Cover Letter, Portfolio Link" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">My Notes / Prep</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="4" placeholder="Add interview prep notes, questions to ask, or feedback received..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none resize-none" />
          </div>
        </div>
        
        <div className="p-6 border-t border-white/10 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="btn-secondary text-sm px-6 py-2 rounded-xl">Cancel</button>
          <button onClick={() => onSave(app.id, formData)} disabled={loading} className="btn-primary text-sm px-6 py-2 rounded-xl flex items-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</> : 'Save Tracker'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Applications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [selectedApp, setSelectedApp] = useState(null);
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
      setApps(prev => prev.map(a =>
        a.id === data.application_id ? { ...a, ...data } : a
      ));
      if (data.type === 'status_change') {
        showToast(`🔔 Status updated: ${data.status}`, 'success');
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

  const handleSaveTracker = async (id, data) => {
    setSaving(true);
    try {
      const res = await api.put(`/applications/${id}/track`, data);
      setApps(prev => prev.map(a => a.id === id ? { ...a, ...res.data } : a));
      showToast('Tracker updated successfully!', 'success');
      setSelectedApp(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update.', 'error');
    } finally {
      setSaving(false);
    }
  };

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

  const kanbanBoard = useMemo(() => {
    const board = {};
    KANBAN_STAGES.forEach(stage => board[stage] = []);
    board['Other'] = [];
    apps.forEach(app => {
      let st = app.status;
      if (st === 'Selected') st = 'Accepted'; // normalize legacy
      if (board[st]) board[st].push(app);
      else board['Other'].push(app);
    });
    return board;
  }, [apps]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto relative z-10 w-full pt-4">
        <SkeletonLoader type="list" count={3} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10 max-w-[1400px] mx-auto w-full h-full flex flex-col">
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl glass-panel ${
          toast.type === 'success' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'
        }`}>
          {toast.msg}
        </div>
      )}

      {selectedApp && (
        <TrackerModal app={selectedApp} onClose={() => setSelectedApp(null)} onSave={handleSaveTracker} loading={saving} />
      )}

      <div className="mb-6 flex justify-between items-end shrink-0 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            <span className="text-gradient">Application Tracker</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Manage your job search journey</p>
        </div>
        <Link to="/opportunities" className="btn-primary text-sm px-5 py-2 rounded-xl hidden sm:flex items-center gap-2">
          Find Opportunities
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl relative overflow-hidden text-center flex flex-col items-center justify-center flex-1 min-h-[400px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl relative z-10">📋</div>
          <h3 className="text-xl font-bold text-white mb-2 relative z-10">Your Journey Begins Here</h3>
          <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto relative z-10">
            You haven't applied to any opportunities yet.
          </p>
          <Link to="/opportunities" className="btn-primary py-3 px-8 text-sm font-bold shadow-[0_0_20px_rgba(32,21,255,0.3)] relative z-10">
            Explore Opportunities
          </Link>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-6 flex-1 no-scrollbar items-start min-h-[500px]">
          {KANBAN_STAGES.map(stage => {
            const columnApps = kanbanBoard[stage];
            return (
              <div key={stage} className="min-w-[300px] w-[300px] flex flex-col shrink-0 h-full glass-panel rounded-2xl bg-black/20 overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/5">
                  <h3 className="font-bold text-white text-sm">{stage}</h3>
                  <span className="bg-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-full font-black">{columnApps.length}</span>
                </div>
                
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar p-4">
                  {columnApps.map(app => (
                    <div 
                      key={app.id} 
                      onClick={() => setSelectedApp(app)}
                      className="glass-card p-4 rounded-xl cursor-pointer hover:border-primary/50 transition-all hover:-translate-y-1 group relative overflow-hidden bg-[#1a1a24] shadow-md shadow-black/20"
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full opacity-50 ${statusStyles[stage]?.split(' ')[0] || 'bg-gray-500'}`} />
                      
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-bold text-sm leading-snug pr-4">{app.title || app.internship_title}</h4>
                        {stage === 'Applied' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleWithdraw(app.id); }}
                            className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors bg-white/5 hover:bg-red-500/20"
                            title="Withdraw Application"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                      <p className="text-primary text-xs font-semibold mb-3">{app.company}</p>
                      
                      {app.interview_date && stage !== 'Rejected' && stage !== 'Accepted' && (
                        <div className="mb-3 bg-purple-500/10 border border-purple-500/20 rounded p-1.5 flex items-center gap-1.5">
                          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Interview:</span>
                          <span className="text-purple-300 text-xs font-semibold">{formatDate(app.interview_date, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                        <span className="text-[10px] text-gray-500 font-bold">
                          {formatDate(app.applied_at, { month: 'short', day: 'numeric' })}
                        </span>
                        {app.notes && (
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        )}
                      </div>
                    </div>
                  ))}
                  {columnApps.length === 0 && (
                    <div className="border border-dashed border-white/10 rounded-xl p-4 text-center">
                      <p className="text-xs font-semibold text-gray-500">No applications</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Applications;