import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const ApproveUsersModal = ({ isOpen, onClose, targetRole }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const roleLabel = targetRole === 'college_admin' ? 'Colleges' : 'Companies';

  useEffect(() => {
    if (isOpen) {
      fetchPendingUsers();
    }
  }, [isOpen, targetRole]);

  const fetchPendingUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // Assuming a generic GET /admin/users endpoint exists that accepts filters
      // We'll filter on the frontend for simplicity if backend doesn't support query params yet
      const response = await api.get('/admin/users');
      const pendingUsers = response.data.filter(u => u.role === targetRole && u.status === 'pending');
      setUsers(pendingUsers);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load pending ${roleLabel.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    try {
      // action = 'active' or 'rejected'
      await api.put(`/admin/users/${userId}/status`, { status: action });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      showAlert(`Failed to ${action === 'active' ? 'approve' : 'reject'} user.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#080812] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">Approve {roleLabel}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm mb-4">{error}</div>}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#2015FF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-white text-lg font-bold">All Caught Up!</h3>
              <p className="text-gray-500">No pending {roleLabel.toLowerCase()} to approve.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-[#2015FF]/50 transition-colors">
                  <div>
                    <h3 className="text-white font-bold text-lg">{user.name || 'Unnamed Organization'}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-400">✉️ {user.email}</span>
                      <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wider">Pending Verification</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleAction(user.id, 'rejected')}
                      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-colors"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleAction(user.id, 'active')}
                      className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 font-bold text-sm hover:bg-green-500/20 transition-colors"
                    >
                      Approve
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

export default ApproveUsersModal;
