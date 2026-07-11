import { formatDate, formatTime, formatDateTime, parseDate, getISODate } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const CompanyAdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

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
      await api.put(`/company-admin/applications/${id}/status`, { status: newStatus });
      fetchApplications();
    } catch (err) {
      showAlert("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!await showConfirm("Are you sure you want to delete this application?")) return;
    try {
      await api.delete(`/company-admin/applications/${id}`);
      fetchApplications();
    } catch (err) {
      showAlert("Failed to delete application");
    }
  };

  const columns = [
    { 
      header: 'Applicant', 
      render: (row) => (
        <div>
          <p className="font-bold">{row.student_name}</p>
          <p className="text-xs text-gray-400">{row.student_email}</p>
        </div>
      )
    },
    { header: 'Opportunity', accessor: 'opportunity_title' },
    { 
      header: 'Applied On', 
      render: (row) => {
        const d = row.applied_at || row.created_at;
        if (!d) return '—';
        return formatDate(d);
      }
    },
    { 
      header: 'Status', 
      render: (row) => (
        <select
          value={row.status || 'Applied'}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-500"
        >
          <option value="Applied">Applied</option>
          <option value="Under Review">Under Review</option>
          <option value="Selected">Selected</option>
          <option value="Rejected">Rejected</option>
        </select>
      )
    },
    {
      header: 'Action',
      render: (row) => (
        <div className="flex gap-2">
          <button 
            onClick={() => setSelectedApp(row)}
            className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-xs font-bold transition-colors"
          >
            👁️ View
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto relative">
      <AdminDataTable 
        title="Recent Applications"
        data={applications}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search applications..."
      />

      {selectedApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setSelectedApp(null)} />
          <div className="bg-[#080812] border border-white/10 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>📄</span> Application Details
              </h2>
              <button onClick={() => setSelectedApp(null)} className="w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:text-white flex items-center justify-center text-sm">✕</button>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status</p>
                  <p className="text-white text-sm font-bold">{selectedApp.status}</p>
                </div>
              </div>
              
              {selectedApp.answers && Object.keys(selectedApp.answers).length > 0 && (
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Custom Answers</p>
                  <div className="space-y-3">
                    {Object.entries(selectedApp.answers).map(([q, a]) => (
                      <div key={q}>
                        <p className="text-gray-300 text-xs mb-1 font-semibold">{q}</p>
                        <p className="text-white text-sm bg-black/30 p-3 rounded-lg border border-white/5">{a}</p>
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

export default CompanyAdminApplications;
