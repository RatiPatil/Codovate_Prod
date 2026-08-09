import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import {
  Database,
  BarChart2,
  Code2,
  Megaphone,
  Globe,
  Layout,
  Users,
  ChevronRight,
  SlidersHorizontal,
  MapPin,
  Clock,
  Laptop,
  Briefcase,
  Heart,
  Share2,
  ChevronDown,
  X,
  Sparkles,
  AlertCircle,
  Search,
  Star,
  GraduationCap,
  Trophy,
} from 'lucide-react';

/* ─── Domain Category Cards (Horizontal Row) ─── */
const DOMAIN_TABS = [
  { id: 'all',       label: 'All',                Icon: Sparkles   },
  { id: 'data',      label: 'Data Analysis',      Icon: Database   },
  { id: 'dataSci',   label: 'Data Science',       Icon: BarChart2  },
  { id: 'software',  label: 'Software Development', Icon: Code2    },
  { id: 'marketing', label: 'Digital Marketing',  Icon: Megaphone  },
  { id: 'web',       label: 'Web Development',    Icon: Globe      },
  { id: 'uiux',      label: 'UI/UX',              Icon: Layout     },
  { id: 'hr',        label: 'HR',                 Icon: Users      },
];

/* ─── Format Date Utility ─── */
const formatDate = (val) => {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ─── Match Score Circle/Square Badge ─── */
const MatchBadge = ({ score }) => {
  if (score == null) return null;
  const color =
    score >= 70 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
    score >= 40 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  'text-slate-600 bg-slate-100 border-slate-200';
  return (
    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border font-extrabold shrink-0 ${color}`}>
      <span className="text-lg leading-none">{score}</span>
      <span className="text-[9px] font-bold mt-0.5 leading-none">match</span>
    </div>
  );
};

/* ─── Skill & Domain Chips ─── */
const SkillChip = ({ label }) => (
  <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#EBF3FF] text-[#0066FF] border border-blue-100/80 leading-none">
    {label}
  </span>
);

const TagPill = ({ label }) => (
  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 leading-none">
    {label}
  </span>
);

/* ─── Status Badge ─── */
const StatusBadge = ({ isOpen }) =>
  isOpen ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
      Open
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold">
      Closed
    </span>
  );

/* ─── INTERNSHIP CARD (Exact Reference Style) ─── */
const OpportunityCard = ({ opp, onSave, saved }) => {
  const navigate = useNavigate();

  const title          = opp.title || 'Untitled Opportunity';
  const company        = opp.company || opp.organization || 'Organization';
  const logo           = opp.company_logo_url || opp.logo;
  const requiredSkills = opp.required_skills || opp.skills || [];
  const domains        = opp.domains || opp.tags || [];
  const visibleSkills  = requiredSkills.slice(0, 3);
  const hiddenSkills   = requiredSkills.length - visibleSkills.length;
  const visibleDomains = domains.slice(0, 3);

  const isOpen    = opp.is_active !== false && !['closed', 'inactive'].includes((opp.status || '').toLowerCase());
  const workMode  = opp.mode || opp.workMode || (opp.is_remote ? 'Work from Home' : opp.location || 'On-site');
  const duration  = opp.duration || opp.employment_type || 'Part Time';
  const noExp     = !opp.experience_required || opp.experience_required === '0' || /fresher|no prior|0 year/i.test(opp.experience_required);
  const postedDate = formatDate(opp.created_at);

  return (
    <article
      onClick={() => navigate(`/opportunities/${opp.id}`)}
      className="group bg-white rounded-[24px] border border-slate-200/80 p-5 sm:p-6 hover:border-[#0066FF]/40 hover:shadow-md transition-all duration-200 cursor-pointer space-y-3.5"
    >
      {/* Top Title & Match Score Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF3FF] border border-blue-100 flex items-center justify-center font-extrabold text-[#0066FF] text-lg shrink-0 overflow-hidden">
            {logo ? (
              <img src={logo} alt={company} className="w-full h-full object-contain p-1" />
            ) : (
              company.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 leading-snug group-hover:text-[#0066FF] transition-colors line-clamp-1">
              {title}
            </h3>
            <p className="text-sm font-semibold text-slate-500 mt-0.5 truncate">
              {company}
            </p>
          </div>
        </div>

        <MatchBadge score={opp.match_score} />
      </div>

      {/* Meta Icons Row: Experience · Duration · Location · Stipend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 font-medium pt-0.5">
        {noExp ? (
          <span className="flex items-center gap-1">
            <Briefcase size={13} className="text-slate-400" />
            No prior experience required
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Briefcase size={13} className="text-slate-400" />
            {opp.experience_required}
          </span>
        )}

        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1">
          <Clock size={13} className="text-slate-400" />
          {duration}
        </span>

        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1">
          {workMode.toLowerCase().includes('home') || workMode.toLowerCase().includes('remote') ? (
            <Laptop size={13} className="text-slate-400" />
          ) : (
            <MapPin size={13} className="text-slate-400" />
          )}
          {workMode}
        </span>

        {opp.stipend && (
          <>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-emerald-700">₹{opp.stipend}</span>
          </>
        )}
      </div>

      {/* Skills Chips */}
      {visibleSkills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleSkills.map((skill) => (
            <SkillChip key={skill} label={skill} />
          ))}
          {hiddenSkills > 0 && (
            <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5">
              +{hiddenSkills}
            </span>
          )}
        </div>
      )}

      {/* Domain / Category Tag Pills */}
      {visibleDomains.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {visibleDomains.map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>
      )}

      {/* Bottom Footer Row: Status · Date · Action Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <StatusBadge isOpen={isOpen} />
          {postedDate && (
            <span className="text-xs text-slate-400 font-medium">
              Posted {postedDate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard?.writeText(window.location.origin + `/opportunities/${opp.id}`);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-[#0066FF] hover:bg-blue-50 transition-colors"
            aria-label="Share"
          >
            <Share2 size={17} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave && onSave(opp.id);
            }}
            className={`p-2 rounded-xl transition-colors ${
              saved ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
            } hover:bg-red-50`}
            aria-label="Save"
          >
            <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
};

/* ─── Skeleton Row ─── */
const CardSkeleton = () => (
  <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 animate-pulse space-y-4">
    <div className="flex justify-between items-start gap-4">
      <div className="flex gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 rounded-xl w-48" />
          <div className="h-4 bg-slate-100 rounded-xl w-32" />
        </div>
      </div>
      <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
    </div>
    <div className="h-4 bg-slate-100 rounded-xl w-2/3" />
    <div className="flex gap-2">
      <div className="h-6 w-24 bg-blue-50 rounded-lg" />
      <div className="h-6 w-24 bg-blue-50 rounded-lg" />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN INTERNSHIPS PAGE
═══════════════════════════════════════════════════════════ */
const Opportunities = () => {
  const { type: urlType } = useParams();

  const [activeType, setActiveType]         = useState(urlType || 'internship');
  const [activeDomain, setActiveDomain]     = useState('all');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [searchQuery, setSearchQuery]       = useState('');
  const [sortBy, setSortBy]                 = useState('newest');

  const [opportunities, setOpportunities]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [savedIds, setSavedIds]             = useState(new Set());

  useEffect(() => {
    if (urlType && urlType !== activeType) {
      setActiveType(urlType);
      setActiveDomain('all');
      setWorkModeFilter('All');
      setSearchQuery('');
    }
  }, [urlType]);

  /* Fetch strictly from backend Firestore API */
  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (activeType && activeType !== 'all') params.append('type', activeType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/opportunities?${params.toString()}`);
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.opportunities)
        ? res.data.opportunities
        : [];
      setOpportunities(data);
    } catch {
      setError('Failed to load opportunities. Please try again.');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [activeType, searchQuery]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  /* Domain Keyword Mapping */
  const DOMAIN_KEYWORDS = {
    data:      ['data analysis', 'data analyst', 'analytics'],
    dataSci:   ['data science', 'machine learning', 'ml', 'ai'],
    software:  ['software', 'backend', 'fullstack', 'full-stack', 'python', 'java', 'node'],
    marketing: ['marketing', 'digital', 'seo', 'content', 'social media'],
    web:       ['web development', 'frontend', 'react', 'html', 'css', 'javascript'],
    uiux:      ['ui', 'ux', 'design', 'figma', 'product design'],
    hr:        ['hr', 'human resources', 'recruiter', 'talent'],
  };

  /* Client-side Domain & Work Mode Filtering */
  const visibleOpportunities = opportunities.filter((o) => {
    // 1. Domain Tab Filter
    if (activeDomain !== 'all') {
      const keywords = DOMAIN_KEYWORDS[activeDomain] || [];
      const haystack = `${o.title || ''} ${(o.required_skills || []).join(' ')} ${(o.domains || []).join(' ')}`.toLowerCase();
      if (!keywords.some((k) => haystack.includes(k))) return false;
    }

    // 2. Work Mode Filter
    if (workModeFilter !== 'All') {
      const mode = (o.mode || o.workMode || (o.is_remote ? 'Remote' : 'On-site')).toLowerCase();
      const target = workModeFilter.toLowerCase();
      if (!mode.includes(target)) return false;
    }

    return true;
  });

  const typeLabel = activeType === 'job' ? 'Jobs' :
                    activeType === 'competition' ? 'Competitions' :
                    'Internships';

  const hasActiveFilters = activeDomain !== 'all' || workModeFilter !== 'All' || searchQuery.trim() !== '';

  return (
    <div className="w-full font-sans pb-16 space-y-6">
      
      {/* ── HEADER TITLE: "116 Internships for Students" Style ── */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {loading ? (
            <span className="inline-block w-64 h-10 bg-slate-200 rounded-xl animate-pulse" />
          ) : (
            <>
              {visibleOpportunities.length > 0 && `${visibleOpportunities.length} `}
              <span className="text-slate-900">{typeLabel}</span>
              <span className="text-slate-500 font-bold"> for Students</span>
            </>
          )}
        </h1>
        <p className="text-sm font-semibold text-[#0066FF] mt-1">
          Latest {typeLabel} in India.
        </p>
      </div>

      {/* ── HORIZONTAL DOMAIN CATEGORY CARDS (7 Soft Sky Blue Cards) ── */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {DOMAIN_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveDomain(id)}
              className={`flex flex-col items-center justify-between gap-2.5 px-4 py-4 min-w-[110px] rounded-[22px] border flex-shrink-0 transition-all duration-150 focus:outline-none ${
                activeDomain === id
                  ? 'bg-[#EBF3FF] border-[#0066FF]/40 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${activeDomain === id ? 'bg-white' : 'bg-[#EBF3FF]'}`}>
                <Icon size={22} className={activeDomain === id ? 'text-[#0066FF]' : 'text-slate-500'} />
              </div>
              <span className={`text-xs font-bold text-center leading-tight ${activeDomain === id ? 'text-[#0066FF]' : 'text-slate-700'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Scroll right arrow indicator */}
        <div className="absolute right-0 top-0 h-full w-14 bg-gradient-to-l from-[#F4F7FE] to-transparent pointer-events-none flex items-center justify-end pr-1">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center pointer-events-auto cursor-pointer hover:bg-slate-50">
            <ChevronRight size={16} className="text-slate-600" />
          </div>
        </div>
      </div>

      {/* ── FILTER PILLS BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        
        {/* Left Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Work Mode Filter Pills */}
          <div className="flex items-center gap-1">
            {['All', 'Remote', 'On-site', 'Hybrid'].map((mode) => (
              <button
                key={mode}
                onClick={() => setWorkModeFilter(mode)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                  workModeFilter === mode
                    ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#0066FF] hover:text-[#0066FF]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input & Sort Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchOpportunities(); }}
              placeholder="Search internships..."
              className="w-full h-9 pl-9 pr-8 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); fetchOpportunities(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0066FF]"
          >
            <option value="newest">Sort By: Newest</option>
            <option value="deadline">Sort By: Deadline</option>
          </select>
        </div>

      </div>

      {/* ── INTERNSHIPS LIST (Full Width — No Right Panel) ── */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : error ? (
          <div className="bg-white rounded-[24px] border border-red-200 p-10 text-center space-y-3">
            <AlertCircle size={32} className="text-red-400 mx-auto" />
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button
              onClick={fetchOpportunities}
              className="px-5 py-2.5 rounded-xl bg-[#0066FF] text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : visibleOpportunities.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-slate-200 p-14 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EBF3FF] flex items-center justify-center mx-auto text-[#0066FF]">
              <Briefcase size={28} />
            </div>
            {hasActiveFilters ? (
              <>
                <h3 className="font-extrabold text-lg text-slate-800">No internships found</h3>
                <p className="text-xs font-medium text-slate-400 max-w-xs mx-auto">
                  Try changing your search or filters.
                </p>
                <button
                  onClick={() => {
                    setActiveDomain('all');
                    setWorkModeFilter('All');
                    setSearchQuery('');
                  }}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#EBF3FF] text-[#0066FF] text-xs font-bold hover:bg-[#D0E4FF] transition-colors"
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h3 className="font-extrabold text-lg text-slate-800">No internships available right now.</h3>
                <p className="text-xs font-medium text-slate-400 max-w-xs mx-auto">
                  New opportunities will appear here when they are published.
                </p>
              </>
            )}
          </div>
        ) : (
          visibleOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              onSave={(id) =>
                setSavedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  return next;
                })
              }
              saved={savedIds.has(opp.id)}
            />
          ))
        )}
      </div>

    </div>
  );
};

export default Opportunities;