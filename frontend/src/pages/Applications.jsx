import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, ChevronRight, ChevronDown, X, ArrowLeft,
  Calendar, FileText, Clock, CheckCircle2, Circle, AlertCircle
} from 'lucide-react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/ToastProvider';
import { showConfirm } from '../utils/uiUtils';

/* ─── Constants ────────────────────────────────────────────────── */
const TIMELINE_STAGES = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Offer', 'Accepted'];

const STATUS_CONFIG = {
  'Applied':               { label: 'Applied',               cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',  dot: 'bg-emerald-500' },
  'Under Review':          { label: 'Under Review',           cls: 'bg-orange-50 text-orange-500 border-orange-200',    dot: 'bg-orange-400'  },
  'Online Assessment':     { label: 'Online Assessment',      cls: 'bg-yellow-50 text-yellow-600 border-yellow-200',    dot: 'bg-yellow-500'  },
  'Shortlisted':           { label: 'Shortlisted',            cls: 'bg-blue-50 text-blue-600 border-blue-200',          dot: 'bg-blue-500'    },
  'Interview':             { label: 'Interview',              cls: 'bg-blue-50 text-blue-600 border-blue-200',          dot: 'bg-blue-500'    },
  'Interview Scheduled':   { label: 'Interview Scheduled',    cls: 'bg-blue-50 text-blue-600 border-blue-200',          dot: 'bg-blue-500'    },
  'Offer':                 { label: 'Offer',                  cls: 'bg-violet-50 text-violet-600 border-violet-200',    dot: 'bg-violet-500'  },
  'Accepted':              { label: 'Accepted',               cls: 'bg-violet-50 text-violet-600 border-violet-200',    dot: 'bg-violet-500'  },
  'Rejected':              { label: 'Rejected',               cls: 'bg-red-50 text-red-500 border-red-200',             dot: 'bg-red-500'     },
  'External Link Opened':  { label: 'External',               cls: 'bg-gray-50 text-gray-500 border-gray-200',          dot: 'bg-gray-400'    },
};

const TABS = [
  { label: 'All Applications', filter: null },
  { label: 'In Progress',      filter: ['Applied', 'Under Review', 'Online Assessment', 'Shortlisted'] },
  { label: 'Interview',        filter: ['Interview', 'Interview Scheduled'] },
  { label: 'Offer',            filter: ['Offer', 'Accepted'] },
  { label: 'Rejected',         filter: ['Rejected'] },
];

const COMPANY_BG = ['bg-red-500','bg-blue-600','bg-indigo-600','bg-green-600','bg-orange-500','bg-purple-600','bg-teal-600'];
const cBg = (n = '') => COMPANY_BG[n.charCodeAt(0) % COMPANY_BG.length] || COMPANY_BG[0];

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
  if (d < 30) return `${Math.floor(d / 7)} week${Math.floor(d / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(d / 30)} month${Math.floor(d / 30) > 1 ? 's' : ''} ago`;
};

const fmt = (v) => {
  if (!v) return '';
  const ms = typeof v === 'object' && v.seconds ? v.seconds * 1000 : new Date(v).getTime();
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ─── Company logo tile ────────────────────────────────────────── */
const Logo = ({ name = '', logo = '', size = 52 }) => {
  if (logo) return (
    <div style={{ width: size, height: size }} className="rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 p-1.5">
      <img src={logo} alt={name} className="w-full h-full object-contain" onError={e => { e.target.style.display = 'none'; }} />
    </div>
  );
  return (
    <div style={{ width: size, height: size }} className={`${cBg(name)} rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0`}>
      {name.charAt(0).toUpperCase() || '?'}
    </div>
  );
};

/* ─── Status badge ─────────────────────────────────────────────── */
const StatusBadge = ({ status = '' }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Applied'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* ─── Skeleton card ────────────────────────────────────────────── */
const SkelCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 animate-pulse">
    <div className="w-14 h-14 bg-gray-200 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-2/5" />
    </div>
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="h-6 w-28 bg-gray-100 rounded-full" />
      <div className="h-3 w-24 bg-gray-100 rounded" />
    </div>
    <div className="w-5 h-5 bg-gray-200 rounded-full" />
  </div>
);

/* ─── Donut Chart ──────────────────────────────────────────────── */
const DonutChart = ({ data, total }) => {
  const DONUT_COLORS = { Applied: '#10b981', 'Under Review': '#f97316', Interview: '#3b82f6', Offer: '#8b5cf6', Rejected: '#ef4444' };
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segments = Object.entries(data).filter(([, v]) => v > 0);
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={128} height={128} viewBox="0 0 128 128">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={14} />
          {total === 0
            ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={14} />
            : segments.map(([key, val]) => {
                const pct = val / total;
                const dash = pct * circ;
                const gap  = circ - dash;
                const seg = (
                  <circle
                    key={key}
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke={DONUT_COLORS[key] || '#6c3aff'}
                    strokeWidth={14}
                    strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                    style={{ transition: 'stroke-dasharray 0.8s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                );
                offset += dash;
                return seg;
              })
          }
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-gray-900">{total}</span>
          <span className="text-[11px] text-gray-400 font-medium">Total</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Application Detail Drawer ────────────────────────────────── */
const DetailDrawer = ({ app, onClose, onWithdraw, withdrawing }) => {
  const stageIdx  = TIMELINE_STAGES.findIndex(s =>
    app.status?.toLowerCase().includes(s.toLowerCase()) ||
    s.toLowerCase().includes(app.status?.toLowerCase() || '')
  );
  const currentIdx = Math.max(0, stageIdx);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-start gap-3">
          <Logo name={app.company || app.company_name} logo={app.logo} size={48} />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-base truncate">{app.company || app.company_name || 'Company'}</h2>
            <p className="text-gray-500 text-sm truncate">{app.title || app.internship_title || app.opportunity_title}</p>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
              {app.location && <><MapPin size={11} />{app.location}</>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Status + dates */}
        <div className="p-5 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <StatusBadge status={app.status} />
            <span className="text-xs text-gray-400">{fmt(app.applied_at)}</span>
          </div>
          {app.type && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 font-medium">{app.type}</span>
          )}
        </div>

        {/* Timeline */}
        <div className="p-5 border-b border-gray-50">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Application Timeline</h3>
          <div className="space-y-0">
            {TIMELINE_STAGES.map((stage, i) => {
              const isPast    = i < currentIdx;
              const isCurrent = i === currentIdx;
              const isFuture  = i > currentIdx;
              return (
                <div key={stage} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isCurrent ? 'ring-4 ring-primary/20' : ''
                    } ${isPast ? 'bg-primary text-white' : isCurrent ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {isPast ? <CheckCircle2 size={14} /> : isCurrent ? <Circle size={14} /> : i + 1}
                    </div>
                    {i < TIMELINE_STAGES.length - 1 && (
                      <div className={`w-0.5 h-6 mt-0.5 ${isPast || isCurrent ? 'bg-primary/30' : 'bg-gray-100'}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-semibold ${isFuture ? 'text-gray-400' : 'text-gray-800'}`}>{stage}</p>
                    {isCurrent && <p className="text-[11px] text-primary mt-0.5">Current stage</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        {app.notes && (
          <div className="p-5 border-b border-gray-50">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Notes</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{app.notes}</p>
          </div>
        )}

        {/* Interview date */}
        {app.interview_date && (
          <div className="p-5 border-b border-gray-50">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Interview Scheduled</h3>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar size={15} className="text-blue-500" />
              {fmt(app.interview_date)}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-5 mt-auto space-y-2">
          {(app.status === 'Applied' || app.status === 'Under Review') && (
            <button
              onClick={() => onWithdraw(app.id)}
              disabled={withdrawing === app.id}
              className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {withdrawing === app.id && <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />}
              Withdraw Application
            </button>
          )}
          <Link
            to="/opportunities"
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#6c3aff,#3a9bff)' }}
          >
            Browse More Opportunities
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  MAIN APPLICATIONS PAGE                                         */
/* ═══════════════════════════════════════════════════════════════ */
const Applications = () => {
  const { addToast } = useToast();
  const { socket }   = useSocket();

  const [apps,        setApps]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [tab,         setTab]         = useState(0);
  const [search,      setSearch]      = useState('');
  const [sort,        setSort]        = useState('Most Recent');

  // Filter state (for right panel)
  const [filterStatus, setFilterStatus] = useState(['Applied','Under Review','Interview','Offer']);
  const [filterType,   setFilterType]   = useState('');
  const [filterLoc,    setFilterLoc]    = useState('');
  const [filterDate,   setFilterDate]   = useState('');
  const [filtersApplied, setFiltersApplied] = useState(false);

  /* ── Fetch ────────────────────────────────────────────────── */
  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/applications/my');
      setApps(res.data || []);
    } catch {
      setError('Failed to load applications. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  /* ── Socket real-time ─────────────────────────────────────── */
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (data) => {
      setApps(prev => prev.map(a => a.id === data.application_id ? { ...a, ...data } : a));
      if (data.type === 'status_change') addToast({ type: 'info', title: `Status updated: ${data.status}` });
    };
    const onWithdrawn = ({ application_id }) => setApps(prev => prev.filter(a => a.id !== application_id));
    socket.on('application_update', onUpdate);
    socket.on('application_withdrawn', onWithdrawn);
    return () => { socket.off('application_update', onUpdate); socket.off('application_withdrawn', onWithdrawn); };
  }, [socket, addToast]);

  /* ── Withdraw ─────────────────────────────────────────────── */
  const handleWithdraw = async (id) => {
    if (!await showConfirm('Withdraw this application? This cannot be undone.')) return;
    setWithdrawing(id);
    try {
      await api.delete(`/applications/${id}`);
      setApps(prev => prev.filter(a => a.id !== id));
      setSelectedApp(null);
      addToast({ type: 'success', title: 'Application withdrawn.' });
    } catch (e) {
      addToast({ type: 'error', title: e.response?.data?.message || 'Failed to withdraw.' });
    } finally { setWithdrawing(null); }
  };

  /* ── Overview counts ──────────────────────────────────────── */
  const overview = useMemo(() => {
    const counts = { Applied: 0, 'Under Review': 0, Interview: 0, Offer: 0, Rejected: 0 };
    apps.forEach(a => {
      const s = a.status || '';
      if (s === 'Applied')                                    counts['Applied']++;
      else if (s === 'Under Review' || s === 'Shortlisted')   counts['Under Review']++;
      else if (s.includes('Interview') || s === 'Online Assessment') counts['Interview']++;
      else if (s === 'Offer' || s === 'Accepted')             counts['Offer']++;
      else if (s === 'Rejected')                              counts['Rejected']++;
    });
    return counts;
  }, [apps]);

  /* ── Unique locations / types for filter dropdowns ────────── */
  const allLocations = useMemo(() => [...new Set(apps.map(a => a.location).filter(Boolean))], [apps]);
  const allTypes     = useMemo(() => [...new Set(apps.map(a => a.type).filter(Boolean))], [apps]);

  /* ── Filter + sort ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...apps];

    // Tab filter
    const tabCfg = TABS[tab];
    if (tabCfg.filter) list = list.filter(a => tabCfg.filter.some(f => (a.status || '').toLowerCase().includes(f.toLowerCase())));

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.company || a.company_name || '').toLowerCase().includes(q) ||
        (a.title || a.internship_title || a.opportunity_title || '').toLowerCase().includes(q) ||
        (a.location || '').toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q)
      );
    }

    // Right-panel filters (only when applied)
    if (filtersApplied) {
      if (filterStatus.length > 0) {
        list = list.filter(a => filterStatus.some(f =>
          (a.status || '').toLowerCase().includes(f.toLowerCase())
        ));
      }
      if (filterType)  list = list.filter(a => (a.type || '') === filterType);
      if (filterLoc)   list = list.filter(a => (a.location || '') === filterLoc);
    }

    // Sort
    list.sort((a, b) => {
      const ta = a.applied_at?.seconds ? a.applied_at.seconds * 1000 : new Date(a.applied_at || 0).getTime();
      const tb = b.applied_at?.seconds ? b.applied_at.seconds * 1000 : new Date(b.applied_at || 0).getTime();
      if (sort === 'Most Recent') return tb - ta;
      if (sort === 'Oldest')      return ta - tb;
      if (sort === 'Company')     return (a.company || '').localeCompare(b.company || '');
      if (sort === 'Application Status') return (a.status || '').localeCompare(b.status || '');
      return tb - ta;
    });

    return list;
  }, [apps, tab, search, sort, filtersApplied, filterStatus, filterType, filterLoc]);

  const total = apps.length;

  /* ── Loading ───────────────────────────────────────────────── */
  if (loading) return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
      <div className="flex gap-5 mt-6">
        <div className="flex-1 space-y-3">{[1,2,3,4,5].map(i => <SkelCard key={i} />)}</div>
        <div className="w-64 shrink-0 hidden lg:block"><div className="h-96 bg-gray-100 rounded-2xl animate-pulse" /></div>
      </div>
    </div>
  );

  /* ── Error ─────────────────────────────────────────────────── */
  if (error) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <AlertCircle size={40} className="text-red-400" />
      <p className="text-gray-500 text-sm">{error}</p>
      <button onClick={fetchApps} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-all">Retry</button>
    </div>
  );

  /* ── Empty ─────────────────────────────────────────────────── */
  if (!loading && apps.length === 0) return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-1">My Applications</h1>
      <p className="text-gray-500 text-sm mb-8">Track and manage all your job applications in one place.</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-4xl">📋</div>
        <div>
          <p className="font-bold text-gray-800 text-lg">No applications yet</p>
          <p className="text-gray-400 text-sm mt-1">Start applying to opportunities to track them here.</p>
        </div>
        <Link to="/opportunities" className="px-6 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg,#6c3aff,#3a9bff)' }}>
          Browse Opportunities
        </Link>
      </div>
    </div>
  );

  /* ── Main render ───────────────────────────────────────────── */
  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto pb-12">

      {/* Detail drawer */}
      {selectedApp && (
        <DetailDrawer
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onWithdraw={handleWithdraw}
          withdrawing={withdrawing}
        />
      )}

      {/* ── Title ────────────────────────────────────────────── */}
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">My Applications</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track and manage all your job applications in one place.</p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-5">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              tab === i ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Two-column layout ─────────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* ── Left: List ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Results bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{filtered.length}</span> application{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search applications..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-primary w-44 transition-all"
                />
              </div>
              {/* Sort */}
              <div className="relative flex items-center gap-1.5 text-sm text-gray-500">
                <span className="hidden sm:inline">Sort by:</span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none cursor-pointer"
                  >
                    {['Most Recent','Oldest','Company','Application Status'].map(o => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile search */}
          <div className="relative sm:hidden mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search applications..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* Application list */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-3 text-center">
              <div className="text-3xl">🔍</div>
              <p className="font-bold text-gray-700">No applications match your filters</p>
              <button onClick={() => { setSearch(''); setTab(0); }} className="text-sm text-primary hover:underline font-medium">Clear filters</button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map(app => {
                const company = app.company || app.company_name || 'Company';
                const title   = app.title || app.internship_title || app.opportunity_title || 'Position';
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Logo name={company} logo={app.logo} size={52} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-[15px] truncate">{company}</h3>
                        <p className="text-gray-500 text-sm truncate">{title}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {app.location && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin size={11} /> {app.location}
                            </span>
                          )}
                          {app.type && (
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              (app.type || '').toLowerCase().includes('intern')
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {app.type}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: status + date + arrow */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge status={app.status} />
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> Applied {timeAgo(app.applied_at)}
                        </span>
                      </div>

                      <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Overview + Filters ────────────────────────── */}
        <div className="hidden lg:block w-72 shrink-0 sticky top-20 space-y-4">

          {/* Application Overview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Application Overview</h3>

            <DonutChart data={overview} total={total} />

            <div className="space-y-2.5 mt-4">
              {Object.entries(overview).map(([key, val]) => {
                const cfg = {
                  Applied:       { color: '#10b981', dot: 'bg-emerald-500' },
                  'Under Review':{ color: '#f97316', dot: 'bg-orange-400' },
                  Interview:     { color: '#3b82f6', dot: 'bg-blue-500' },
                  Offer:         { color: '#8b5cf6', dot: 'bg-violet-500' },
                  Rejected:      { color: '#ef4444', dot: 'bg-red-500' },
                }[key] || {};
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <span className="text-sm text-gray-600">{key}</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{val}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">Filters</h3>
              <button
                onClick={() => { setFilterStatus(['Applied','Under Review','Interview','Offer']); setFilterType(''); setFilterLoc(''); setFilterDate(''); setFiltersApplied(false); }}
                className="text-xs font-semibold hover:underline"
                style={{ color: '#6c3aff' }}
              >
                Clear all
              </button>
            </div>

            {/* Status */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Status</p>
              {['Applied', 'Under Review', 'Interview', 'Offer', 'Rejected'].map(s => (
                <label key={s} className="flex items-center gap-2 py-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filterStatus.includes(s)}
                    onChange={() => setFilterStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                    className="w-4 h-4 rounded accent-[#6c3aff]"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s]?.dot || 'bg-gray-400'}`} />
                    {s}
                  </span>
                </label>
              ))}
            </div>

            <div className="border-t border-gray-50 my-3" />

            {/* Job Type */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Job Type</p>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">All Job Types</option>
                  {allTypes.map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Location */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Location</p>
              <div className="relative">
                <select
                  value={filterLoc}
                  onChange={e => setFilterLoc(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">All Locations</option>
                  {allLocations.map(l => <option key={l}>{l}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Date Applied */}
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Date Applied</p>
              <div className="relative">
                <select
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Anytime</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => setFiltersApplied(true)}
              className="w-full py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg,#6c3aff,#3a9bff)' }}
            >
              Apply Filters
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Applications;