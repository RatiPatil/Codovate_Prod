import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import SkeletonLoader from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';
import { useToast } from '../components/ui/ToastProvider';

const Dashboard = () => {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedJobs, setSavedJobs] = useState({});
  const { addToast } = useToast();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        const res = await api.get('/students/workspace');
        setWorkspace(res.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load your student command center.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, []);

  useEffect(() => {
    if (!loading && workspace && containerRef.current) {
      const sections = containerRef.current.querySelectorAll('.dashboard-section');
      gsap.fromTo(
        sections,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [loading, workspace]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/opportunities?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/opportunities');
    }
  };

  const toggleSaveJob = (jobId) => {
    setSavedJobs(prev => {
      const newState = !prev[jobId];
      addToast({
        type: 'info',
        title: newState ? 'Saved' : 'Removed',
        message: newState ? 'Opportunity saved to your bookmarks.' : 'Removed from bookmarks.'
      });
      return { ...prev, [jobId]: newState };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32 max-w-7xl mx-auto space-y-8">
        <div className="h-12 bg-white/10 rounded-xl w-1/3 animate-pulse" />
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  if (error && !workspace) return <ErrorState message={error} />;
  if (!workspace) return null;

  const profile = workspace.profile || {};
  const recentApps = workspace.recentApps || [];
  const recommendedJobs = workspace.recommendedJobs || [];
  const placementReadiness = workspace.placementReadiness || {};

  const completionScore = profile.profile_completion || 0;

  // Filter recommended jobs if search query is entered
  const filteredJobs = searchQuery.trim()
    ? recommendedJobs.filter(j => 
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        j.company.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recommendedJobs;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32 max-w-7xl mx-auto pb-32 space-y-8 font-inter">
      
      {/* ── HEADER & SEARCH ─────────────────────────────────────────────── */}
      <section className="dashboard-section flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Dashboard</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            Welcome back, <span className="text-white font-semibold">{profile.name || 'Student'}</span>! 👋
          </p>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search opportunities, skills, companies..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white/[0.05] transition-all"
          />
          <svg className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>
      </section>

      {/* ── ROW 1: YOUR NEXT STEP & PROFILE STRENGTH RING ──────────────── */}
      <section className="dashboard-section grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Your Next Step Hero Banner (65%) */}
        <div className="lg:col-span-8 bg-gradient-to-r from-primary/20 via-purple-900/10 to-transparent border border-primary/30 rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-white">
                🚀 Your Next Step
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                {completionScore < 100 ? 'Complete your profile to unlock better opportunities' : 'Your profile is ready to apply'}
              </h2>
            </div>
            {/* Visual Icon */}
            <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 items-center justify-center text-3xl shrink-0 shadow-lg shadow-primary/20">
              👤
            </div>
          </div>

          {/* Progress Bar & Actions */}
          <div className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-400">Profile Completion</span>
                <span className="text-primary font-black">{completionScore}% Complete</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full transition-all duration-1000"
                  style={{ width: `${completionScore}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Link
                to="/profile"
                className="btn-primary py-3 px-6 rounded-xl font-bold text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all"
              >
                Complete Profile
              </Link>
              <Link to="/profile" className="text-xs font-bold text-gray-300 hover:text-white transition-colors">
                View Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Profile Strength Radial Ring (35%) */}
        <div className="lg:col-span-4 bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col justify-between items-center text-center relative overflow-hidden backdrop-blur-xl">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider w-full text-left">Profile Strength</h3>

          {/* Radial SVG Gauge */}
          <div className="relative w-36 h-36 my-4 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" className="text-white/10" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#purpleGrad)"
                strokeWidth="10"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * completionScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2015ff" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{completionScore}%</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {completionScore >= 80 ? 'Strong' : completionScore >= 50 ? 'Moderate' : 'Needs Setup'}
              </span>
            </div>
          </div>

          <Link to="/profile" className="text-xs font-bold text-primary hover:underline">
            Improve Profile →
          </Link>
        </div>

      </section>

      {/* ── ROW 2: 4 REAL METRICS CARDS ─────────────────────────────────── */}
      <section className="dashboard-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Applications */}
        <div onClick={() => navigate('/applications')} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all cursor-pointer group flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400">Applications</span>
            <p className="text-2xl font-black text-white">{profile.appsCount || 0}</p>
            <span className="text-[11px] font-medium text-emerald-400 block">
              ↑ active applications
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl text-blue-400 group-hover:scale-110 transition-transform">
            💼
          </div>
        </div>

        {/* Metric 2: Interviews */}
        <div onClick={() => navigate('/applications')} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all cursor-pointer group flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400">Interviews</span>
            <p className="text-2xl font-black text-white">{profile.interviewsCount || 0}</p>
            <span className="text-[11px] font-medium text-purple-400 block">
              ↑ scheduled interviews
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl text-purple-400 group-hover:scale-110 transition-transform">
            👥
          </div>
        </div>

        {/* Metric 3: Shortlisted */}
        <div onClick={() => navigate('/applications')} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all cursor-pointer group flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400">Shortlisted</span>
            <p className="text-2xl font-black text-white">{profile.shortlistsCount || 0}</p>
            <span className="text-[11px] font-medium text-amber-400 block">
              ↑ under review
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl text-amber-400 group-hover:scale-110 transition-transform">
            ⭐
          </div>
        </div>

        {/* Metric 4: Offers */}
        <div onClick={() => navigate('/applications')} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all cursor-pointer group flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400">Offers</span>
            <p className="text-2xl font-black text-white">{profile.offersCount || 0}</p>
            <span className="text-[11px] font-medium text-emerald-400 block">
              {(profile.offersCount || 0) > 0 ? '🎉 Congratulations!' : '↑ active offers'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl text-emerald-400 group-hover:scale-110 transition-transform">
            🛍️
          </div>
        </div>

      </section>

      {/* ── ROW 3: RECOMMENDED OPPORTUNITIES & APPLICATION TRACKER ──────── */}
      <section className="dashboard-section grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recommended Opportunities (60%) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Recommended Opportunities</h2>
            <Link to="/opportunities" className="text-xs font-bold text-primary hover:underline">
              View All →
            </Link>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center space-y-3">
              <p className="text-gray-400 text-sm font-medium">No live opportunities matching your search right now.</p>
              <Link to="/opportunities" className="inline-block btn-primary text-xs px-4 py-2 rounded-lg font-bold">
                Browse All Opportunities
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map(job => (
                <div key={job.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary text-sm shrink-0">
                      {job.company?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{job.company}</h3>
                      <p className="text-xs text-gray-400 font-medium">{job.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-500">📍 {job.location}</span>
                        <span className="text-[10px] text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10">{job.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-gray-300 hidden sm:inline">{job.salary}</span>
                    <button
                      type="button"
                      onClick={() => toggleSaveJob(job.id)}
                      className="text-gray-400 hover:text-yellow-400 text-sm transition-colors"
                      title="Bookmark Job"
                    >
                      {savedJobs[job.id] ? '★' : '☆'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/opportunities')}
                      className="btn-primary text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-md shadow-primary/20"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Application Tracker (40%) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Application Tracker</h2>
            <Link to="/applications" className="text-xs font-bold text-primary hover:underline">
              View All →
            </Link>
          </div>

          {recentApps.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center space-y-3">
              <p className="text-gray-400 text-sm font-medium">You haven't submitted any applications yet.</p>
              <Link to="/opportunities" className="inline-block btn-primary text-xs px-4 py-2 rounded-lg font-bold">
                Find Roles & Apply
              </Link>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
              {recentApps.map(app => (
                <div key={app.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400 text-xs shrink-0">
                      📋
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{app.company}</h3>
                      <p className="text-xs text-gray-400 font-medium">{app.title}</p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      app.status === 'Offer' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      app.status === 'Interview' || app.status === 'Scheduled' || app.status === 'Interview Scheduled' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      app.status === 'Under Review' || app.status === 'Shortlisted' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {app.status}
                    </span>
                    <span className="text-[10px] text-gray-500 block font-medium">Recent</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>

      {/* ── ROW 4: AI CAREER COACH INSIGHT BANNER ──────────────────────── */}
      <section className="dashboard-section bg-gradient-to-r from-purple-900/30 via-primary/20 to-transparent border border-purple-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0 shadow-lg shadow-purple-500/20">
            🤖
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">AI Career Coach</h3>
            <p className="text-sm md:text-base font-semibold text-white leading-relaxed">
              {placementReadiness.improvements?.[0] || 'Add React.js to your skills to increase your match score by 40% for Frontend Developer roles.'}
            </p>
          </div>
        </div>

        <Link
          to="/profile"
          className="btn-primary py-3 px-5 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all whitespace-nowrap block shrink-0"
        >
          + Get AI Advice
        </Link>
      </section>

    </div>
  );
};

export default Dashboard;