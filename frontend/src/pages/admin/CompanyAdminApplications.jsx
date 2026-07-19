import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const CompanyAdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  // Kanban Columns
  const COLUMNS = ['Applied', 'Bookmarked', 'Shortlisted', 'Interviewing', 'Resume Requested', 'Rejected'];

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/company-admin/applications');
      setApplications(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      // Optimistic update
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
      await api.put(`/company-admin/applications/${id}/status`, { status: newStatus });
    } catch (err) {
      showAlert("Failed to update status");
      fetchApplications(); // Revert on failure
    }
  };

  const handleDelete = async (id) => {
    if (!await showConfirm("Are you sure you want to delete this application?")) return;
    try {
      setApplications(prev => prev.filter(app => app.id !== id));
      await api.delete(`/company-admin/applications/${id}`);
    } catch (err) {
      showAlert("Failed to delete application");
      fetchApplications();
    }
  };

  const renderKanbanCard = (app) => (
    <div key={app.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setSelectedApp(app)}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-white text-sm">{app.student_name}</h3>
        <select
          value={app.status || 'Applied'}
          onChange={(e) => {
            e.stopPropagation();
            handleStatusChange(app.id, e.target.value);
          }}
          onClick={e => e.stopPropagation()}
          className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-xs text-gray-300 focus:outline-none focus:border-amber-500"
        >
          {COLUMNS.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <p className="text-[10px] text-gray-400 mb-3 truncate">{app.student_email}</p>
      
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-amber-500">💼</span>
          <span className="text-xs text-gray-300 truncate">{app.opportunity_title}</span>
        </div>
        <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
          <span className="text-[10px] text-gray-500">
            {formatDate(app.applied_at || app.created_at)}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(app.id);
            }}
            className="text-[10px] text-red-500/70 hover:text-red-500 transition-colors font-bold uppercase"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white">Application Tracking</h1>
          <p className="text-gray-400 text-sm mt-1">Manage candidates through your hiring pipeline</p>
        </div>
      </div>

      {loading ? (
        <div className="text-white">Loading applications...</div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {COLUMNS.map(column => {
            const columnApps = applications.filter(app => (app.status || 'Applied') === column);
            return (
              <div key={column} className="flex-shrink-0 w-80 bg-black/40 border border-white/5 rounded-2xl flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                  <h2 className="font-bold text-white text-sm flex items-center gap-2">
                    {column === 'Applied' && '📥'}
                    {column === 'Bookmarked' && '⭐'}
                    {column === 'Shortlisted' && '✅'}
                    {column === 'Interviewing' && '📅'}
                    {column === 'Resume Requested' && '📄'}
                    {column === 'Rejected' && '❌'}
                    {column}
                  </h2>
                  <span className="bg-white/10 text-xs font-bold px-2 py-0.5 rounded-full text-gray-300">
                    {columnApps.length}
                  </span>
                </div>
                <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                  {columnApps.length > 0 ? (
                    columnApps.map(renderKanbanCard)
                  ) : (
                    <div className="text-center p-4 text-xs text-gray-500 border border-dashed border-white/10 rounded-xl">
                      No applications
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setSelectedApp(null)} />
          <div className="bg-[#080812] border border-white/10 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative z-10 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>📄</span> Candidate Application
              </h2>
              <button onClick={() => setSelectedApp(null)} className="w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:text-white flex items-center justify-center text-sm">✕</button>
            </div>
            
            <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Applicant</p>
                <p className="text-white font-bold text-lg">{selectedApp.student_name}</p>
                <p className="text-amber-500 text-sm">{selectedApp.student_email}</p>
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Opportunity</p>
                <p className="text-white font-bold">{selectedApp.opportunity_title}</p>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Update Pipeline Stage</p>
                <select
                  value={selectedApp.status || 'Applied'}
                  onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {COLUMNS.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
              
              {selectedApp.answers && Object.keys(selectedApp.answers).length > 0 && (
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Custom Answers</p>
                  <div className="space-y-4">
                    {Object.entries(selectedApp.answers).map(([q, a]) => (
                      <div key={q}>
                        <p className="text-amber-500/80 text-xs mb-1 font-semibold">{q}</p>
                        <p className="text-white text-sm bg-black/40 p-3 rounded-lg border border-white/5">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Actions Footer */}
            <div className="pt-6 border-t border-white/10 mt-6 shrink-0 flex gap-3">
              <button 
                onClick={() => handleStatusChange(selectedApp.id, 'Interviewing')}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                Schedule Interview
              </button>
              <button 
                onClick={() => handleStatusChange(selectedApp.id, 'Resume Requested')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                Request Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyAdminApplications;
