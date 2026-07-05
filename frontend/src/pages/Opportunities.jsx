import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { formatDate } from '../utils/dateUtils';

const typeColors = {
  Internship: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Hackathon: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Competition: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const OppDetailModal = ({ opp, isApplied, isApplying, onApply, onClose }) => {
  if (!opp) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-[90vw] md:w-full max-w-2xl glass-panel rounded-2xl overflow-y-auto max-h-[90vh] shadow-2xl animate-[scale-in_0.2s_ease-out]">
        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border font-bold ${typeColors[opp.type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                  {opp.type}
                </span>
                {opp.match_score > 0 && (
                  <span className="text-[10px] font-black px-2 py-1 rounded border bg-green-500/10 text-green-400 border-green-500/20">
                    🔥 {opp.match_score}% Match
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{opp.title}</h2>
              <p className="text-primary text-sm font-semibold mt-1">{opp.company}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Deadline', value: opp.deadline ? formatDate(opp.deadline, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Open' },
              { label: 'Mode', value: opp.mode || 'Not specified' },
              { label: 'Location', value: opp.location || 'Remote / Anywhere' },
            ].map(item => (
              <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-white text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          {opp.description && (
            <div className="mb-6">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Description</p>
              <p className="text-gray-300 text-sm leading-relaxed">{opp.description}</p>
            </div>
          )}

          {opp.eligibility && (
            <div className="mb-6">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Eligibility</p>
              <p className="text-gray-300 text-sm">{opp.eligibility}</p>
            </div>
          )}

          {opp.required_skills && opp.required_skills.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {opp.required_skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-bold">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {opp.prize_pool && (
            <div className="mb-6">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Prize Pool</p>
              <p className="text-yellow-400 font-bold text-lg">🏆 {opp.prize_pool}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/10">
            {opp.registration_link && (
              <a href={opp.registration_link} target="_blank" rel="noopener noreferrer"
                className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                External Registration ↗
              </a>
            )}
            <div className="flex gap-3 ml-auto">
              <button onClick={onClose} className="btn-secondary text-sm px-5 py-2 rounded-xl">Close</button>
              {isApplied ? (
                <Link
                  to="/applications"
                  className="bg-green-500/10 text-green-400 border border-green-500/20 text-sm px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-500/20 transition-colors"
                >
                  ✓ View App
                </Link>
              ) : (
                <button
                  onClick={() => onApply(opp.id)}
                  disabled={isApplying}
                  className="btn-primary text-sm px-5 py-2 rounded-xl font-bold transition-all"
                >
                  {isApplying ? (
                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Applying...</span>
                  ) : 'Apply Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Opportunities = () => {
  const [opps, setOpps] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showRecommended, setShowRecommended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [toast, setToast] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(null);
  const { socket } = useSocket();

  const types = ['All', 'Internship', 'Hackathon', 'Competition'];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_opportunity', (opp) => {
      setOpps(prev => prev.some(o => o.id === opp.id) ? prev : [opp, ...prev]);
      showToast(`🚀 New opportunity: ${opp.title}`);
    });
    socket.on('update_opportunity', (opp) => {
      setOpps(prev => prev.map(o => o.id === opp.id ? { ...o, ...opp } : o));
    });
    socket.on('delete_opportunity', (id) => {
      setOpps(prev => prev.filter(o => o.id !== id));
      if (selectedOpp?.id === id) setSelectedOpp(null);
      showToast('An opportunity was removed.');
    });
    socket.on('application_withdrawn', ({ application_id }) => {
      // Refresh the applied set from fresh data when a withdrawal happens
      api.get('/applications/my').then(res => setAppliedIds(new Set(res.data.map(a => a.opportunity_id))));
    });
    return () => {
      socket.off('new_opportunity');
      socket.off('update_opportunity');
      socket.off('delete_opportunity');
      socket.off('application_withdrawn');
    };
  }, [socket, selectedOpp]);

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
    if (search) {
      const q = search.toLowerCase();
      return (o.title?.toLowerCase().includes(q) || o.company?.toLowerCase().includes(q));
    }
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto relative z-10">
      {toast && (
        <div className="fixed top-4 right-4 z-50 glass-panel px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold">
          {toast}
        </div>
      )}

      {selectedOpp && (
        <OppDetailModal
          opp={selectedOpp}
          isApplied={appliedIds.has(selectedOpp.id)}
          isApplying={applying === selectedOpp.id}
          onApply={handleApply}
          onClose={() => setSelectedOpp(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8 relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          <span className="text-gradient">Opportunities</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">{opps.length} total opportunities available to accelerate your career</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-4 mb-8 relative z-10">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or company..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex gap-2 flex-wrap">
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
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>⭐</span> Recommended for You
          </button>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 glass-card border-dashed">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-gray-400 text-sm">No opportunities found. Try changing your search or filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filtered.map(opp => {
            const isApplied = appliedIds.has(opp.id);
            const isApplying = applying === opp.id;
            return (
              <div
                key={opp.id}
                onClick={() => setSelectedOpp(opp)}
                className="glass-card p-6 flex flex-col h-full group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

                <div className="flex-1 flex flex-col gap-4 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-white font-bold text-lg leading-snug group-hover:text-primary transition-colors">
                      {opp.title}
                    </h3>
                    <div className="flex flex-col gap-2 items-end shrink-0">
                      <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border font-bold backdrop-blur-md ${typeColors[opp.type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {opp.type}
                      </span>
                      {opp.match_score > 0 && (
                        <span className="text-[10px] font-black px-2 py-1 rounded border bg-green-500/10 text-green-400 border-green-500/20">
                          🔥 {opp.match_score}% MATCH
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-primary text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    {opp.company}
                  </p>

                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                    {opp.description || 'Click to view details...'}
                  </p>
                </div>

                <div className="flex items-end justify-between mt-6 pt-4 border-t border-white/10 relative z-10" onClick={e => e.stopPropagation()}>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Deadline</p>
                    <p className="text-gray-300 text-xs font-semibold">
                      {opp.deadline ? formatDate(opp.deadline, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Open'}
                    </p>
                  </div>
                  {isApplied ? (
                    <Link
                      to="/applications"
                      className="bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 hover:bg-green-500/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      View App
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApply(opp.id); }}
                      disabled={isApplying}
                      className="btn-primary text-sm px-5 py-2 rounded-xl flex items-center gap-2"
                    >
                      {isApplying ? (
                        <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Applying...</>
                      ) : (
                        <>Apply Now <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                      )}
                    </button>
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

export default Opportunities;