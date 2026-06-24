import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

// Inside component, after existing state:
const { socket } = useSocket();

// Add this useEffect after existing useEffect:
useEffect(() => {
  if (!socket) return;

  socket.on('new_opportunity', (opp) => {
    setOpps(prev => [opp, ...prev]);
    showToast(`🚀 New opportunity added: ${opp.title}`);
  });

  return () => socket.off('new_opportunity');
}, [socket]);

const typeColors = {
  Internship: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Hackathon: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Competition: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const Opportunities = () => {
  const [opps, setOpps] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [toast, setToast] = useState('');

  const types = ['All', 'Internship', 'Hackathon', 'Competition'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [oppsRes, appsRes] = await Promise.all([
          api.get('/opportunities'),
          api.get('/applications/my'),
        ]);
        setOpps(oppsRes.data);
        setAppliedIds(new Set(appsRes.data.map(a => a.opportunity_id)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApply = async (id) => {
    setApplying(id);
    try {
      await api.post('/applications', { opportunity_id: id });
      setAppliedIds(prev => new Set([...prev, id]));
      showToast('Applied successfully! 🎉');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to apply.');
    } finally {
      setApplying(null);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const filtered = filter === 'All' ? opps : opps.filter(o => o.type === filter);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#111] border border-white/10 text-white px-4 py-3 rounded-xl shadow-xl text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Opportunities</h1>
        <p className="text-gray-400 text-sm mt-1">{opps.length} opportunities available</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === t
                ? 'bg-primary text-white'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No opportunities found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(opp => {
            const isApplied = appliedIds.has(opp.id);
            const isApplying = applying === opp.id;
            return (
              <div
                key={opp.id}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 flex flex-col gap-3 hover:border-primary/40 transition-all duration-200"
              >
                {/* Title + Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-white font-semibold text-sm leading-tight">{opp.title}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${typeColors[opp.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                    {opp.type}
                  </span>
                </div>

                {/* Company */}
                <p className="text-primary text-xs font-semibold">{opp.company}</p>

                {/* Description */}
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                  {opp.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                  <div>
                    <p className="text-gray-500 text-xs">Deadline</p>
                    <p className="text-gray-300 text-xs font-medium">
                      {new Date(opp.deadline).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => !isApplied && handleApply(opp.id)}
                    disabled={isApplied || isApplying}
                    className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all ${
                      isApplied
                        ? 'bg-green-500/20 text-green-400 cursor-default'
                        : 'bg-primary hover:bg-primary-dark text-white disabled:opacity-50'
                    }`}
                  >
                    {isApplying ? 'Applying...' : isApplied ? '✓ Applied' : 'Apply Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Opportunities;