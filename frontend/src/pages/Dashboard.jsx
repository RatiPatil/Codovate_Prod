import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { useToast } from '../components/ui/ToastProvider';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [workspace, setWorkspace] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [wsRes, oppsRes] = await Promise.all([
        api.get('/students/workspace').catch(() => ({ data: null })),
        api.get('/opportunities').catch(() => ({ data: [] }))
      ]);

      if (wsRes.data) {
        setWorkspace(wsRes.data);
      } else {
        setError('Unable to fetch workspace details.');
      }

      const oppsData = Array.isArray(oppsRes.data) 
        ? oppsRes.data 
        : (oppsRes.data?.opportunities || wsRes.data?.recommendedOpps || []);
      setOpportunities(oppsData);

    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError('Failed to connect to Codovate services. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Entrance animation
  useEffect(() => {
    if (!loading && workspace && containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.dash-card');
      gsap.fromTo(cards,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' }
      );
    }
  }, [loading, workspace]);

  // Apply to Opportunity handler
  const handleApply = async (oppId) => {
    try {
      setApplyingId(oppId);
      await api.post('/applications', { opportunity_id: oppId });
      addToast({ type: 'success', title: 'Application Submitted!', message: 'Your profile was sent to the employer.' });
      // Refresh dashboard workspace data to update application counts & status
      fetchDashboardData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application.';
      addToast({ type: 'error', title: 'Application Error', message: msg });
    } finally {
      setApplyingId(null);
    }
  };

  // Toggle Save Job handler
  const toggleSave = (oppId) => {
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (next.has(oppId)) {
        next.delete(oppId);
        addToast({ type: 'info', title: 'Removed', message: 'Job removed from saved list.' });
      } else {
        next.add(oppId);
        addToast({ type: 'success', title: 'Saved!', message: 'Job saved to your bookmarks.' });
      }
      return next;
    });
  };

  if (loading) return <Loader fullScreen />;
  if (error && !workspace) return <ErrorState message={error} onRetry={fetchDashboardData} />;
  if (!workspace) return null;

  const profile = workspace.profile || {};
  const stats = workspace.stats || {
    applications: profile.appsCount || 0,
    interviews: 0,
    shortlisted: 0,
    offers: 0
  };

  const completionPct = profile.profile_completion || 0;
  const hasResume = profile.has_resume;
  const latestApp = workspace.latestApp;

  // Determine Primary CTA based on onboarding & profile status
  const getPrimaryCTA = () => {
    if (completionPct < 80) {
      return {
        title: 'Complete Profile Details',
        subtitle: 'Fill in your education & skills to stand out to top recruiters.',
        btnText: 'Complete Profile',
        badge: 'Required',
        accent: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
        action: () => navigate('/profile')
      };
    }
    if (!hasResume) {
      return {
        title: 'Upload Your Resume',
        subtitle: 'Add your resume to unlock 1-click application submissions.',
        btnText: 'Upload Resume',
        badge: 'Recommended',
        accent: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
        action: () => navigate('/profile')
      };
    }
    return {
      title: 'Apply to Top Opportunities',
      subtitle: `Your profile is ready! Explore live tier-1 internships tailored for ${profile.career_goal || 'you'}.`,
      btnText: 'Explore Opportunities',
      badge: 'Ready ✓',
      accent: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
      action: () => navigate('/opportunities')
    };
  };

  const heroCTA = getPrimaryCTA();

  // Helper to determine tracker timeline step
  const getTrackerStep = (status) => {
    if (!status) return 1;
    const s = status.toLowerCase();
    if (s.includes('offer') || s.includes('accepted')) return 4;
    if (s.includes('interview')) return 3;
    if (s.includes('review') || s.includes('shortlisted')) return 2;
    return 1; // Applied
  };

  const trackerStep = latestApp ? getTrackerStep(latestApp.status) : 0;

  // Filtered opportunities for Section 3
  const displayOpps = opportunities
    .filter(o => !searchQuery || o.title?.toLowerCase().includes(searchQuery.toLowerCase()) || o.company?.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 4);

  // Single AI Coach Recommendation
  const aiAdvice = workspace.recommendations?.[0] || {
    title: `Focus on ${profile.career_goal || 'Software Engineering'} core skills`,
    description: 'Complete 2 hands-on practice projects this week to boost your match score by +15%.',
    linkUrl: '/roadmap'
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-20 max-w-7xl mx-auto pb-32">
      
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="dash-card flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Dashboard
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">{profile.name || user?.name || 'Student'}</span> 👋
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary w-48 md:w-64 transition-all"
            />
            <span className="absolute left-3 top-2.5 text-xs text-gray-400">🔍</span>
          </div>

          {/* Notifications Link */}
          <Link to="/notifications" className="relative p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm">
            🔔
          </Link>

          {/* Profile Menu */}
          <Link to="/profile" className="flex items-center gap-2 p-1.5 pr-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
              {(profile.name || user?.name || 'S').charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-gray-300 hidden sm:inline">Profile</span>
          </Link>
        </div>
      </header>

      {/* ── MAIN LAYOUT GRID (LEFT CONTENT + RIGHT PANEL) ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (SECTIONS 1 TO 5) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION 1: YOUR NEXT STEP (Hero Card) */}
          <section className="dash-card relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 md:p-8 backdrop-blur-xl shadow-2xl transition-all hover:border-white/20">
            <div className={`absolute inset-0 bg-gradient-to-r ${heroCTA.accent} pointer-events-none`} />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/10">
                  Your Next Step
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                  {heroCTA.badge}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{heroCTA.title}</h2>
              <p className="text-gray-300 text-sm mb-6 max-w-lg">{heroCTA.subtitle}</p>

              {/* Progress Bar inside Hero */}
              <div className="mb-6 max-w-md">
                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1">
                  <span>Profile Progress</span>
                  <span className="text-primary font-bold">{completionPct}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-purple-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>

              <button
                onClick={heroCTA.action}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-0.5"
              >
                {heroCTA.btnText} →
              </button>
            </div>
          </section>

          {/* SECTION 2: QUICK STATISTICS */}
          <section className="dash-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Quick Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center hover:bg-white/[0.05] transition-all">
                <div className="text-2xl mb-1">📋</div>
                <div className="text-2xl font-black text-white">{stats.applications}</div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1">Applications</div>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center hover:bg-white/[0.05] transition-all">
                <div className="text-2xl mb-1">🎙️</div>
                <div className="text-2xl font-black text-white">{stats.interviews}</div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1">Interviews</div>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center hover:bg-white/[0.05] transition-all">
                <div className="text-2xl mb-1">⭐</div>
                <div className="text-2xl font-black text-white">{stats.shortlisted}</div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1">Shortlisted</div>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center hover:bg-white/[0.05] transition-all">
                <div className="text-2xl mb-1">🎉</div>
                <div className="text-2xl font-black text-emerald-400">{stats.offers}</div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1">Offers</div>
              </div>

            </div>
          </section>

          {/* SECTION 3: RECOMMENDED OPPORTUNITIES */}
          <section className="dash-card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Recommended Opportunities</h3>
                <p className="text-xs text-gray-400">Handpicked based on your skills & career goal</p>
              </div>
              <Link to="/opportunities" className="text-xs font-semibold text-primary hover:underline">
                View All →
              </Link>
            </div>

            {displayOpps.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center text-gray-400 text-sm">
                No active opportunities found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayOpps.map((opp) => {
                  const isApplying = applyingId === (opp.id || opp._id);
                  const oppId = opp.id || opp._id;
                  const isSaved = savedJobs.has(oppId);
                  
                  return (
                    <div 
                      key={oppId} 
                      className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 hover:bg-white/[0.05] transition-all group"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                              {opp.company ? opp.company.charAt(0).toUpperCase() : '🏢'}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm group-hover:text-primary transition-colors">{opp.title}</h4>
                              <p className="text-xs text-gray-400 font-medium">{opp.company || 'Tech Partner'}</p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => toggleSave(oppId)} 
                            className={`p-1.5 rounded-lg border transition-all text-xs ${
                              isSaved 
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                            }`}
                            title={isSaved ? 'Saved' : 'Save opportunity'}
                          >
                            {isSaved ? '★' : '☆'}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-4">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">📍 {opp.location || 'Remote'}</span>
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">💼 {opp.type || 'Full-Time'}</span>
                          {opp.stipend && <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">💰 {opp.stipend}</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => handleApply(oppId)}
                        disabled={isApplying}
                        className="w-full py-2.5 rounded-xl bg-primary/90 hover:bg-primary text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isApplying ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Applying...
                          </>
                        ) : (
                          'Apply Now'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* SECTION 4: APPLICATION TRACKER */}
          <section className="dash-card bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Application Tracker</h3>
                <p className="text-xs text-gray-400">
                  {latestApp ? `Latest: ${latestApp.opportunity_title || latestApp.role || 'Application'}` : 'No active applications being tracked yet'}
                </p>
              </div>
              <Link to="/applications" className="text-xs font-semibold text-primary hover:underline">
                View Timeline →
              </Link>
            </div>

            {/* Application Progress Timeline */}
            <div className="relative flex items-center justify-between max-w-xl mx-auto py-4">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-700" 
                style={{ width: `${trackerStep > 0 ? ((trackerStep - 1) / 3) * 100 : 0}%` }}
              />

              {[
                { step: 1, label: 'Applied' },
                { step: 2, label: 'Under Review' },
                { step: 3, label: 'Interview' },
                { step: 4, label: 'Offer' }
              ].map((st) => {
                const isActive = trackerStep >= st.step;
                const isCurrent = trackerStep === st.step;
                return (
                  <div key={st.step} className="relative z-10 flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                        isCurrent 
                          ? 'bg-primary text-white ring-4 ring-primary/30 scale-110' 
                          : isActive 
                            ? 'bg-primary text-white' 
                            : 'bg-[#151515] border border-white/20 text-gray-500'
                      }`}
                    >
                      {isActive ? '✓' : st.step}
                    </div>
                    <span className={`text-[11px] font-semibold mt-2 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 5: AI CAREER COACH */}
          <section className="dash-card bg-gradient-to-r from-purple-900/20 to-primary/20 border border-primary/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-2xl shrink-0">
                🤖
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">AI Career Recommendation</span>
                <h4 className="text-white font-bold text-sm">{aiAdvice.title}</h4>
                <p className="text-xs text-gray-300 mt-0.5">{aiAdvice.description}</p>
              </div>
            </div>

            <button
              onClick={() => navigate(aiAdvice.linkUrl || '/roadmap')}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shrink-0 transition-all shadow-md"
            >
              Take Action →
            </button>
          </section>

        </div>

        {/* RIGHT PANEL (PROFILE STRENGTH & REWARD METRICS) */}
        <div className="space-y-8">
          
          {/* PROFILE STRENGTH PANEL */}
          <section className="dash-card bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">Profile Strength</h3>

            {/* Radial Percentage Visualizer */}
            <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary transition-all duration-1000"
                  strokeDasharray={`${completionPct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{completionPct}%</span>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Completed</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-6">
              {completionPct >= 80 
                ? 'Your profile is strong and visible to partner companies!' 
                : 'Complete your profile to increase your application response rate.'}
            </p>

            <button
              onClick={() => navigate('/profile')}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
            >
              Improve Profile
            </button>
          </section>

          {/* CAREER GOAL CARD */}
          <section className="dash-card bg-white/[0.03] border border-white/10 rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Target Career Goal</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl">
                🎯
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">{profile.career_goal || 'Software Engineer'}</h4>
                <p className="text-xs text-gray-400">Target Role</p>
              </div>
            </div>
            <Link to="/roadmap" className="text-xs text-primary font-semibold hover:underline block text-right mt-2">
              View AI Roadmap →
            </Link>
          </section>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;