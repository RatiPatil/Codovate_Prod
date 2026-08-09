import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import {
  Search, MapPin, Clock, Laptop, Briefcase, Heart,
  Share2, X, AlertCircle, ChevronDown, ArrowRight,
  GraduationCap, Trophy, BookOpen, Users, RefreshCw,
  Calendar, Star, Building2, ExternalLink,
} from 'lucide-react';

/* ─── Work-mode filter tabs ─── */
const WORK_TABS = [
  { id: 'all',    label: 'All'      },
  { id: 'remote', label: 'Remote'   },
  { id: 'onsite', label: 'On-site'  },
  { id: 'hybrid', label: 'Hybrid'   },
];

/* ─── Page config per type ─── */
const PAGE_CONFIG = {
  internship:  { title: 'Internships',  subtitle: 'Find internships that match your skills.',  Icon: GraduationCap },
  job:         { title: 'Jobs',         subtitle: 'Browse full-time roles from top companies.', Icon: Briefcase     },
  competition: { title: 'Competitions', subtitle: 'Compete, win, and build your profile.',      Icon: Trophy        },
  all:         { title: 'Opportunities',subtitle: 'Discover internships, jobs, and more.',      Icon: Briefcase     },
};

/* ─── Utilities ─── */
const fmtDate = (val) => {
  if (!val) return null;
  const d = val?.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getWorkMode = (opp) => {
  if (opp.work_mode) return opp.work_mode;
  if (opp.is_remote || opp.mode === 'remote') return 'Remote';
  if (opp.mode === 'hybrid') return 'Hybrid';
  if (opp.location) return opp.location;
  return 'On-site';
};

/* ─── Skill Tag ─── */
const Tag = ({ label, variant = 'skill' }) => {
  const classes = {
    skill:    'bg-slate-100 text-slate-700 border border-slate-200',
    meta:     'bg-blue-50 text-blue-700 border border-blue-100',
    location: 'bg-amber-50 text-amber-700 border border-amber-100',
  }[variant] || 'bg-slate-100 text-slate-700';

  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${classes}`}>
      {label}
    </span>
  );
};

/* ─── Status Badge ─── */
const StatusDot = ({ isOpen }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
    isOpen
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : 'bg-slate-100 text-slate-500 border border-slate-200'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    {isOpen ? 'Open' : 'Closed'}
  </span>
);

/* ═══════════════════════════════════════════════════════
   OPPORTUNITY ROW CARD (Wireframe layout)
═══════════════════════════════════════════════════════ */
const OppCard = ({ opp, saved, onSave }) => {
  const navigate = useNavigate();

  const isOpen     = opp.is_active !== false && !['closed','inactive'].includes((opp.status || '').toLowerCase());
  const workMode   = getWorkMode(opp);
  const skills     = (opp.required_skills || []).slice(0, 4);
  const hiddenSkills = (opp.required_skills || []).length - skills.length;
  const deadline   = fmtDate(opp.deadline || opp.application_deadline);
  const posted     = fmtDate(opp.created_at);
  const noExp      = !opp.experience_required || /fresher|no prior|0 year|^0$/i.test(opp.experience_required);

  const metaTags = [
    workMode,
    opp.employment_type || opp.duration || null,
    opp.stipend ? `₹${opp.stipend}` : (opp.salary ? `₹${opp.salary}` : null),
  ].filter(Boolean);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:border-indigo-300/60 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">

        {/* Company Avatar */}
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center font-extrabold text-indigo-600 text-lg overflow-hidden">
          {opp.company_logo_url
            ? <img src={opp.company_logo_url} alt="" className="w-full h-full object-contain p-1.5" />
            : (opp.company || 'C').charAt(0).toUpperCase()
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Title + Company */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                {opp.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-sm font-semibold text-slate-600">
                  <Building2 size={13} className="text-slate-400" />
                  {opp.company || opp.organization || 'Company'}
                </span>
                <StatusDot isOpen={isOpen} />
              </div>
            </div>

            {/* Match Score */}
            {opp.match_score != null && (
              <div className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl border font-extrabold ${
                opp.match_score >= 70
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : opp.match_score >= 40
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                <span className="text-base leading-none">{opp.match_score}</span>
                <span className="text-[9px] font-bold mt-0.5">match</span>
              </div>
            )}
          </div>

          {/* Meta Tags Row: location • duration • stipend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 font-medium">
            {noExp && (
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <Star size={11} className="fill-amber-400 stroke-amber-400" />
                No prior experience required
              </span>
            )}
            {metaTags.map((t, i) => (
              <span key={i} className="flex items-center gap-1">
                {i === 0 && (workMode.toLowerCase() === 'remote' ? <Laptop size={12} /> : <MapPin size={12} />)}
                {i === 1 && <Clock size={12} />}
                <span className={i === 2 ? 'font-extrabold text-emerald-700' : ''}>{t}</span>
                {i < metaTags.length - 1 && <span className="ml-2 text-slate-300">·</span>}
              </span>
            ))}
          </div>

          {/* Skill Tags */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skills.map(s => <Tag key={s} label={s} variant="skill" />)}
              {hiddenSkills > 0 && (
                <span className="text-[11px] font-semibold text-slate-400 px-1 py-1">+{hiddenSkills}</span>
              )}
            </div>
          )}

          {/* Bottom Row: Deadline + Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              {deadline && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  <span>Deadline: <strong className="text-slate-700">{deadline}</strong></span>
                </span>
              )}
              {!deadline && posted && (
                <span>Posted {posted}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Save */}
              <button
                onClick={e => { e.stopPropagation(); onSave?.(opp.id); }}
                className={`p-2 rounded-xl transition-colors ${
                  saved ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-400 hover:bg-red-50'
                }`}
                aria-label="Save"
              >
                <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
              </button>

              {/* Share */}
              <button
                onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(`${window.location.origin}/opportunities/${opp.id}`); }}
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                aria-label="Share"
              >
                <Share2 size={15} />
              </button>

              {/* View Button */}
              <button
                onClick={() => navigate(`/opportunities/${opp.id}`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                View <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

/* ─── Card Skeleton ─── */
const CardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 animate-pulse">
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-slate-200 rounded-xl w-3/5" />
        <div className="h-4 bg-slate-100 rounded-xl w-2/5" />
        <div className="h-4 bg-slate-100 rounded-xl w-4/5" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-24 bg-slate-100 rounded-lg" />
          <div className="h-6 w-20 bg-slate-100 rounded-lg" />
          <div className="h-6 w-16 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex justify-between pt-3 border-t border-slate-100">
          <div className="h-4 w-36 bg-slate-100 rounded" />
          <div className="h-8 w-20 bg-indigo-100 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   MAIN OPPORTUNITIES / INTERNSHIPS PAGE
═══════════════════════════════════════════════════════ */
const Opportunities = () => {
  const navigate   = useNavigate();
  const { type: urlType } = useParams();

  const [activeType,    setActiveType]    = useState(urlType || 'internship');
  const [workTab,       setWorkTab]       = useState('all');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [savedIds,      setSavedIds]      = useState(new Set());

  /* Sync type from URL param */
  useEffect(() => {
    const t = urlType || 'internship';
    if (t !== activeType) {
      setActiveType(t);
      setWorkTab('all');
      setSearchQuery('');
      setLocationQuery('');
    }
  }, [urlType]);

  /* Fetch from backend */
  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (activeType && activeType !== 'all') params.append('type', activeType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      const res  = await api.get(`/opportunities?${params.toString()}`);
      const data = Array.isArray(res.data) ? res.data :
                   Array.isArray(res.data?.opportunities) ? res.data.opportunities : [];
      setOpportunities(data);
    } catch {
      setError('Could not load opportunities. Please try again.');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [activeType, searchQuery]);

  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  /* Client-side work mode filter */
  const filtered = opportunities.filter(o => {
    const mode = getWorkMode(o).toLowerCase();
    if (workTab === 'remote') return mode.includes('remote');
    if (workTab === 'onsite') return mode.includes('on-site') || mode.includes('onsite') || (!mode.includes('remote') && !mode.includes('hybrid'));
    if (workTab === 'hybrid') return mode.includes('hybrid');
    return true; // 'all'
  }).filter(o => {
    if (!locationQuery.trim()) return true;
    const loc = (getWorkMode(o) + ' ' + (o.location || '')).toLowerCase();
    return loc.includes(locationQuery.toLowerCase());
  });

  const config = PAGE_CONFIG[activeType] || PAGE_CONFIG.all;
  const PageIcon = config.Icon;

  return (
    <div className="w-full font-sans pb-16 space-y-5 max-w-4xl">

      {/* ── PAGE HEADING ─────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <PageIcon size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {config.title}
            </h1>
            <p className="text-sm text-slate-500 font-medium">{config.subtitle}</p>
          </div>
        </div>
      </div>

      {/* ── TYPE TABS ────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'internship',  label: 'Internships',   Icon: GraduationCap },
          { id: 'job',         label: 'Jobs',           Icon: Briefcase     },
          { id: 'competition', label: 'Competitions',   Icon: Trophy        },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveType(id); setWorkTab('all'); navigate(`/opportunities/${id}`, { replace: true }); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              activeType === id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── WORK MODE FILTER TABS ─────────────────────── */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {WORK_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setWorkTab(id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              workTab === id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── SEARCH + LOCATION ROW ──────────────────────── */}
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') fetchOpportunities(); }}
            placeholder={`Search ${config.title.toLowerCase()}...`}
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); fetchOpportunities(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Location filter */}
        <div className="relative w-44 shrink-0">
          <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={locationQuery}
            onChange={e => setLocationQuery(e.target.value)}
            placeholder="Location"
            className="w-full h-11 pl-9 pr-8 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchOpportunities}
          disabled={loading}
          className="h-11 w-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors disabled:opacity-50 shrink-0"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── RESULTS COUNT ──────────────────────────────── */}
      {!loading && !error && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">
            <span className="text-indigo-600 font-extrabold">{filtered.length}</span>{' '}
            {config.title.toLowerCase()}{filtered.length !== 1 ? '' : ''}
            {searchQuery && <span className="font-normal text-slate-400"> for "{searchQuery}"</span>}
          </p>
          {(workTab !== 'all' || locationQuery) && (
            <button
              onClick={() => { setWorkTab('all'); setLocationQuery(''); }}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <X size={11} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── CARDS LIST ─────────────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-12 text-center space-y-3">
            <AlertCircle size={32} className="text-red-400 mx-auto" />
            <p className="font-semibold text-red-600 text-sm">{error}</p>
            <button
              onClick={fetchOpportunities}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto">
              <Briefcase size={28} className="text-indigo-400" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-800">No {config.title} Found</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              {searchQuery
                ? `No results for "${searchQuery}". Try different keywords.`
                : workTab !== 'all'
                ? `No ${workTab} ${config.title.toLowerCase()} right now. Try "All".`
                : 'New opportunities are added regularly. Check back soon!'
              }
            </p>
            <button
              onClick={() => { setSearchQuery(''); setWorkTab('all'); setLocationQuery(''); }}
              className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-bold hover:bg-indigo-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filtered.map(opp => (
            <OppCard
              key={opp.id}
              opp={opp}
              saved={savedIds.has(opp.id)}
              onSave={id => setSavedIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id); else next.add(id);
                return next;
              })}
            />
          ))
        )}
      </div>

    </div>
  );
};

export default Opportunities;