import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bookmark, BookmarkCheck, MapPin, Clock, Sparkles, Briefcase, Users, Star, ShoppingBag, ArrowUpRight, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../components/ui/ToastProvider';
import { useAuth } from '../context/AuthContext';

/* ── Skeleton placeholder ─────────────────────────────────────── */
const Skel = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

/* ── Circular SVG progress ring ───────────────────────────────── */
const RingProgress = ({ pct = 0, size = 96 }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={8} fill="none" stroke="#e8e6ff" />
      <circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={8} fill="none"
        stroke="url(#ringGrad)" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={dash}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6c3aff" />
          <stop offset="100%" stopColor="#3a9bff" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/* ── Stat label helpers ───────────────────────────────────────── */
const statMeta = {
  applications: {
    Icon: Briefcase,
    bg: 'bg-blue-50',
    color: 'text-blue-600',
    label: 'Applications',
    weekLabel: (n) => n > 0 ? `↑ ${n} this week` : 'No change',
  },
  interviews: {
    Icon: Users,
    bg: 'bg-purple-50',
    color: 'text-purple-600',
    label: 'Interviews',
    weekLabel: (n) => n > 0 ? `↑ ${n} this week` : 'No change',
  },
  shortlisted: {
    Icon: Star,
    bg: 'bg-indigo-50',
    color: 'text-indigo-600',
    label: 'Shortlisted',
    weekLabel: (n) => n > 0 ? `↑ ${n} this week` : 'No change',
  },
  offers: {
    Icon: ShoppingBag,
    bg: 'bg-orange-50',
    color: 'text-orange-500',
    label: 'Offers',
    weekLabel: (n) => n > 0 ? '🎉 Congratulations!' : 'Keep applying!',
  },
};

/* ── Status badge colours for Application Tracker ─────────────── */
const statusConfig = (status = '') => {
  const s = status.toLowerCase();
  if (s.includes('interview') || s.includes('scheduled')) return { label: 'Interview Scheduled', cls: 'bg-blue-50 text-blue-600 border-blue-200' };
  if (s.includes('offer') || s.includes('accepted'))        return { label: 'Offer Received',      cls: 'bg-green-50 text-green-600 border-green-200' };
  if (s.includes('review') || s.includes('shortlist'))      return { label: 'Under Review',         cls: 'bg-orange-50 text-orange-500 border-orange-200' };
  if (s.includes('reject'))                                  return { label: 'Rejected',             cls: 'bg-red-50 text-red-500 border-red-200' };
  return { label: 'Applied', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
};

/* ── Company logo tile (initial letter) ───────────────────────── */
const COMPANY_COLORS = ['bg-red-500', 'bg-blue-600', 'bg-green-600', 'bg-orange-500', 'bg-purple-600', 'bg-pink-600', 'bg-teal-600'];
const companyColor = (name = '') => COMPANY_COLORS[name.charCodeAt(0) % COMPANY_COLORS.length];

const CompanyLogo = ({ name = '', size = 'md' }) => {
  const sz = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm';
  return (
    <div className={`${sz} ${companyColor(name)} rounded-xl flex items-center justify-center font-bold text-white shrink-0`}>
      {name.charAt(0).toUpperCase() || '?'}
    </div>
  );
};

/* ── Time-ago helper ──────────────────────────────────────────── */
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return 'Today';
  if (d === 1) return '1 day ago';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} week${Math.floor(d / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(d / 30)} month${Math.floor(d / 30) > 1 ? 's' : ''} ago`;
};

/* ═══════════════════════════════════════════════════════════════ */
/*  DASHBOARD                                                      */
/* ═══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user }     = useAuth();
  const { addToast } = useToast();
  const navigate     = useNavigate();

  const [workspace,    setWorkspace]    = useState(null);
  const [opportunities,setOpportunities]= useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [applyingId,   setApplyingId]   = useState(null);
  const [savedJobs,    setSavedJobs]    = useState(new Set());
  const [search,       setSearch]       = useState('');

  /* ── Data fetch (parallel) ──────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wsRes, oppsRes] = await Promise.all([
        api.get('/students/workspace').catch(() => ({ data: null })),
        api.get('/opportunities').catch(() => ({ data: [] })),
      ]);
      if (wsRes.data) setWorkspace(wsRes.data);
      else setError('Could not load workspace data.');

      const raw = oppsRes.data;
      const arr = Array.isArray(raw) ? raw : (raw?.opportunities || wsRes.data?.recommendedOpps || []);
      setOpportunities(arr);
    } catch {
      setError('Connection failed. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Apply handler ──────────────────────────────────────────── */
  const handleApply = async (oppId) => {
    setApplyingId(oppId);
    try {
      await api.post('/applications', { opportunity_id: oppId });
      addToast({ type: 'success', title: 'Applied!', message: 'Application submitted successfully.' });
      fetchAll();
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Could not apply.' });
    } finally { setApplyingId(null); }
  };

  /* ── Save toggle ────────────────────────────────────────────── */
  const toggleSave = (id) => {
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); addToast({ type: 'info', title: 'Removed from saved' }); }
      else               { next.add(id);    addToast({ type: 'success', title: 'Saved!' }); }
      return next;
    });
  };

  /* ── Derived values ─────────────────────────────────────────── */
  const profile      = workspace?.profile || {};
  const stats        = workspace?.stats   || { applications: 0, interviews: 0, shortlisted: 0, offers: 0 };
  const applications = workspace?.applications || [];
  const completionPct= profile.profile_completion ?? 0;
  const studentName  = profile.name || user?.name || 'Student';
  const aiAdvice     = workspace?.recommendations?.[0] || null;

  const displayOpps = opportunities
    .filter(o =>
      !search ||
      o.title?.toLowerCase().includes(search.toLowerCase()) ||
      o.company?.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 3);

  const trackerApps = applications.slice(0, 3);

  /* ── Hero CTA logic ─────────────────────────────────────────── */
  const heroCTA = completionPct < 80
    ? { title: 'Your Next Step', sub: 'Complete your profile to unlock better opportunities', btn: 'Complete Profile', link: '/profile' }
    : !profile.has_resume
      ? { title: 'Upload Your Resume', sub: 'Add your resume to unlock 1-click applications', btn: 'Upload Resume', link: '/profile' }
      : { title: 'Start Applying!', sub: `Your profile is ready. Explore opportunities tailored for ${profile.career_goal || 'you'}.`, btn: 'Browse Opportunities', link: '/opportunities' };

  /* ── Loading skeleton ───────────────────────────────────────── */
  if (loading) return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Skel className="h-8 w-48" />
      <Skel className="h-5 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3"><Skel className="h-44 w-full rounded-2xl" /></div>
        <Skel className="h-44 w-full rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skel key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Skel className="lg:col-span-3 h-72 w-full rounded-2xl" />
        <Skel className="lg:col-span-2 h-72 w-full rounded-2xl" />
      </div>
    </div>
  );

  /* ── Error state ────────────────────────────────────────────── */
  if (error && !workspace) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <p className="text-gray-500 text-sm">{error}</p>
      <button onClick={fetchAll} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-all">
        Retry
      </button>
    </div>
  );

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-5 pb-12">

      {/* ── PAGE TITLE + SEARCH ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {studentName}! 👋</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search opportunities, skills, companies..."
            className="pl-9 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-80 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* ── ROW 1: HERO + PROFILE STRENGTH ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Hero Card */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between min-h-[172px] relative overflow-hidden">
          {/* Soft background accent */}
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-indigo-50/60 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🚀</span>
              <h2 className="text-lg font-bold text-gray-900">{heroCTA.title}</h2>
            </div>
            <p className="text-gray-500 text-sm mb-4 max-w-md">{heroCTA.sub}</p>

            {/* Progress bar */}
            <div className="max-w-lg">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${completionPct}%`,
                      background: 'linear-gradient(90deg, #6c3aff, #3a9bff)',
                    }}
                  />
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: '#6c3aff' }}>
                  {completionPct}% Complete
                </span>
              </div>
            </div>
          </div>

          {/* Illustration + Buttons */}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4">
            {/* Decorative document SVG */}
            <div className="hidden md:flex absolute right-24 top-1/2 -translate-y-1/2 opacity-70" aria-hidden>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="15" y="10" width="70" height="80" rx="8" fill="#e8e6ff" />
                <rect x="25" y="28" width="50" height="5" rx="2.5" fill="#c4b5fd" />
                <rect x="25" y="38" width="40" height="5" rx="2.5" fill="#c4b5fd" />
                <rect x="25" y="48" width="45" height="5" rx="2.5" fill="#c4b5fd" />
                <circle cx="70" cy="72" r="18" fill="#6c3aff" />
                <path d="M63 72l5 5 9-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="50" cy="18" r="14" fill="#818cf8" />
                <circle cx="50" cy="16" r="6" fill="white" />
                <path d="M41 30c0-5 4-8 9-8s9 3 9 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(heroCTA.link)}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #6c3aff, #3a9bff)' }}
              >
                {heroCTA.btn}
              </button>
              <Link
                to="/profile"
                className="text-sm font-semibold flex items-center gap-1 hover:underline"
                style={{ color: '#6c3aff' }}
              >
                View Profile <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Strength Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-between text-center">
          <p className="font-bold text-gray-800 text-sm mb-3">Profile Strength</p>
          <div className="relative">
            <RingProgress pct={completionPct} size={92} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-gray-900">{completionPct}%</span>
              <span className="text-[10px] text-gray-400 font-semibold">
                {completionPct >= 80 ? 'Strong' : completionPct >= 50 ? 'Good' : 'Weak'}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="mt-3 text-sm font-semibold flex items-center gap-1 hover:underline"
            style={{ color: '#6c3aff' }}
          >
            Improve Profile <ChevronRight size={14} />
          </button>
        </div>

      </div>

      {/* ── ROW 2: STATS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['applications', 'interviews', 'shortlisted', 'offers']).map(key => {
          const meta = statMeta[key];
          const val  = stats[key] ?? 0;
          const wkly = stats[`${key}_this_week`] ?? 0;
          return (
            <button
              key={key}
              onClick={() => navigate(key === 'applications' || key === 'offers' ? '/applications' : '/applications')}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3 text-left hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div className={`${meta.bg} ${meta.color} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
                <meta.Icon size={20} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{meta.label}</p>
                <p className="text-2xl font-black text-gray-900 leading-tight">{val}</p>
                <p className={`text-xs mt-0.5 font-medium ${key === 'offers' && val > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                  {meta.weekLabel(wkly)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── ROW 3: OPPORTUNITIES + TRACKER ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Recommended Opportunities */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-base">Recommended Opportunities</h3>
            <Link
              to="/opportunities"
              className="text-xs font-semibold flex items-center gap-0.5 hover:underline"
              style={{ color: '#6c3aff' }}
            >
              View All <ArrowUpRight size={13} />
            </Link>
          </div>

          {displayOpps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
              <Briefcase size={32} strokeWidth={1.2} className="text-gray-300" />
              <p className="text-sm">{search ? 'No matches found' : 'No opportunities available right now'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 space-y-0">
              {displayOpps.map((opp) => {
                const id      = opp.id || opp._id;
                const saved   = savedJobs.has(id);
                const applying = applyingId === id;
                return (
                  <div key={id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <CompanyLogo name={opp.company || opp.title} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{opp.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{opp.company || 'Tech Company'}</p>
                            <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                              {opp.location && (
                                <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                                  <MapPin size={10} /> {opp.location}
                                </span>
                              )}
                              {(opp.type || opp.job_type) && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-purple-600 bg-purple-50">
                                  {opp.type || opp.job_type}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {(opp.stipend || opp.salary) && (
                              <span className="text-xs font-bold text-gray-800">{opp.stipend || opp.salary} / month</span>
                            )}
                            <button
                              onClick={() => toggleSave(id)}
                              className="text-gray-300 hover:text-primary transition-colors"
                              aria-label={saved ? 'Unsave' : 'Save'}
                            >
                              {saved
                                ? <BookmarkCheck size={17} className="text-primary" />
                                : <Bookmark size={17} />
                              }
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2.5 gap-2">
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock size={10} /> Posted {timeAgo(opp.created_at || opp.createdAt)}
                          </span>
                          <button
                            onClick={() => handleApply(id)}
                            disabled={applying}
                            className="px-4 py-1.5 rounded-xl text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5"
                            style={{ background: 'linear-gradient(135deg, #6c3aff, #3a9bff)' }}
                          >
                            {applying && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            Apply Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Application Tracker */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-base">Application Tracker</h3>
            <Link
              to="/applications"
              className="text-xs font-semibold flex items-center gap-0.5 hover:underline"
              style={{ color: '#6c3aff' }}
            >
              View All <ArrowUpRight size={13} />
            </Link>
          </div>

          {trackerApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
              <ClipboardListIcon />
              <p className="text-sm text-center">No applications yet.<br />Apply to get started!</p>
              <Link to="/opportunities" className="text-xs font-semibold mt-1 hover:underline" style={{ color: '#6c3aff' }}>
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {trackerApps.map((app) => {
                const badge = statusConfig(app.status);
                return (
                  <div key={app.id || app._id} className="flex items-start gap-3">
                    <CompanyLogo name={app.company_name || app.opportunity_title || 'C'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {app.company_name || app.opportunity_title || 'Application'}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">{app.role || app.job_title || 'Position'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.cls}`}>
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-gray-400">{timeAgo(app.applied_at || app.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── ROW 4: AI CAREER COACH ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-center gap-4">
        {/* Robot Illustration */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
          style={{ background: 'linear-gradient(135deg, #6c3aff22, #3a9bff22)' }}
        >
          🤖
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base">AI Career Coach</h3>
          {aiAdvice ? (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {aiAdvice.description || aiAdvice.title || aiAdvice}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-0.5">
              Get personalised career recommendations based on your profile and goals.
            </p>
          )}
        </div>

        <button
          onClick={() => navigate(aiAdvice?.linkUrl || '/career-coach')}
          className="shrink-0 px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md"
          style={{ background: 'linear-gradient(135deg, #6c3aff, #3a9bff)' }}
        >
          <Sparkles size={15} />
          Get AI Advice
        </button>
      </div>

    </div>
  );
};

/* Small fallback icon for empty tracker */
const ClipboardListIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

export default Dashboard;