import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  GraduationCap, Briefcase, Trophy, FileCheck2, Video,
  Users, BookOpen, Zap, ArrowRight, Star, TrendingUp,
  Calendar, Bell, Code2, Map, FolderGit2, RefreshCw,
  AlertCircle, ExternalLink, ShieldCheck, Clock, MapPin,
} from 'lucide-react';

/* ─── Student category tiles ─── */
const CATEGORIES = [
  { id: 'internships',  title: 'Internships',   path: '/opportunities/internship',  Icon: GraduationCap },
  { id: 'jobs',         title: 'Jobs',           path: '/opportunities/job',          Icon: Briefcase     },
  { id: 'competitions', title: 'Competitions',   path: '/opportunities/competition',  Icon: Trophy        },
  { id: 'mock-tests',   title: 'Mock Tests',     path: '/skill-assessments',          Icon: FileCheck2    },
  { id: 'interviews',   title: 'Mock Interviews',path: '/mock-interview',             Icon: Video         },
  { id: 'mentorships',  title: 'Mentorships',    path: '/mentors',                    Icon: Users         },
  { id: 'courses',      title: 'Courses',        path: '/learning',                   Icon: BookOpen      },
];

const QUICK_LINKS = [
  { label: 'My Roadmap',    path: '/roadmap',        emoji: '🗺️', Icon: Map        },
  { label: 'Resume Builder',path: '/resume-builder', emoji: '📄', Icon: Briefcase  },
  { label: 'Mock Interview',path: '/mock-interview', emoji: '🎤', Icon: Video      },
  { label: 'Leaderboard',   path: '/leaderboard',    emoji: '🏆', Icon: Trophy     },
  { label: 'Community',     path: '/community',      emoji: '💬', Icon: Users      },
  { label: 'My Projects',   path: '/projecthub',     emoji: '🚀', Icon: FolderGit2 },
];

/* ─── Utility: format date ─── */
const fmtDate = (val) => {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ─── Featured Opportunity Card (from real admin data) ─── */
const FeaturedCard = ({ opp }) => {
  const navigate = useNavigate();
  const isOpen   = opp.is_active !== false && !['closed','inactive'].includes((opp.status || '').toLowerCase());

  return (
    <button
      onClick={() => navigate(`/opportunities/${opp.type?.toLowerCase() || 'internship'}`)}
      className="group text-left bg-white rounded-[22px] border border-slate-200/80 p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#0066FF]/30 relative overflow-hidden focus:outline-none"
    >
      {/* Tag + verified badge */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            isOpen
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
          <ShieldCheck size={15} className="text-emerald-600" />
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-500">{opp.company || opp.organization || 'Codovate'}</p>
          <h3 className="font-extrabold text-base text-slate-900 leading-snug mt-1 group-hover:text-[#0066FF] transition-colors line-clamp-2">
            {opp.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-normal leading-relaxed">
            {opp.description || `${opp.type} opportunity — Apply now.`}
          </p>
        </div>
      </div>

      {/* Reward / CTA row */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          {opp.stipend || opp.salary ? (
            <>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Stipend / Salary</p>
              <p className="text-xs font-extrabold text-slate-900">₹{opp.stipend || opp.salary}</p>
            </>
          ) : (
            <p className="text-xs font-bold text-slate-500">{opp.type || 'Opportunity'}</p>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-[#0066FF] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
          <ArrowRight size={14} />
        </div>
      </div>
    </button>
  );
};

/* ─── Live Opportunity Mini Card ─── */
const LiveCard = ({ opp }) => {
  const navigate  = useNavigate();
  const skills    = (opp.required_skills || []).slice(0, 2);
  const isOpen    = opp.is_active !== false;

  return (
    <div
      onClick={() => navigate(`/opportunities/${opp.id}`)}
      className="group bg-white rounded-2xl border border-slate-200/80 p-4 hover:border-[#0066FF]/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-2.5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#EBF3FF] border border-blue-100 flex items-center justify-center font-extrabold text-[#0066FF] text-sm shrink-0 overflow-hidden">
          {opp.company_logo_url
            ? <img src={opp.company_logo_url} alt="" className="w-full h-full object-contain p-1" />
            : (opp.company || 'C').charAt(0).toUpperCase()
          }
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0066FF] transition-colors line-clamp-1">
            {opp.title}
          </h4>
          <p className="text-xs text-slate-500 font-semibold truncate">{opp.company || 'Company'}</p>
        </div>
        {opp.match_score != null && (
          <span className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
            opp.match_score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {opp.match_score}%
          </span>
        )}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skills.map(s => (
            <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EBF3FF] text-[#0066FF]">{s}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
          isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
        }`}>
          {isOpen ? 'Open' : 'Closed'}
        </span>
        <span className="text-[10px] text-slate-400 font-medium">{fmtDate(opp.created_at)}</span>
      </div>
    </div>
  );
};

/* ─── Upcoming Event Card ─── */
const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const eventDate = event.date ? new Date(event.date) : null;
  const isPast    = eventDate && eventDate < new Date();

  return (
    <div
      onClick={() => navigate('/events')}
      className="group bg-white rounded-2xl border border-slate-200/80 p-4 hover:border-[#0066FF]/40 hover:shadow-md transition-all duration-200 cursor-pointer flex items-start gap-3"
    >
      {/* Date Block */}
      <div className="w-12 shrink-0 flex flex-col items-center justify-center bg-[#EBF3FF] rounded-xl p-2 border border-blue-100">
        {eventDate ? (
          <>
            <span className="text-[10px] font-extrabold text-[#0066FF] uppercase">
              {eventDate.toLocaleDateString('en-IN', { month: 'short' })}
            </span>
            <span className="text-xl font-extrabold text-slate-900 leading-none">
              {eventDate.getDate()}
            </span>
          </>
        ) : (
          <Calendar size={20} className="text-[#0066FF]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0066FF] transition-colors line-clamp-1">
          {event.title}
        </h4>
        {event.description && (
          <p className="text-xs text-slate-500 line-clamp-1 font-normal mt-0.5">{event.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-semibold">
          {event.location && <span className="flex items-center gap-0.5"><MapPin size={9} />{event.location}</span>}
          {event.attendees > 0 && <span>{event.attendees} attending</span>}
          {isPast && <span className="text-slate-400">Past event</span>}
        </div>
      </div>

      <ExternalLink size={13} className="text-slate-400 shrink-0 group-hover:text-[#0066FF] transition-colors" />
    </div>
  );
};

/* ─── Skeleton Loader ─── */
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
);

const FeatureCardSkeleton = () => (
  <div className="bg-white rounded-[22px] border border-slate-200 p-5 flex flex-col gap-3 animate-pulse">
    <div className="flex justify-between">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
    <div className="flex justify-between border-t border-slate-100 pt-3">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

/* ═══════════════════════ MAIN DASHBOARD ═══════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const studentName = user?.name ? user.name.split(' ')[0] : 'Student';

  /* ── State ─────────────────────────────────────────────── */
  const [featured,  setFeatured]  = useState([]);
  const [liveOpps,  setLiveOpps]  = useState([]);
  const [events,    setEvents]    = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState({ featured: true, live: true, events: true });
  const [error,     setError]     = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  /* ── Fetch Featured Opportunities (admin-managed is_featured=true) ─ */
  const fetchFeatured = useCallback(async () => {
    try {
      setLoading(p => ({ ...p, featured: true }));
      const res  = await api.get('/opportunities');
      const data = Array.isArray(res.data) ? res.data :
                   Array.isArray(res.data?.opportunities) ? res.data.opportunities : [];

      // Featured = is_featured flag or highest match_score + active
      const featuredItems = data.filter(o => o.is_featured);
      const fallback      = data.filter(o => o.is_active !== false).slice(0, 4);

      setFeatured(featuredItems.length >= 2 ? featuredItems.slice(0, 4) : fallback);
    } catch {
      setFeatured([]);
    } finally {
      setLoading(p => ({ ...p, featured: false }));
    }
  }, []);

  /* ── Fetch Live / Best-Match Opportunities ─────────────── */
  const fetchLive = useCallback(async () => {
    try {
      setLoading(p => ({ ...p, live: true }));
      const res  = await api.get('/opportunities');
      const data = Array.isArray(res.data) ? res.data :
                   Array.isArray(res.data?.opportunities) ? res.data.opportunities : [];

      // Top 4 active, sorted by match_score desc
      const live = data
        .filter(o => o.is_active !== false)
        .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
        .slice(0, 4);

      setLiveOpps(live);
    } catch {
      setLiveOpps([]);
    } finally {
      setLoading(p => ({ ...p, live: false }));
    }
  }, []);

  /* ── Fetch Upcoming Events ─────────────────────────────── */
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(p => ({ ...p, events: true }));
      const res = await api.get('/events');
      const data = Array.isArray(res.data) ? res.data : [];

      // Sort upcoming first
      const sorted = data.sort((a, b) => {
        const da = a.date ? new Date(a.date) : new Date(0);
        const db_ = b.date ? new Date(b.date) : new Date(0);
        return da - db_;
      });

      setEvents(sorted.slice(0, 3));
    } catch {
      setEvents([]);
    } finally {
      setLoading(p => ({ ...p, events: false }));
    }
  }, []);

  /* ── Fetch Student Dashboard Stats ─────────────────────── */
  const fetchStats = useCallback(async () => {
    try {
      const [dashRes, profileRes] = await Promise.allSettled([
        api.get('/dashboard'),
        api.get('/students/workspace'),
      ]);

      const dash    = dashRes.status === 'fulfilled' ? dashRes.value.data : {};
      const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : {};

      setStats({
        applications:    dash.applications_count || 0,
        profilePct:      profile?.profile?.profile_completion || dash.profile_completion || 0,
        savedOpps:       dash.saved_opportunities || 0,
        upcomingEvents:  dash.upcoming_events || 0,
      });
    } catch {
      setStats(null);
    }
  }, []);

  /* ── Load everything on mount ─────────────────────────── */
  useEffect(() => {
    Promise.all([fetchFeatured(), fetchLive(), fetchEvents(), fetchStats()]);
    setLastRefresh(new Date());
  }, [fetchFeatured, fetchLive, fetchEvents, fetchStats]);

  /* ── Manual Refresh ────────────────────────────────────── */
  const handleRefresh = () => {
    Promise.all([fetchFeatured(), fetchLive(), fetchEvents(), fetchStats()]);
    setLastRefresh(new Date());
  };

  const anyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="w-full space-y-8 font-sans pb-12">

      {/* ── HERO HEADER ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Unlock Your <span className="text-[#0066FF]">Career!</span>
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1.5">
            Welcome back, <span className="text-slate-800 font-bold">{studentName}</span>. Here's what's new today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={anyLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#0066FF] hover:border-[#0066FF]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh dashboard"
          >
            <RefreshCw size={16} className={anyLoading ? 'animate-spin' : ''} />
          </button>

          {/* Access Badge */}
          <div
            onClick={() => navigate('/opportunities/internship')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E0EEFF] text-[#0066FF] border border-blue-200/80 shadow-2xs cursor-pointer hover:bg-[#D0E4FF] transition-colors"
          >
            <Zap size={14} className="fill-[#0066FF]" />
            <span className="text-xs font-bold tracking-wide hidden sm:inline">Access to 850M+ Profiles</span>
            <span className="text-xs font-bold tracking-wide sm:hidden">Codovate ONE</span>
          </div>
        </div>
      </div>

      {/* ── STATS STRIP (from real dashboard API) ────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Applications',    value: stats.applications,   emoji: '📋', path: '/applications'           },
            { label: 'Profile Complete',value: `${stats.profilePct}%`,emoji: '👤', path: '/profile'               },
            { label: 'Saved',           value: stats.savedOpps,      emoji: '❤️', path: '/opportunities/internship'},
            { label: 'Events',          value: stats.upcomingEvents,  emoji: '📅', path: '/events'                 },
          ].map(({ label, value, emoji, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 text-left hover:border-[#0066FF]/40 hover:shadow-sm transition-all group focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EBF3FF] flex items-center justify-center text-xl">
                  {emoji}
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900 group-hover:text-[#0066FF] transition-colors">
                    {value}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">{label}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── 7 CATEGORY TILES ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {CATEGORIES.map(({ id, title, path, Icon }) => (
          <button
            key={id}
            onClick={() => navigate(path)}
            className="group bg-[#EBF3FF] hover:bg-[#E0EEFF] border border-blue-100/80 rounded-[20px] p-4 flex flex-col items-center justify-between gap-3 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none"
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Icon size={22} className="text-[#0066FF]" strokeWidth={2} />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-[#0066FF] transition-colors leading-tight">
              {title}
            </span>
          </button>
        ))}
      </div>

      {/* ── FEATURED SECTION (admin-controlled via is_featured flag) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-7 rounded-full bg-[#0066FF]" />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Featured</h2>
            {!loading.featured && featured.length > 0 && (
              <span className="text-xs font-bold text-slate-400">({featured.length})</span>
            )}
          </div>
          <button
            onClick={() => navigate('/opportunities/internship')}
            className="text-xs sm:text-sm font-bold text-[#0066FF] hover:underline flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading.featured ? (
            Array.from({ length: 4 }).map((_, i) => <FeatureCardSkeleton key={i} />)
          ) : featured.length > 0 ? (
            featured.map(opp => <FeaturedCard key={opp.id} opp={opp} />)
          ) : (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF3FF] flex items-center justify-center mx-auto mb-3">
                <Star size={24} className="text-[#0066FF]" />
              </div>
              <p className="font-bold text-slate-700 text-sm">No featured opportunities yet</p>
              <p className="text-xs text-slate-400 mt-1">Admin can mark opportunities as featured from the admin panel.</p>
              <button
                onClick={() => navigate('/opportunities/internship')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#0066FF] text-white text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                Browse All Opportunities
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── LIVE NOW STRIP + EVENTS (2-column) ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Live Opportunities (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-7 rounded-full bg-emerald-500" />
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Live Now</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Active
              </span>
            </div>
            <button
              onClick={() => navigate('/opportunities/internship')}
              className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loading.live ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-16 rounded" />
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                </div>
              ))
            ) : liveOpps.length > 0 ? (
              liveOpps.map(opp => <LiveCard key={opp.id} opp={opp} />)
            ) : (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <TrendingUp size={28} className="text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-600 text-sm">No live opportunities right now</p>
                <p className="text-xs text-slate-400 mt-1">Check back soon — new ones are added daily.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Upcoming Events (1/3 width) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-7 rounded-full bg-amber-500" />
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Events</h2>
            </div>
            <button
              onClick={() => navigate('/events')}
              className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1"
            >
              All Events <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {loading.events ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3 animate-pulse">
                  <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : events.length > 0 ? (
              events.map(ev => <EventCard key={ev.id} event={ev} />)
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <Calendar size={24} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">No upcoming events</p>
                <p className="text-xs text-slate-400 mt-1">Events added by admin will appear here.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── QUICK ACCESS GRID ─────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-7 rounded-full bg-purple-500" />
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Quick Access</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_LINKS.map(({ label, path, emoji }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="bg-white hover:bg-[#EBF3FF] border border-slate-200/80 hover:border-[#0066FF]/30 rounded-2xl p-4 flex flex-col items-center gap-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus:outline-none group"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-[#0066FF] transition-colors leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;