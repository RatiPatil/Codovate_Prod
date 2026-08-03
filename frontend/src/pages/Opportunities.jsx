import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Bookmark, BookmarkCheck, LayoutGrid, List,
  ArrowUpRight, SlidersHorizontal, X, ChevronDown, Clock, Filter
} from 'lucide-react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/ToastProvider';

/* ─── Helpers ──────────────────────────────────────────────────── */
const timeAgo = (v) => {
  if (!v) return '';
  const ms = typeof v === 'object' && v.seconds ? v.seconds * 1000
    : typeof v === 'string' || typeof v === 'number' ? new Date(v).getTime() : 0;
  if (!ms) return '';
  const d = Math.floor((Date.now() - ms) / 86400000);
  if (d < 1) return 'Today';
  if (d === 1) return '1 day ago';
  if (d < 7) return `${d} days ago`;
  return `${Math.floor(d / 7)}w ago`;
};

const COMPANY_BG = ['bg-red-500', 'bg-blue-600', 'bg-indigo-600', 'bg-green-600', 'bg-orange-500', 'bg-purple-600', 'bg-pink-600', 'bg-teal-600'];
const cBg = (n = '') => COMPANY_BG[n.charCodeAt(0) % COMPANY_BG.length] || COMPANY_BG[0];

/* ─── Type badge colours (light theme) ────────────────────────── */
const typeBadge = (t = '') => {
  const s = t.toLowerCase();
  if (s.includes('intern'))    return 'bg-violet-100 text-violet-700';
  if (s.includes('full'))      return 'bg-emerald-100 text-emerald-700';
  if (s.includes('part'))      return 'bg-blue-100 text-blue-700';
  if (s.includes('contract'))  return 'bg-orange-100 text-orange-700';
  if (s.includes('hack'))      return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
};

/* ─── Skeleton card ────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 bg-gray-200 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/5" />
        <div className="flex gap-2 mt-2">
          {[1,2,3].map(i => <div key={i} className="h-5 w-16 bg-gray-100 rounded-full" />)}
        </div>
      </div>
      <div className="flex flex-col items-end gap-3 shrink-0">
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-9 bg-gray-200 rounded-xl w-28" />
      </div>
    </div>
  </div>
);

/* ─── Company Logo tile ────────────────────────────────────────── */
const CompanyLogo = ({ name = '', logo = '', size = 56 }) => {
  if (logo) {
    return (
      <div style={{ width: size, height: size }} className="rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 p-1.5">
        <img src={logo} alt={name} className="w-full h-full object-contain" onError={e => { e.target.style.display = 'none'; }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size }} className={`${cBg(name)} rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0`}>
      {name.charAt(0).toUpperCase() || '?'}
    </div>
  );
};

/* ─── Opportunity Card (list mode) ────────────────────────────── */
const OppCard = ({ opp, isApplied, isApplying, isBookmarked, onApply, onBookmark, view }) => {
  const skills = opp.required_skills || opp.skills || [];
  const visibleSkills = skills.slice(0, 3);
  const extra = skills.length - 3;
  const id = opp.id;

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group ${view === 'grid' ? 'flex flex-col p-5' : 'p-5'}`}>
      {view === 'grid' ? (
        // Grid layout
        <>
          <div className="flex items-start justify-between mb-3">
            <CompanyLogo name={opp.company} logo={opp.logo} size={52} />
            <button onClick={() => onBookmark(id)} className="text-gray-300 hover:text-primary transition-colors p-1">
              {isBookmarked ? <BookmarkCheck size={18} className="text-primary" /> : <Bookmark size={18} />}
            </button>
          </div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-bold text-gray-900 text-sm truncate">{opp.company}</h3>
            {opp.is_featured && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">Featured</span>}
          </div>
          <p className="text-gray-500 text-xs mb-2 truncate">{opp.title}</p>
          <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-400">
            <MapPin size={11} />
            <span className="truncate">{opp.location || 'Remote'}</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${typeBadge(opp.type)}`}>{opp.type || 'Job'}</span>
          </div>
          {visibleSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {visibleSkills.map(s => (
                <span key={s} className="px-2 py-0.5 rounded-full text-[11px] bg-gray-50 text-gray-500 border border-gray-100">{s}</span>
              ))}
              {extra > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] bg-gray-50 text-gray-500">+{extra}</span>}
            </div>
          )}
          <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
            {(opp.salary || opp.stipend) && (
              <span className="text-sm font-bold text-gray-900">{opp.salary || opp.stipend}</span>
            )}
            <button
              onClick={() => onApply(id)}
              disabled={isApplied || isApplying}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-1.5 ml-auto"
              style={{ background: isApplied ? '#9ca3af' : 'linear-gradient(135deg,#6c3aff,#3a9bff)' }}
            >
              {isApplying && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isApplied ? 'Applied ✓' : 'Apply Now'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 text-right mt-1.5">
            <Clock size={10} className="inline mr-0.5" />
            Posted {timeAgo(opp.created_at)}
          </p>
        </>
      ) : (
        // List layout — matches reference exactly
        <div className="flex items-start gap-4">
          <CompanyLogo name={opp.company} logo={opp.logo} size={56} />

          {/* Middle info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-0.5">
              <h3 className="font-bold text-gray-900 text-[15px]">{opp.company}</h3>
              {opp.is_featured && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-700">Featured</span>
              )}
            </div>
            <p className="text-gray-500 text-sm mb-2">{opp.title}</p>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={12} /> {opp.location || 'Remote'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${typeBadge(opp.type)}`}>
                {opp.type || 'Job'}
              </span>
            </div>
            {visibleSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {visibleSkills.map(s => (
                  <span key={s} className="px-2.5 py-0.5 rounded-full text-[12px] bg-gray-50 text-gray-500 border border-gray-100">{s}</span>
                ))}
                {extra > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[12px] bg-gray-50 text-gray-500">+{extra}</span>
                )}
              </div>
            )}
          </div>

          {/* Right: salary + actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {(opp.salary || opp.stipend) && (
              <div className="text-right">
                <span className="font-bold text-gray-900 text-[15px]">
                  {opp.salary || opp.stipend}
                </span>
                {(opp.salary || opp.stipend) && !String(opp.salary || opp.stipend).includes('LPA') && (
                  <span className="text-gray-400 text-xs"> / month</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onBookmark(id)}
                className="p-2 rounded-xl border border-gray-100 hover:border-primary/30 text-gray-300 hover:text-primary transition-all"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              >
                {isBookmarked
                  ? <BookmarkCheck size={17} className="text-primary" />
                  : <Bookmark size={17} />
                }
              </button>
              <button
                onClick={() => onApply(id)}
                disabled={isApplied || isApplying}
                className="px-5 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-2"
                style={{ background: isApplied ? '#9ca3af' : 'linear-gradient(135deg,#6c3aff,#3a9bff)' }}
              >
                {isApplying && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isApplied ? 'Applied ✓' : 'Apply Now'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center gap-0.5">
              <Clock size={10} /> Posted {timeAgo(opp.created_at)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Filter Panel ─────────────────────────────────────────────── */
const FILTER_TYPES    = ['Internship', 'Full-time', 'Part-time', 'Contract'];
const FILTER_EXP      = ['Fresher', '1-2 Years', '2-5 Years', '5+ Years'];
const FILTER_CITIES   = ['Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Remote'];

const FilterPanel = ({ filters, setFilters, allSkills, onReset }) => {
  const [skillSearch, setSkillSearch] = useState('');
  const [locSearch, setLocSearch]     = useState('');

  const toggle = (key, val) => {
    setFilters(prev => {
      const arr = prev[key] || [];
      const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
      return { ...prev, [key]: next };
    });
  };

  const filteredSkills = allSkills.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !filters.skills.includes(s)).slice(0, 8);
  const filteredCities = FILTER_CITIES.filter(c => c.toLowerCase().includes(locSearch.toLowerCase()));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
          <Filter size={16} className="text-primary" /> Filters
        </h3>
        <button onClick={onReset} className="text-xs font-semibold hover:underline" style={{ color: '#6c3aff' }}>Reset</button>
      </div>

      {/* Job Type */}
      <div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Job Type</p>
        {FILTER_TYPES.map(t => (
          <label key={t} className="flex items-center gap-2 py-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.types.includes(t)}
              onChange={() => toggle('types', t)}
              className="w-4 h-4 rounded accent-[#6c3aff]"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{t}</span>
          </label>
        ))}
      </div>

      <div className="border-t border-gray-50" />

      {/* Experience */}
      <div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Experience Level</p>
        {FILTER_EXP.map(e => (
          <label key={e} className="flex items-center gap-2 py-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.experience.includes(e)}
              onChange={() => toggle('experience', e)}
              className="w-4 h-4 rounded accent-[#6c3aff]"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{e}</span>
          </label>
        ))}
      </div>

      <div className="border-t border-gray-50" />

      {/* Location */}
      <div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Location</p>
        <div className="relative mb-2">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={locSearch}
            onChange={e => setLocSearch(e.target.value)}
            placeholder="Search location..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-gray-50 text-gray-700"
          />
        </div>
        {filteredCities.map(c => (
          <label key={c} className="flex items-center gap-2 py-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.locations.includes(c)}
              onChange={() => toggle('locations', c)}
              className="w-4 h-4 rounded accent-[#6c3aff]"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{c}</span>
          </label>
        ))}
      </div>

      <div className="border-t border-gray-50" />

      {/* Salary range slider */}
      <div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Salary Range</p>
        <input
          type="range" min={0} max={20} step={0.5}
          value={filters.maxSalary}
          onChange={e => setFilters(prev => ({ ...prev, maxSalary: Number(e.target.value) }))}
          className="w-full accent-[#6c3aff]"
        />
        <div className="flex justify-between text-[11px] text-gray-400 mt-1">
          <span>₹0</span>
          <span>{filters.maxSalary >= 20 ? '₹20 LPA+' : `₹${filters.maxSalary} LPA`}</span>
        </div>
      </div>

      <div className="border-t border-gray-50" />

      {/* Skills */}
      <div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Skills</p>
        {/* Selected chips */}
        {filters.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {filters.skills.map(s => (
              <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                {s}
                <button onClick={() => toggle('skills', s)} className="ml-0.5 hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative mb-2">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={skillSearch}
            onChange={e => setSkillSearch(e.target.value)}
            placeholder="Search skills..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-gray-50 text-gray-700"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filteredSkills.map(s => (
            <button
              key={s}
              onClick={() => toggle('skills', s)}
              className="px-2.5 py-1 rounded-full text-[11px] border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-colors bg-gray-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  MAIN OPPORTUNITIES PAGE                                        */
/* ═══════════════════════════════════════════════════════════════ */
const Opportunities = () => {
  const navigate    = useNavigate();
  const { addToast } = useToast();
  const { socket }  = useSocket();

  const [opps,         setOpps]         = useState([]);
  const [appliedIds,   setAppliedIds]   = useState(new Set());
  const [bookmarkedIds,setBookmarkedIds]= useState(new Set());
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [applying,     setApplying]     = useState(null);
  const [search,       setSearch]       = useState('');
  const [tab,          setTab]          = useState('Recommended');  // Recommended | Recent | Saved
  const [sort,         setSort]         = useState('Most Relevant');
  const [view,         setView]         = useState(() => localStorage.getItem('opp_view') || 'list');
  const [showFilters,  setShowFilters]  = useState(false);

  const [filters, setFilters] = useState({
    types:      [],
    experience: [],
    locations:  [],
    skills:     [],
    maxSalary:  20,
  });

  /* ── Fetch all data in parallel ───────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [oppsRes, appsRes, bookRes] = await Promise.all([
        api.get('/opportunities'),
        api.get('/applications/my').catch(() => ({ data: [] })),
        api.get('/opportunities/bookmarks/my').catch(() => ({ data: [] })),
      ]);
      setOpps(oppsRes.data || []);
      setAppliedIds(new Set((appsRes.data || []).map(a => a.opportunity_id)));
      setBookmarkedIds(new Set(bookRes.data || []));
    } catch {
      setError('Failed to load opportunities. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Real-time socket events ──────────────────────────────── */
  useEffect(() => {
    if (!socket) return;
    const onNew    = (o)  => setOpps(p => p.some(x => x.id === o.id) ? p : [o, ...p]);
    const onUpdate = (o)  => setOpps(p => p.map(x => x.id === o.id ? { ...x, ...o } : x));
    const onDelete = (id) => setOpps(p => p.filter(x => x.id !== id));
    socket.on('new_opportunity',    onNew);
    socket.on('update_opportunity', onUpdate);
    socket.on('delete_opportunity', onDelete);
    return () => {
      socket.off('new_opportunity',    onNew);
      socket.off('update_opportunity', onUpdate);
      socket.off('delete_opportunity', onDelete);
    };
  }, [socket]);

  /* ── Persist view preference ──────────────────────────────── */
  const setViewPref = (v) => { setView(v); localStorage.setItem('opp_view', v); };

  /* ── Apply handler ────────────────────────────────────────── */
  const handleApply = async (id) => {
    setApplying(id);
    try {
      await api.post('/applications', { opportunity_id: id });
      setAppliedIds(prev => new Set([...prev, id]));
      addToast({ type: 'success', title: 'Applied!', message: 'Application submitted successfully. 🎉' });
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Failed to apply.' });
    } finally { setApplying(null); }
  };

  /* ── Bookmark handler ─────────────────────────────────────── */
  const handleBookmark = async (id) => {
    try {
      const res = await api.post(`/opportunities/${id}/bookmark`);
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        res.data.bookmarked ? next.add(id) : next.delete(id);
        return next;
      });
      addToast({ type: 'info', title: res.data.bookmarked ? 'Saved!' : 'Removed' });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Could not update bookmark.' });
    }
  };

  /* ── All skills pool (for filter panel) ───────────────────── */
  const allSkills = useMemo(() => {
    const set = new Set();
    opps.forEach(o => (o.required_skills || o.skills || []).forEach(s => s && set.add(s)));
    return Array.from(set).sort();
  }, [opps]);

  /* ── Filter + sort logic ──────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...opps];

    // Tab filter
    if (tab === 'Saved')  list = list.filter(o => bookmarkedIds.has(o.id));
    if (tab === 'Recent') list = list.sort((a, b) => {
      const ta = a.created_at?.seconds ? a.created_at.seconds * 1000 : new Date(a.created_at || 0).getTime();
      const tb = b.created_at?.seconds ? b.created_at.seconds * 1000 : new Date(b.created_at || 0).getTime();
      return tb - ta;
    });

    // Search
    if (search) {
      const q = search.trim().toLowerCase();
      list = list.filter(o =>
        o.title?.toLowerCase().includes(q) ||
        o.company?.toLowerCase().includes(q) ||
        o.location?.toLowerCase().includes(q) ||
        o.type?.toLowerCase().includes(q) ||
        (o.required_skills || o.skills || []).some(s => String(s).toLowerCase().includes(q))
      );
    }

    // Job type filter
    if (filters.types.length > 0) {
      list = list.filter(o => filters.types.some(t =>
        (o.type || '').toLowerCase().includes(t.toLowerCase())
      ));
    }

    // Experience level filter
    if (filters.experience.length > 0) {
      list = list.filter(o => {
        const expStr = String(o.experience_level || o.experience || o.eligibility || '').toLowerCase();
        if (!expStr) return true;
        return filters.experience.some(e => expStr.includes(e.toLowerCase()));
      });
    }

    // Location filter
    if (filters.locations.length > 0) {
      list = list.filter(o => filters.locations.some(loc =>
        (o.location || '').toLowerCase().includes(loc.toLowerCase())
      ));
    }

    // Skills filter
    if (filters.skills.length > 0) {
      list = list.filter(o => {
        const oppSkills = (o.required_skills || o.skills || []).map(s => s.toLowerCase());
        return filters.skills.some(fs => oppSkills.includes(fs.toLowerCase()));
      });
    }

    // Salary filter (skip if maxSalary is max = 20)
    if (filters.maxSalary < 20) {
      list = list.filter(o => {
        const raw = String(o.salary || o.stipend || '').replace(/[^0-9.]/g, '');
        const val = parseFloat(raw);
        if (!val) return true;
        const isLPA = String(o.salary || '').toUpperCase().includes('LPA');
        const lpa = isLPA ? val : val / 100000;
        return lpa <= filters.maxSalary;
      });
    }

    // Sort
    if (sort === 'Newest') {
      list.sort((a, b) => {
        const ta = a.created_at?.seconds ? a.created_at.seconds * 1000 : new Date(a.created_at || 0).getTime();
        const tb = b.created_at?.seconds ? b.created_at.seconds * 1000 : new Date(b.created_at || 0).getTime();
        return tb - ta;
      });
    } else if (sort === 'Alphabetical') {
      list.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
    } else {
      // Most Relevant — keep backend order (match_score sorted)
    }

    return list;
  }, [opps, tab, search, filters, sort, bookmarkedIds]);

  const resetFilters = () => setFilters({ types: [], experience: [], locations: [], skills: [], maxSalary: 20 });
  const hasActiveFilters = filters.types.length > 0 || filters.experience.length > 0 || filters.locations.length > 0 || filters.skills.length > 0 || filters.maxSalary < 20;

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto pb-12">

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Opportunities</h1>
        <p className="text-gray-500 text-sm mt-0.5">Discover and apply to the best opportunities for your career.</p>
      </div>

      {/* ── Search Bar ────────────────────────────────────── */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search opportunities, roles, companies, skills..."
          className="w-full pl-11 pr-5 py-3 rounded-2xl bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-5">
        {['Recommended', 'Recent', 'Saved'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
            {t === 'Saved' && bookmarkedIds.size > 0 && (
              <span className="ml-1.5 text-[11px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-bold">
                {bookmarkedIds.size}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Two-column layout: List + Filters ─────────────── */}
      <div className="flex gap-5 items-start">

        {/* ── Left: Results ─────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Results bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{filtered.length}</span> opportunities
            </p>

            <div className="flex items-center gap-2">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowFilters(f => !f)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
              >
                <SlidersHorizontal size={14} />
                Filters
                {hasActiveFilters && <span className="w-2 h-2 bg-primary rounded-full" />}
              </button>

              {/* Sort dropdown */}
              <div className="relative flex items-center gap-1.5 text-sm text-gray-500">
                <span>Sort by:</span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {['Most Relevant', 'Newest', 'Alphabetical'].map(o => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* View toggle */}
              <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setViewPref('list')}
                  className={`p-2 transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-700 bg-white'}`}
                  aria-label="List view"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewPref('grid')}
                  className={`p-2 transition-colors ${view === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-700 bg-white'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile filter panel */}
          {showFilters && (
            <div className="lg:hidden mb-4">
              <FilterPanel filters={filters} setFilters={setFilters} allSkills={allSkills} onReset={resetFilters} />
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.types.map(t => (
                <span key={t} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-violet-50 text-violet-700 border border-violet-100 font-medium">
                  {t} <button onClick={() => setFilters(p => ({ ...p, types: p.types.filter(x => x !== t) }))}><X size={10} /></button>
                </span>
              ))}
              {filters.locations.map(l => (
                <span key={l} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                  {l} <button onClick={() => setFilters(p => ({ ...p, locations: p.locations.filter(x => x !== l) }))}><X size={10} /></button>
                </span>
              ))}
              {filters.skills.map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                  {s} <button onClick={() => setFilters(p => ({ ...p, skills: p.skills.filter(x => x !== s) }))}><X size={10} /></button>
                </span>
              ))}
              <button onClick={resetFilters} className="px-3 py-1 rounded-full text-xs text-gray-500 hover:text-gray-700 underline">Clear all</button>
            </div>
          )}

          {/* Cards */}
          {loading ? (
            <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4'}>
              {[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-gray-500 mb-4">{error}</p>
              <button onClick={fetchData} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-light transition-all">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-4xl">🔍</div>
              <div>
                <p className="font-bold text-gray-800 text-lg">No opportunities found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {search ? `No results for "${search}"` : tab === 'Saved' ? 'You haven\'t saved any opportunities yet.' : 'Try adjusting your filters'}
                </p>
              </div>
              {(hasActiveFilters || search) && (
                <button onClick={() => { resetFilters(); setSearch(''); }} className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
              {filtered.map(opp => (
                <OppCard
                  key={opp.id}
                  opp={opp}
                  view={view}
                  isApplied={appliedIds.has(opp.id)}
                  isApplying={applying === opp.id}
                  isBookmarked={bookmarkedIds.has(opp.id)}
                  onApply={handleApply}
                  onBookmark={handleBookmark}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Sticky Filter Panel (desktop) ──────── */}
        <div className="hidden lg:block w-72 shrink-0 sticky top-20">
          <FilterPanel filters={filters} setFilters={setFilters} allSkills={allSkills} onReset={resetFilters} />
        </div>

      </div>
    </div>
  );
};

export default Opportunities;