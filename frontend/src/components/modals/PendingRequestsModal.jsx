import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const PendingRequestsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchRequests();
    }
  }, [isOpen, user]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      // Assuming a generic GET /mentors/requests endpoint
      // We don't have it explicitly mapped yet, so this might 404 until backend is added.
      const response = await api.get('/mentors/requests');
      setRequests(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      await api.put(`/mentors/requests/${requestId}`, { status: action });
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (err) {
      showAlert(`Failed to ${action} request.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#080812] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">Pending Session Requests</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm mb-4">{error}</div>}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-white text-lg font-bold">Inbox Zero!</h3>
              <p className="text-gray-500">No pending session requests at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-cyan-500/50 transition-colors">
                  <div>
                    <h3 className="text-white font-bold text-lg">{req.studentName || 'Student'}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-400">📅 {new Date(req.scheduled_time).toLocaleString()}</span>
                      {req.mode && <span className="text-sm text-gray-400">📍 {req.mode}</span>}
                    </div>
                    {(req.topic || req.notes) && <p className="text-sm text-gray-500 mt-2 italic">"{req.topic || req.notes}"</p>}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleAction(req.id, 'rejected')}
                      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-colors"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'accepted')}
                      className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 font-bold text-sm hover:bg-green-500/20 transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingRequestsModal;
