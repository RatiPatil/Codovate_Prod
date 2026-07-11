import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { showAlert } from '../../../utils/uiUtils';
import { useAuth } from '../../../context/AuthContext';

const MyConnections = ({ onOpenChat }) => {
  const { currentUser } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/networking/connections');
      setConnections(res.data);
    } catch (err) {
      console.error(err);
      showAlert('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/networking/connect/${id}`, { action });
      showAlert(`Request ${action}ed successfully`, 'success');
      fetchConnections();
    } catch (err) {
      showAlert(err.response?.data?.message || `Failed to ${action}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const accepted = connections.filter(c => c.status === 'accepted');
  const pendingIncoming = connections.filter(c => c.status === 'pending' && c.receiver_id === currentUser?.id);
  const pendingOutgoing = connections.filter(c => c.status === 'pending' && c.sender_id === currentUser?.id);

  const ConnectionCard = ({ conn, isAccepted, isIncoming }) => {
    const peer = conn.other_user;
    return (
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4 group hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden shrink-0 border border-primary/20">
            {peer.profile_photo ? (
              <img src={peer.profile_photo} alt={peer.name} className="w-full h-full object-cover" />
            ) : (
              peer.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold truncate">{peer.name}</h3>
            <p className="text-gray-400 text-xs truncate">{peer.college || 'College not specified'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAccepted ? (
            <button
              onClick={() => onOpenChat(`direct_${conn.id}`)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>💬</span> Message
            </button>
          ) : isIncoming ? (
            <>
              <button
                onClick={() => handleAction(conn.id, 'accept')}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleAction(conn.id, 'reject')}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Reject
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              Pending
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto pr-2 scrollbar-hide pb-20">
      
      {pendingIncoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            📥 Incoming Requests <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">{pendingIncoming.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingIncoming.map(c => <ConnectionCard key={c.id} conn={c} isIncoming={true} />)}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          🤝 My Network <span className="bg-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-full">{accepted.length}</span>
        </h2>
        {accepted.length === 0 ? (
          <div className="text-gray-400 bg-white/5 p-6 rounded-xl border border-white/10 text-center">
            You haven't connected with anyone yet. Go to Find Teammates to build your network!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accepted.map(c => <ConnectionCard key={c.id} conn={c} isAccepted={true} />)}
          </div>
        )}
      </div>

      {pendingOutgoing.length > 0 && (
        <div className="opacity-70">
          <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
            Sent Requests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingOutgoing.map(c => <ConnectionCard key={c.id} conn={c} />)}
          </div>
        </div>
      )}

    </div>
  );
};

export default MyConnections;
