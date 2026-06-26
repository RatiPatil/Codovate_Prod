import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

const typeColors = {
  Internship: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
  Hackathon: 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]',
  Competition: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]',
};

const Opportunities = () => {
  const [opps, setOpps] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [filter, setFilter] = useState('All');
  const [showRecommended, setShowRecommended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [toast, setToast] = useState('');
  const { socket } = useSocket();

  const types = ['All', 'Internship', 'Hackathon', 'Competition'];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

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

  useEffect(() => {
    if (!socket) return;
    socket.on('new_opportunity', (opp) => {
      setOpps(prev => {
        const exists = prev.some(item => item.id === opp.id);
        if (exists) return prev;
        return [opp, ...prev];
      });
      showToast(`🚀 New opportunity: ${opp.title}`);
    });
    return () => socket.off('new_opportunity');
  }, [socket]);

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

  const filtered = opps.filter(o => {
    if (filter !== 'All' && o.type !== filter) return false;
    if (showRecommended && (o.match_score === undefined || o.match_score < 30)) return false;
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto relative z-10">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 glass-panel px-4 py-3 rounded-xl shadow-2xl text-sm animate-[fade-in-down_0.3s_ease-out]">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 text-center md:text-left relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          <span className="text-gradient">Opportunities</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">{opps.length} total opportunities available to accelerate your career</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center relative z-10">
        <div className="flex gap-2 flex-wrap justify-center md:justify-start">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 border ${
                filter === t
                  ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(32,21,255,0.4)]'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowRecommended(!showRecommended)}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 border ${
            showRecommended
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
              : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>⭐</span> Recommended for You
        </button>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 glass-card border-dashed">
          <p className="text-gray-400 text-sm">No opportunities found for this category.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filtered.map(opp => {
            const isApplied = appliedIds.has(opp.id);
            const isApplying = applying === opp.id;
            return (
              <div
                key={opp.id}
                className="glass-card p-6 flex flex-col h-full group"
              >
                {/* Decorative background for the card */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

                <div className="flex-1 flex flex-col gap-4 relative z-10">
                  {/* Title + Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-white font-bold text-lg leading-snug group-hover:text-primary transition-colors">
                      {opp.title}
                    </h3>
                    <div className="flex flex-col gap-2 items-end shrink-0">
                      <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border font-bold backdrop-blur-md ${
                        typeColors[opp.type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {opp.type}
                      </span>
                      {opp.match_score !== undefined && opp.match_score > 0 && (
                        <span className="text-[10px] font-black px-2 py-1 rounded border bg-green-500/10 text-green-400 border-green-500/20 flex items-center gap-1">
                          🔥 {opp.match_score}% MATCH
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Company */}
                  <p className="text-primary text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    {opp.company}
                  </p>

                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                    {opp.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-end justify-between mt-6 pt-4 border-t border-white/10 relative z-10">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Deadline</p>
                    <p className="text-gray-300 text-xs font-semibold flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(opp.deadline).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => !isApplied && handleApply(opp.id)}
                    disabled={isApplied || isApplying}
                    className={`${
                      isApplied
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-2 rounded-xl text-sm font-bold cursor-default flex items-center gap-1.5'
                        : 'btn-primary text-sm px-5 py-2 rounded-xl flex items-center gap-2'
                    }`}
                  >
                    {isApplying ? (
                      <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Applying...</>
                    ) : isApplied ? (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Applied</>
                    ) : (
                      <>Apply Now <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                    )}
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