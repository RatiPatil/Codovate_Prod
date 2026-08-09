import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Search,
  MapPin,
  Laptop,
  Briefcase,
  Clock,
  ChevronDown,
  X,
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
} from 'lucide-react';

/* ─── Format Date Utility ─── */
const formatDate = (val) => {
  if (!val) return null;
  const d = val?.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ─── Clean Internship Card ─── */
const InternshipCard = ({ opp }) => {
  const navigate = useNavigate();

  const title       = opp.title || 'Untitled Internship';
  const company     = opp.company || opp.organizationName || opp.organization || 'Organization';
  const logo        = opp.company_logo_url || opp.logo || opp.organizationLogo;
  const location    = opp.location || '';
  const workMode    = opp.mode || opp.workMode || (opp.is_remote ? 'Remote' : location ? 'On-site' : 'Work from Home');
  const duration    = opp.duration || opp.employment_type;
  const stipend     = opp.stipend || opp.salary;
  const skills      = (opp.required_skills || opp.skills || []).slice(0, 4);
  const deadline    = formatDate(opp.deadline);
  const postedDate  = formatDate(opp.created_at);
  const isOpen      = opp.is_active !== false && !['closed', 'inactive'].includes((opp.status || '').toLowerCase());

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 hover:border-indigo-500/40 hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Organization Logo */}
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-indigo-600 text-base shrink-0 overflow-hidden">
          {logo ? (
            <img src={logo} alt={company} className="w-full h-full object-contain p-1" />
          ) : (
            company.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info Area */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Title & Company */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-slate-900 leading-snug truncate">
                {title}
              </h3>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                isOpen
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Building2 size={13} className="text-slate-400 shrink-0" />
              <span>{company}</span>
            </p>
          </div>

          {/* Details Row: Work Mode, Location, Duration, Stipend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
            {workMode && (
              <span className="flex items-center gap-1">
                {workMode.toLowerCase().includes('remote') || workMode.toLowerCase().includes('home') ? (
                  <Laptop size={12} className="text-slate-400" />
                ) : (
                  <MapPin size={12} className="text-slate-400" />
                )}
                <span>{workMode}</span>
              </span>
            )}

            {location && !workMode.toLowerCase().includes('remote') && (
              <>
                <span className="text-slate-300">·</span>
                <span>{location}</span>
              </>
            )}

            {duration && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  <span>{duration}</span>
                </span>
              </>
            )}

            {stipend ? (
              <>
                <span className="text-slate-300">·</span>
                <span className="font-bold text-emerald-700">₹{stipend}</span>
              </>
            ) : (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">Unpaid / Learning</span>
              </>
            )}
          </div>

          {/* Skills Tags */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-indigo-50/70 text-indigo-700 border border-indigo-100/80"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Dates Info */}
          {(deadline || postedDate) && (
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-3 pt-0.5">
              {postedDate && <span>Posted: {postedDate}</span>}
              {deadline && <span className="text-amber-600 font-semibold flex items-center gap-1"><Calendar size={11} /> Apply by: {deadline}</span>}
            </div>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
        <button
          onClick={() => navigate(`/opportunities/${opp.id}`)}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
        >
          <span>View Details</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};

/* ─── Skeleton Row ─── */
const SkeletonRow = () => (
  <div className="bg-white rounded-xl border border-slate-200/80 p-5 animate-pulse flex items-start gap-4">
    <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
    <div className="flex-1 space-y-2.5">
      <div className="h-5 bg-slate-200 rounded-lg w-1/3" />
      <div className="h-4 bg-slate-100 rounded-lg w-1/4" />
      <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
      <div className="flex gap-2 pt-1">
        <div className="h-5 w-16 bg-indigo-50 rounded-md" />
        <div className="h-5 w-16 bg-indigo-50 rounded-md" />
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   CLEAN PRODUCTION INTERNSHIPS PAGE
═══════════════════════════════════════════════════════════ */
const Opportunities = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  /* Filters State */
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [searchQuery, setSearchQuery]       = useState('');
  const [sortBy, setSortBy]                 = useState('newest');

  /* Fetch Internships strictly from Firestore backend API */
  const fetchInternships = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/opportunities?type=internship');
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.opportunities) ? res.data.opportunities : [];

      // Filter for type == Internship (case-insensitive) & active status
      const filtered = data.filter((opp) => {
        const typeMatch = !opp.type || opp.type.toLowerCase().includes('internship');
        const activeMatch = opp.is_active !== false && opp.status !== 'inactive';
        return typeMatch && activeMatch;
      });

      setInternships(filtered);
    } catch (err) {
      console.error('Failed to load internships:', err);
      setError('Unable to load internships.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  /* Apply Client-Side Filters & Search */
  const filteredInternships = internships.filter((opp) => {
    // 1. Work Mode Filter
    if (workModeFilter !== 'All') {
      const mode = (opp.mode || opp.workMode || (opp.is_remote ? 'Remote' : 'On-site')).toLowerCase();
      const target = workModeFilter.toLowerCase();
      if (!mode.includes(target)) return false;
    }

    // 2. Search Query (Title, Company, Skills)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (opp.title || '').toLowerCase();
      const company = (opp.company || opp.organization || '').toLowerCase();
      const skills = (opp.required_skills || opp.skills || []).join(' ').toLowerCase();
      if (!title.includes(q) && !company.includes(q) && !skills.includes(q)) {
        return false;
      }
    }

    return true;
  });

  /* Sorting */
  const sortedInternships = [...filteredInternships].sort((a, b) => {
    if (sortBy === 'newest') {
      const da = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at || 0).getTime();
      const db = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at || 0).getTime();
      return db - da;
    }
    if (sortBy === 'deadline') {
      const da = a.deadline?.toMillis ? a.deadline.toMillis() : new Date(a.deadline || '9999-12-31').getTime();
      const db = b.deadline?.toMillis ? b.deadline.toMillis() : new Date(b.deadline || '9999-12-31').getTime();
      return da - db;
    }
    return 0;
  });

  /* Count text */
  const countText = loading
    ? 'Loading...'
    : sortedInternships.length === 1
    ? '1 internship'
    : sortedInternships.length > 0
    ? `${sortedInternships.length} internships`
    : 'No internships';

  const hasActiveFilters = workModeFilter !== 'All' || searchQuery.trim() !== '';

  return (
    <div className="w-full font-sans pb-16 max-w-5xl mx-auto space-y-6">
      
      {/* ── PAGE TITLE ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Internships
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Find internships that match your skills and career goals.
        </p>
      </div>

      {/* ── FILTER BAR & SEARCH ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3.5 shadow-2xs">
        
        {/* Search Field */}
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search internships..."
            className="w-full h-10 pl-10 pr-9 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* Work Mode Selectors */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['All', 'Remote', 'On-site', 'Hybrid'].map((mode) => (
              <button
                key={mode}
                onClick={() => setWorkModeFilter(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  workModeFilter === mode
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="deadline">Deadline (Earliest)</option>
            </select>
          </div>
        </div>

      </div>

      {/* ── RESULT COUNT ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {countText}
        </p>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setWorkModeFilter('All');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── INTERNSHIP LIST ───────────────────────────────────── */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
        ) : error ? (
          /* Error State */
          <div className="bg-white rounded-xl border border-red-200 p-10 text-center space-y-3">
            <AlertCircle size={32} className="text-red-400 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">Unable to load internships.</h3>
            <p className="text-xs text-slate-500">Please try again.</p>
            <button
              onClick={fetchInternships}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : sortedInternships.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto font-bold text-xl">
              💼
            </div>
            {hasActiveFilters ? (
              <>
                <h3 className="font-bold text-slate-800 text-base">No internships found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try changing your search or filters.
                </p>
                <button
                  onClick={() => {
                    setWorkModeFilter('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h3 className="font-bold text-slate-800 text-base">No internships available right now.</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  New opportunities will appear here when they are published.
                </p>
              </>
            )}
          </div>
        ) : (
          /* Internship Cards List */
          sortedInternships.map((opp) => (
            <InternshipCard key={opp.id} opp={opp} />
          ))
        )}
      </div>

    </div>
  );
};

export default Opportunities;