import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  ChevronLeft,
  ChevronDown,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  Search,
  Trophy,
  Star,
} from 'lucide-react';

/* ─── Domain Category Tabs (Matching Unstop Reference) ─── */
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

/* ─── Static Featured Right Panel Sidebar Items ─── */
const FEATURED_SIDE = [
  {
    id: 1,
    title: 'Win Cash Prizes & PPIs!',
    company: 'Codovate Challenge 2026',
    category: 'Competition',
    logoColor: '#0066FF',
    logoText: 'C',
    cta: 'Register Now!',
  },
  {
    id: 2,
    title: 'Growth Marketing Intern (College Partnerships)',
    company: 'Codovate ONE is hiring!',
    category: 'Internship',
    logoColor: '#7C3AED',
    logoText: 'G',
    cta: 'Apply Now',
  },
  {
    id: 3,
    title: 'Asian Paints Alchemy 2026',
    company: 'Competition',
    category: 'Competition',
    logoColor: '#DC2626',
    logoText: 'A',
    cta: null,
  },
  {
    id: 4,
    title: 'Join our Exclusive Event on August 21',
    company: 'Codovate Community',
    category: 'Event',
    logoColor: '#0891B2',
    logoText: 'E',
    cta: null,
  },
];

/* ─── Utility: Format date ─── */
const formatDate = (val) => {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ─── Match Score Badge ─── */
const MatchBadge = ({ score }) => {
  if (!score && score !== 0) return null;
  const color =
    score >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
    score >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  'text-slate-600 bg-slate-100 border-slate-200';
  return (
    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border font-extrabold text-lg shrink-0 ${color}`}>
      <span>{score}</span>
      <span className="text-[9px] font-bold leading-none mt-0.5">match</span>
    </div>
  );
};

/* ─── Skill Chip ─── */
const SkillChip = ({ label }) => (
  <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#EBF3FF] text-[#0066FF] border border-blue-100/80 leading-none">
    {label}
  </span>
);

/* ─── Status Badge ─── */
const StatusBadge = ({ status }) => {
  if (!status) return null;
  const isOpen = ['open', 'active', 'live'].includes(status?.toLowerCase());
  const isClosed = ['closed', 'inactive'].includes(status?.toLowerCase());
  if (isOpen) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
      Open
    </span>
  );
  if (isClosed) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-bold">
      Closed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-bold">
      {status}
    </span>
  );
};

/* ─── OPPORTUNITY CARD (Exact Unstop Style) ─── */
const OpportunityCard = ({ opp, onApply, onSave, saved }) => {
  const navigate = useNavigate();
  const requiredSkills = opp.required_skills || [];
  const domains = opp.domains || opp.required_domains || [];
  const allTags = [...requiredSkills, ...domains].filter(Boolean);
  const visibleTags = allTags.slice(0, 3);
  const hiddenCount = allTags.length - visibleTags.length;

  const workMode =
    opp.work_mode || opp.location_type ||
    (opp.is_remote ? 'Work from Home' : opp.location ? opp.location : 'On-site');

  const experience = opp.experience_required || opp.experience_level;
  const noExperience =
    !experience ||
    experience.toLowerCase().includes('fresher') ||
    experience.toLowerCase().includes('no prior') ||
    experience === '0' ||
    experience === '0 years';

  return (
    <div
      onClick={() => navigate(`/opportunities/${opp.id}`)}
      className="group bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-[#0066FF]/40 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-4">

        {/* Company Logo / Initial Avatar */}
        <div className="w-11 h-11 shrink-0 rounded-xl bg-[#EBF3FF] border border-blue-100 flex items-center justify-center font-extrabold text-[#0066FF] text-base overflow-hidden">
          {opp.company_logo_url ? (
            <img src={opp.company_logo_url} alt={opp.company} className="w-full h-full object-contain p-1" />
          ) : (
            (opp.company || opp.organization || 'C').charAt(0).toUpperCase()
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-2.5">

          {/* Title Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight truncate group-hover:text-[#0066FF] transition-colors">
                {opp.title}
              </h3>
              <p className="text-sm font-semibold text-slate-500 mt-0.5 truncate">
                {opp.company || opp.organization || 'Company'}
              </p>
            </div>

            {/* Match Score Badge (Unstop's circle percentage) */}
            <MatchBadge score={opp.match_score} />
          </div>

          {/* Meta Tags Row: Experience · Duration · Location */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
            {noExperience ? (
              <span className="flex items-center gap-1">
                <Star size={12} className="text-amber-500" />
                No prior experience required
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Briefcase size={12} />
                {experience}
              </span>
            )}

            {(opp.duration || opp.employment_type) && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {opp.employment_type || opp.duration}
                </span>
              </>
            )}

            {workMode && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  {opp.is_remote ? <Laptop size={12} /> : <MapPin size={12} />}
                  {workMode}
                </span>
              </>
            )}

            {opp.stipend && (
              <>
                <span className="text-slate-300">·</span>
                <span className="font-bold text-emerald-700">₹{opp.stipend}</span>
              </>
            )}
          </div>

          {/* Skill / Domain Tags */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <SkillChip key={tag} label={tag} />
              ))}
              {hiddenCount > 0 && (
                <span className="text-[11px] font-semibold text-slate-400 px-2 py-1">
                  +{hiddenCount}
                </span>
              )}
            </div>
          )}

          {/* Bottom Row: Status · Date · CTA Controls */}
          <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <StatusBadge status={opp.status || (opp.is_active ? 'Open' : 'Closed')} />
              {opp.created_at && (
                <span className="text-[11px] text-slate-400 font-medium">
                  Posted {formatDate(opp.created_at)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button
                onClick={(e) => { e.stopPropagation(); onSave && onSave(opp.id); }}
                className={`p-2 rounded-lg transition-colors ${saved ? 'text-red-500' : 'text-slate-400 hover:text-red-500'} hover:bg-red-50`}
                aria-label="Save"
              >
                <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(window.location.origin + `/opportunities/${opp.id}`); }}
                className="p-2 rounded-lg text-slate-400 hover:text-[#0066FF] hover:bg-blue-50 transition-colors"
                aria-label="Share"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── FILTER PILL BUTTON ─── */
const FilterPill = ({ icon: Icon, label, count, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${
      active
        ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-xs'
        : 'bg-white text-slate-600 border-slate-200 hover:border-[#0066FF] hover:text-[#0066FF]'
    }`}
  >
    {Icon && <Icon size={13} />}
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${active ? 'bg-white/20 text-white' : 'bg-[#EBF3FF] text-[#0066FF]'}`}>
        {count}
      </span>
    )}
    <ChevronDown size={12} className="opacity-60" />
  </button>
);

/* ─── SKELETON LOADER ─── */
const CardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse">
    <div className="flex gap-4">
      <div className="w-11 h-11 rounded-xl bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-slate-200 rounded-xl w-3/4" />
        <div className="h-4 bg-slate-100 rounded-xl w-1/2" />
        <div className="h-4 bg-slate-100 rounded-xl w-2/3" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-blue-50 rounded-lg" />
          <div className="h-6 w-20 bg-blue-50 rounded-lg" />
          <div className="h-6 w-16 bg-blue-50 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN INTERNSHIPS PAGE COMPONENT
═══════════════════════════════════════════════════════════════ */
const Internships = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [savedIds, setSavedIds]           = useState(new Set());
  const [searchQuery, setSearchQuery]     = useState(searchParams.get('search') || '');
  const [activeDomain, setActiveDomain]   = useState('all');
  const [activeType, setActiveType]       = useState(searchParams.get('type') || 'internship');
  const [filterCounts, setFilterCounts]   = useState({ type: 0, location: 0, roles: 0 });

  /* Fetch opportunities from real backend */
  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (activeType && activeType !== 'all') params.append('type', activeType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      const res = await api.get(`/opportunities?${params.toString()}`);
      const data = Array.isArray(res.data) ? res.data :
                   Array.isArray(res.data?.opportunities) ? res.data.opportunities : [];
      setOpportunities(data);
    } catch (err) {
      setError('Failed to load opportunities. Please try again.');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [activeType, searchQuery]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  /* Filter by domain keyword on frontend */
  const visibleOpportunities = activeDomain === 'all'
    ? opportunities
    : opportunities.filter(o => {
        const domainKeyMap = {
          data: ['data analysis', 'data analyst', 'analytics'],
          dataSci: ['data science', 'machine learning', 'ml', 'ai'],
          software: ['software', 'backend', 'fullstack', 'full-stack', 'python', 'java', 'node'],
          marketing: ['marketing', 'digital', 'seo', 'content', 'social media'],
          web: ['web development', 'frontend', 'react', 'html', 'css', 'javascript'],
          uiux: ['ui', 'ux', 'design', 'figma', 'product design'],
          hr: ['hr', 'human resources', 'recruiter', 'talent'],
        };
        const keywords = domainKeyMap[activeDomain] || [];
        const haystack = `${o.title || ''} ${(o.required_skills || []).join(' ')} ${(o.domains || []).join(' ')}`.toLowerCase();
        return keywords.some(k => haystack.includes(k));
      });

  const handleSave = (id) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchOpportunities();
  };

  const typeLabel = activeType === 'internship' ? 'Internships' :
                    activeType === 'job' ? 'Jobs' :
                    activeType === 'competition' ? 'Competitions' :
                    'Opportunities';

  return (
    <div className="w-full font-sans pb-16">
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ─── MAIN LEFT CONTENT ─── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Page Heading — "116 Internships for Students" style */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {loading ? (
                <span className="inline-block w-64 h-10 bg-slate-200 rounded-xl animate-pulse" />
              ) : (
                <>
                  {visibleOpportunities.length > 0
                    ? `${visibleOpportunities.length}+ `
                    : ''
                  }
                  <span className="text-slate-900">{typeLabel}</span>
                  <span className="text-slate-500 font-bold"> for Students</span>
                </>
              )}
            </h1>
            <p className="text-sm font-semibold text-[#0066FF] mt-1.5">
              Latest {typeLabel} in India.
            </p>
          </div>

          {/* ─── Domain Category Scrollable Tabs Row ─── */}
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
              {DOMAIN_TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveDomain(id)}
                  className={`flex flex-col items-center gap-2 px-4 py-3 min-w-[96px] rounded-[18px] border flex-shrink-0 transition-all duration-150 ${
                    activeDomain === id
                      ? 'bg-[#EBF3FF] border-[#0066FF]/40 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeDomain === id ? 'bg-white' : 'bg-[#EBF3FF]'}`}>
                    <Icon size={20} className={activeDomain === id ? 'text-[#0066FF]' : 'text-slate-500'} />
                  </div>
                  <span className={`text-xs font-bold text-center leading-tight ${activeDomain === id ? 'text-[#0066FF]' : 'text-slate-700'}`}>
                    {label}
                  </span>
                </button>
              ))}

              {/* Right Scroll Arrow Indicator */}
              <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-[#F4F7FE] to-transparent pointer-events-none flex items-center justify-end pr-1">
                <div className="w-7 h-7 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                  <ChevronRight size={14} className="text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* ─── Filters Row ─── */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill icon={SlidersHorizontal} label="Filters" count={filterCounts.type + filterCounts.location + filterCounts.roles} />

            {/* Type Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['internship', 'job', 'competition'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`px-3.5 py-2 rounded-full border text-xs font-bold transition-all ${
                    activeType === t
                      ? 'bg-[#0066FF] text-white border-[#0066FF]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-[#0066FF] hover:text-[#0066FF]'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <FilterPill icon={MapPin} label="Location" />
            <FilterPill icon={Briefcase} label="Roles" />
            <FilterPill icon={SlidersHorizontal} label="Sort By" />
          </div>

          {/* ─── Search Bar ─── */}
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder={`Search ${typeLabel.toLowerCase()}...`}
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* ─── Opportunity Cards List ─── */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
            ) : error ? (
              <div className="bg-white rounded-2xl border border-red-200 p-10 text-center">
                <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-red-600">{error}</p>
                <button
                  onClick={fetchOpportunities}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-[#0066FF] text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : visibleOpportunities.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-14 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#EBF3FF] flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={28} className="text-[#0066FF]" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 mb-1">
                  No {typeLabel} Found
                </h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try different keywords.`
                    : `New opportunities are added regularly. Check back soon!`
                  }
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-[#EBF3FF] text-[#0066FF] text-sm font-bold hover:bg-[#D0E4FF] transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              visibleOpportunities.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opp={opp}
                  onSave={handleSave}
                  saved={savedIds.has(opp.id)}
                />
              ))
            )}
          </div>

        </div>

        {/* ─── RIGHT FEATURED SIDEBAR PANEL ─── */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 space-y-4">

          {/* Featured Section Header */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Featured</h3>
              <Trophy size={15} className="text-amber-500" />
            </div>

            <div className="divide-y divide-slate-100">
              {FEATURED_SIDE.map(item => (
                <div
                  key={item.id}
                  onClick={() => navigate('/opportunities')}
                  className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  {/* Logo */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-white text-sm shrink-0 shadow-xs"
                    style={{ background: item.logoColor }}
                  >
                    {item.logoText}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 leading-snug group-hover:text-[#0066FF] transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                      {item.company}
                    </p>
                    {item.cta && (
                      <button className="mt-1.5 text-[10px] font-extrabold text-[#0066FF] hover:underline">
                        {item.cta} →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Jump Navigation */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">Quick Browse</h3>
            </div>
            <div className="px-4 py-3 space-y-2">
              {[
                { label: 'Internships', path: '/opportunities?type=internship', icon: '🎓' },
                { label: 'Jobs',        path: '/opportunities?type=job',        icon: '💼' },
                { label: 'Competitions',path: '/opportunities?type=competition',icon: '🏆' },
                { label: 'Mentorship',  path: '/mentors',                       icon: '🤝' },
                { label: 'Courses',     path: '/learning',                      icon: '📚' },
              ].map(({ label, path, icon }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#EBF3FF] hover:text-[#0066FF] transition-all text-left"
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  <ChevronRight size={12} className="ml-auto text-slate-400" />
                </button>
              ))}
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
};

export default Internships;