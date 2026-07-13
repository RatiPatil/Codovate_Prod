import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiV1 from '../../api/v1/api';
import { formatDate } from '../../utils/dateUtils';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const statusFlow = [
  { code: 'STARTED', label: 'Started' },
  { code: 'APPLIED', label: 'Applied' },
  { code: 'ASSESSMENT', label: 'Assessment' },
  { code: 'INTERVIEW', label: 'Interview' },
  { code: 'OFFER', label: 'Offer' },
  { code: 'SELECTED', label: 'Selected' }
];

const ApplicationsTracker = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const data = await apiV1.get('/applications/my');
      setApps(data.applications || []);
      // If we already have a selected app, update it from the fresh data
      if (selectedApp) {
        const updatedApp = data.applications.find(a => a.id === selectedApp.id);
        if (updatedApp) setSelectedApp(updatedApp);
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId, newStatusObj) => {
    try {
      await apiV1.put(`/applications/${appId}/status/student`, {
        status: newStatusObj.label,
        status_code: newStatusObj.code
      });
      showAlert(`Status updated to ${newStatusObj.label}`, 'success');
      fetchApps();
    } catch (err) {
      showAlert(err.message || 'Failed to update status', 'error');
    }
  };

  if (loading && apps.length === 0) {
    return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-8">
      
      {/* Left Column: List */}
      <div className="w-full md:w-1/3 flex flex-col h-full">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">My Applications</h1>
        <p className="text-gray-400 text-sm mb-6">Track your career progress.</p>

        {apps.length === 0 ? (
          <div className="text-center py-10 glass-card border-dashed">
            <p className="text-gray-400 mb-4">No applications started yet.</p>
            <Link to="/opportunities" className="btn-primary text-sm">Find Opportunities</Link>
          </div>
        ) : (
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {apps.map(app => (
              <div 
                key={app.id} 
                onClick={() => setSelectedApp(app)}
                className={`glass-card p-4 cursor-pointer transition-colors ${selectedApp?.id === app.id ? 'border-primary shadow-[0_0_15px_-3px_rgba(32,21,255,0.4)]' : 'hover:border-white/20'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {app.company_logo ? (
                    <img src={app.company_logo} alt={app.company_name} className="w-8 h-8 rounded-lg object-contain bg-white/5 p-1" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">{app.company_name?.charAt(0)}</div>
                  )}
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-1">{app.opportunity_title}</h3>
                    <p className="text-gray-400 text-xs">{app.company_name}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs px-2 py-0.5 rounded border border-white/10 bg-white/5 text-gray-300">
                    {app.status}
                  </span>
                  <span className="text-[10px] text-gray-500">{formatDate(app.last_updated)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Details & Timeline */}
      <div className="w-full md:w-2/3 h-full">
        {!selectedApp ? (
          <div className="h-full flex flex-col items-center justify-center glass-card border-dashed opacity-50 p-10">
            <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="text-gray-400 text-lg">Select an application to view details.</p>
          </div>
        ) : (
          <div className="glass-panel p-6 md:p-8 rounded-2xl h-full flex flex-col">
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedApp.opportunity_title}</h2>
                <p className="text-primary font-medium">{selectedApp.company_name}</p>
              </div>
              <Link to={`/opportunities/${selectedApp.opportunity_id}`} className="btn-secondary text-xs py-1.5 px-3">View Listing</Link>
            </div>

            <div className="grid md:grid-cols-2 gap-8 flex-1">
              {/* Timeline Section */}
              <div>
                <h3 className="text-lg font-bold text-white mb-6">Application Timeline</h3>
                <div className="relative border-l border-white/10 ml-3 space-y-6">
                  {selectedApp.timeline?.map((event, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(32,21,255,0.8)]" />
                      <h4 className="text-sm font-bold text-white">{event.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{formatDate(event.date, { hour: 'numeric', minute: 'numeric'})}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Update Status Manually</h4>
                  <div className="flex flex-wrap gap-2">
                    {statusFlow.map(s => (
                      <button 
                        key={s.code}
                        onClick={() => updateStatus(selectedApp.id, s)}
                        disabled={selectedApp.status === s.label}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          selectedApp.status === s.label 
                            ? 'bg-primary/20 text-primary border border-primary/50 cursor-default' 
                            : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {selectedApp.status === 'Started' && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-400">Did you finish applying on the company website? Update your status to <strong>Applied</strong> to track your progress.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h3 className="text-lg font-bold text-white mb-6">Interview Notes</h3>
                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Round / Type</label>
                    <input type="text" placeholder="e.g. Technical, HR" className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-600" />
                  </div>
                  <div className="glass-card p-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date & Time</label>
                    <input type="text" placeholder="e.g. Oct 24, 2:00 PM" className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-600" />
                  </div>
                  <div className="glass-card p-4 h-32 flex flex-col">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Personal Notes</label>
                    <textarea placeholder="Questions asked, topics to prepare..." className="w-full flex-1 bg-transparent text-sm text-white outline-none resize-none placeholder-gray-600"></textarea>
                  </div>
                  <button className="btn-secondary w-full justify-center">Save Notes</button>
                  <p className="text-[10px] text-gray-500 text-center mt-2">Notes are saved privately to your tracker.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ApplicationsTracker;
