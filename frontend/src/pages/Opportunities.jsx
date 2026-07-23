import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { formatDate } from '../utils/dateUtils';
import { showConfirm } from '../utils/uiUtils';
import Loader from '../components/common/Loader';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { gsap } from 'gsap';
const typeColors = {
  Internship: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Hackathon: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Competition: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Job: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Research Programs': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Fellowships: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Open Source Programs': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Scholarships: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Certifications: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const OppDetailModal = ({ opp, isApplied, isApplying, onApply, isBookmarked, onBookmark, onClose, aiAnalysis, analyzing, onAnalyzeMatch }) => {
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
              <div className="flex items-center gap-4 mt-2">
                {opp.logo && (
                  <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-2 shrink-0">
                    <img src={opp.logo} alt={opp.company} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white leading-tight">{opp.title}</h2>
                  <p className="text-primary text-sm font-semibold mt-1">{opp.company}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={(e) => { e.stopPropagation(); onBookmark(opp.id); }}
                className={`p-2 rounded-xl transition-all ${
                  isBookmarked 
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30' 
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:bg-white/10'
                }`}
                title={isBookmarked ? "Remove Bookmark" : "Save Opportunity"}
              >
                <svg className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Posted', value: opp.created_at ? formatDate(typeof opp.created_at === 'string' ? opp.created_at : opp.created_at.seconds ? opp.created_at.seconds * 1000 : new Date(), { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently' },
              { label: 'Deadline', value: opp.deadline ? formatDate(opp.deadline, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Open' },
              { label: 'Mode', value: opp.mode || 'Not specified' },
              { label: 'Location', value: opp.location || 'Remote / Anywhere' },
              { label: 'Salary/Stipend', value: opp.salary || 'Unpaid / Not Disclosed' },
              { label: 'Experience', value: opp.experience || 'Entry Level / Student' }
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
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{opp.description}</p>
            </div>
          )}

          {opp.eligibility && (
            <div className="mb-6">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Eligibility</p>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{opp.eligibility}</p>
            </div>
          )}

          {opp.selection_process && (
            <div className="mb-6">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Selection Process</p>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{opp.selection_process}</p>
            </div>
          )}

          {opp.benefits && (
            <div className="mb-6">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Benefits / Perks</p>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{opp.benefits}</p>
            </div>
          )}

          <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                🤖 AI Match Analysis
              </h3>
              {aiAnalysis ? (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full font-black text-sm">
                  {aiAnalysis.detailed_score}% Match
                </span>
              ) : (
                <button
                  onClick={() => onAnalyzeMatch(opp.id)}
                  disabled={analyzing}
                  className="bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                >
                  {analyzing ? (
                    <><div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Analyzing...</>
                  ) : 'Generate Deep Match Score'}
                </button>
              )}
            </div>
            
            {aiAnalysis && (
              <div className="space-y-4 relative z-10 animate-[fade-in_0.3s_ease-out]">
                <p className="text-sm text-gray-300">{aiAnalysis.reasoning}</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Skill Gap Checklist</p>
                    <ul className="space-y-1.5">
                      {aiAnalysis.missing_skills_analysis?.map((item, idx) => {
                        const itemName = typeof item === 'string' ? item : (item?.skill || item?.name || JSON.stringify(item));
                        const isMissing = typeof item === 'string' ? item.includes('❌') : false;
                        return (
                        <li key={idx} className={`text-xs font-semibold ${isMissing ? 'text-red-400' : 'text-green-400'}`}>
                          {itemName}
                        </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col justify-center items-center text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Estimated Learning Time</p>
                    <p className="text-2xl font-black text-yellow-400">{aiAnalysis.estimated_learning_time}</p>
                    <p className="text-xs text-gray-400 mt-1">to master missing requirements</p>
                  </div>
                </div>

                {aiAnalysis.preparation_tips && aiAnalysis.preparation_tips.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      AI Preparation Tips
                    </p>
                    <ul className="space-y-1">
                      {aiAnalysis.preparation_tips.map((item, idx) => {
                        const itemName = typeof item === 'string' ? item : (item?.skill || item?.name || JSON.stringify(item));
                        return (
                        <li key={idx} className="text-xs text-purple-200/80 leading-relaxed flex items-start gap-1.5">
                          <span className="text-purple-400 mt-0.5">•</span> {itemName}
                        </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {opp.required_skills && opp.required_skills.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {opp.required_skills.map((skill, idx) => {
                  const skillName = typeof skill === 'string' ? skill : (skill?.name || '');
                  const isMissing = opp.missing_skills?.includes(skillName) || opp.missing_skills?.includes(skill);
                  return (
                    <span 
                      key={skillName || idx} 
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        isMissing 
                          ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                          : 'bg-primary/10 border-primary/20 text-primary'
                      }`}
                    >
                      {skillName} {isMissing && <span className="ml-1 opacity-70" title="Missing from your profile">⚠️</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {opp.prize_pool && (
            <div className="mb-6">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Prize Pool</p>
              <p className="text-yellow-400 font-bold text-lg">🏆 {opp.prize_pool}</p>
            </div>
          )}

          {opp.tags && opp.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {opp.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold border bg-gray-500/10 border-gray-500/20 text-gray-400">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/10">
            <div>
              {(opp.external || opp.applyUrl || opp.registration_link) && (
                 <p className="text-xs text-gray-400 max-w-sm">
                   <span className="text-blue-400 font-bold">Note:</span> This opportunity is hosted by an external platform. Applications are submitted on the original website. Codovate cannot track the application status for external opportunities.
                 </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 ml-auto">
              {(opp.external || opp.applyUrl || opp.registration_link) ? (
                <>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                    Source: {opp.source || 'External Provider'}
                  </span>
                  <div className="flex gap-3">
                    <button onClick={onClose} className="btn-secondary text-sm px-5 py-2 rounded-xl">Close</button>
                    <button
                      onClick={async () => {
                        const confirm = await showConfirm("You are being redirected to the original internship provider to complete your application.");
                        if (confirm) {
                          try {
                            await api.post('/applications/external', { opportunity_id: opp.id });
                          } catch (err) {
                            console.error("Failed to log external apply", err);
                          }
                          window.open(opp.applyUrl || opp.registration_link, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="btn-primary text-sm px-5 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      🌐 Apply Externally
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-3">
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
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showRecommended, setShowRecommended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [toast, setToast] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingMatch, setAnalyzingMatch] = useState(false);
  const { socket } = useSocket();
  const listRef = useRef(null);

  const types = ['All', 'Saved', 'Interested', 'Applied', 'Deadline Soon', 'Internship', 'Job', 'Hackathon', 'Competition', 'Research Programs', 'Fellowships', 'Open Source Programs', 'Scholarships', 'Certifications', 'Volunteering', 'Grant/Funding'];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [oppsRes, appsRes, bookRes] = await Promise.all([
        api.get('/opportunities'),
        api.get('/applications/my'),
        api.get('/opportunities/bookmarks/my')
      ]);
      setOpps(oppsRes.data);
      setAppliedIds(new Set(appsRes.data.map(a => a.opportunity_id)));
      setBookmarkedIds(new Set(bookRes.data));
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

  const handleAnalyzeMatch = async (id) => {
    setAnalyzingMatch(true);
    try {
      const res = await api.get(`/opportunities/${id}/ai-match`);
      setAiAnalysis(res.data);
    } catch (err) {
      showToast('Failed to analyze match.');
    } finally {
      setAnalyzingMatch(false);
    }
  };

  const handleBookmark = async (id) => {
    try {
      const res = await api.post(`/opportunities/${id}/bookmark`);
      setBookmarkedIds(prev => {
        const newSet = new Set(prev);
        if (res.data.bookmarked) newSet.add(id);
        else newSet.delete(id);
        return newSet;
      });
      showToast(res.data.bookmarked ? 'Saved to Bookmarks 🔖' : 'Removed from Bookmarks');
    } catch (err) {
      showToast('Failed to save opportunity');
    }
  };

  const filtered = opps.filter(o => {
    const matchesSearch = o.title?.toLowerCase().includes(search.toLowerCase()) || o.company?.toLowerCase().includes(search.toLowerCase());
    
    let matchesType = true;
    if (filter === 'Saved' || filter === 'Interested') {
      matchesType = bookmarkedIds.has(o.id);
    } else if (filter === 'Applied') {
      matchesType = appliedIds.has(o.id);
    } else if (filter === 'Deadline Soon') {
      if (!o.deadline) matchesType = false;
      else {
        const diffDays = (new Date(o.deadline) - new Date()) / (1000 * 60 * 60 * 24);
        matchesType = diffDays >= 0 && diffDays <= 7;
      }
    } else if (filter !== 'All') {
      matchesType = o.type === filter;
    }

    const matchesRec = !showRecommended || o.match_score >= 80;
    return matchesSearch && matchesType && matchesRec;
  });

  useEffect(() => {
    if (!loading && filtered.length > 0 && listRef.current) {
      const cards = listRef.current.querySelectorAll('.opp-card');
      gsap.fromTo(cards, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [loading, filtered]);


  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto relative z-10 w-full h-full">
        <SkeletonLoader type="card" count={6} />
      </div>
    );
  }

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
          isBookmarked={bookmarkedIds.has(selectedOpp.id)}
          onApply={handleApply}
          onBookmark={handleBookmark}
          onClose={() => {
            setSelectedOpp(null);
            setAiAnalysis(null);
          }}
          aiAnalysis={aiAnalysis}
          analyzing={analyzingMatch}
          onAnalyzeMatch={handleAnalyzeMatch}
        />
      )}

      <div className="mb-8 relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          <span className="text-gradient">Opportunities</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">{opps.length} total opportunities available to accelerate your career</p>
      </div>

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
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {types.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-bold transition-all text-sm ${
                  filter === t
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
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
        <div className="glass-panel p-12 rounded-3xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl relative z-10 transform transition-transform hover:scale-105">
            🔍
          </div>
          <h3 className="text-xl font-bold text-white mb-2 relative z-10">No Opportunities Found</h3>
          <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto relative z-10">
            We couldn't find any opportunities matching your current search or filters. Try adjusting your criteria.
          </p>
        </div>
      ) : (
        <div ref={listRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filtered.map(opp => {
            const isApplied = appliedIds.has(opp.id);
            const isApplying = applying === opp.id;
            const isBookmarked = bookmarkedIds.has(opp.id);
            return (
              <div
                key={opp.id}
                onClick={() => {
                  setSelectedOpp(opp);
                  setAiAnalysis(null);
                }}
                className="opp-card glass-card p-6 flex flex-col h-full group relative overflow-hidden hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(32,21,255,0.2)] transition-all duration-300 cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

                <button 
                  onClick={(e) => { e.stopPropagation(); handleBookmark(opp.id); }}
                  className={`absolute top-4 right-4 z-20 p-2 rounded-xl transition-all ${
                    isBookmarked 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30' 
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>

                <div className="flex-1 flex flex-col gap-4 relative z-10">
                  <div className="flex items-start justify-between gap-3 pr-10 mb-2">
                    <div className="flex items-center gap-3">
                      {opp.logo ? (
                        <div className="w-12 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center shadow-lg shadow-black/20 shrink-0">
                          <img src={opp.logo} alt={opp.company} className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                          <span className="text-xl font-black text-gray-500">{opp.company.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-white font-bold text-lg leading-snug group-hover:text-primary transition-colors">
                          {opp.title}
                        </h3>
                        <p className="text-primary text-sm font-semibold flex items-center gap-2 mt-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          {opp.company}
                        </p>
                      </div>
                    </div>
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

                  {opp.tags && opp.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {opp.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-bold">
                          #{tag}
                        </span>
                      ))}
                      {opp.tags.length > 3 && (
                        <span className="text-[10px] text-gray-500 font-bold">+{opp.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mt-2">
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
                  
                  {(opp.external || opp.applyUrl || opp.registration_link) ? (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirm = await showConfirm("You are being redirected to the original internship provider to complete your application.");
                        if (confirm) {
                          try {
                            await api.post('/applications/external', { opportunity_id: opp.id });
                            setAppliedIds(prev => new Set([...prev, opp.id]));
                          } catch (err) {
                            console.error("Failed to log external apply", err);
                          }
                          window.open(opp.applyUrl || opp.registration_link, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="btn-primary text-sm px-5 py-2 rounded-xl flex items-center gap-2"
                    >
                      🌐 Apply Externally
                    </button>
                  ) : isApplied ? (
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