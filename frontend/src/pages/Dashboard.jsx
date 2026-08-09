import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  GraduationCap,
  Briefcase,
  Trophy,
  FileCheck2,
  Video,
  Users,
  BookOpen,
  Zap,
  ArrowRight,
  ShieldCheck,
  Star,
  TrendingUp,
  Code2,
} from 'lucide-react';

/* ── Category Cards — each routes to a distinct page ─────── */
const CATEGORIES = [
  {
    id: 'internships',
    title: 'Internships',
    path: '/opportunities/internship',
    Icon: GraduationCap,
  },
  {
    id: 'jobs',
    title: 'Jobs',
    path: '/opportunities/job',
    Icon: Briefcase,
  },
  {
    id: 'competitions',
    title: 'Competitions',
    path: '/opportunities/competition',
    Icon: Trophy,
  },
  {
    id: 'mock-tests',
    title: 'Mock Tests',
    path: '/skill-assessments',
    Icon: FileCheck2,
  },
  {
    id: 'mock-interviews',
    title: 'Mock Interviews',
    path: '/mock-interview',
    Icon: Video,
  },
  {
    id: 'mentorships',
    title: 'Mentorships',
    path: '/mentors',
    Icon: Users,
  },
  {
    id: 'courses',
    title: 'Courses',
    path: '/learning',
    Icon: BookOpen,
  },
];

/* ── Featured Cards ─────────────────────────────────────── */
const FEATURED_ITEMS = [
  {
    id: 1,
    title: 'Smart India Hackathon 2026',
    subtitle: 'National Innovation & Skill Challenge for Students',
    tag: 'Registration Open',
    reward: '₹8 Lakh Prize Pool',
    organizer: 'Codovate Innovation Cell',
    path: '/opportunities/competition',
    bgFrom: 'from-amber-50',
    bgTo: 'to-orange-100/60',
    borderColor: 'border-orange-200/80',
    tagClass: 'bg-white/80 text-amber-700 border border-amber-200',
    dark: false,
  },
  {
    id: 2,
    title: 'Maestros Tech Track 2026',
    subtitle: 'Master Every Link. Deliver Every Win.',
    tag: 'Live Now',
    reward: 'Direct Interview Call',
    organizer: 'Codovate Placement Cell',
    path: '/opportunities/internship',
    bgFrom: 'from-[#EBF3FF]',
    bgTo: 'to-blue-100/40',
    borderColor: 'border-blue-200/80',
    tagClass: 'bg-white/80 text-blue-700 border border-blue-100',
    dark: false,
  },
  {
    id: 3,
    title: '100 Days of Code: Career Sprint',
    subtitle: 'Elevate Your Skills with Hands-on Challenges',
    tag: 'Apply Now',
    reward: 'Certificate + PPO',
    organizer: 'Codovate Learning',
    path: '/learning',
    bgFrom: 'from-[#2D1B6B]',
    bgTo: 'to-[#1a0f4b]',
    borderColor: 'border-purple-900/60',
    tagClass: 'bg-white/10 text-purple-200 border border-white/20',
    dark: true,
  },
  {
    id: 4,
    title: 'AI Full-Stack Innovation Challenge',
    subtitle: 'Build. Compete. Get Shortlisted by Top Companies.',
    tag: 'Closing Soon',
    reward: '₹5 Lakh Grant Pool',
    organizer: 'Codovate ONE Ecosystem',
    path: '/opportunities/competition',
    bgFrom: 'from-[#E0EEFF]',
    bgTo: 'to-[#EBF3FF]',
    borderColor: 'border-blue-200',
    tagClass: 'bg-white/80 text-blue-700 border border-blue-100',
    dark: false,
  },
];

/* ── Opportunity Card (Live Data) ───────────────────────── */
const LiveCard = ({ opp }) => {
  const navigate = useNavigate();
  const skills = (opp.required_skills || []).slice(0, 3);
  const statusOpen = opp.is_active !== false && opp.status !== 'Closed';

  return (
    <div
      onClick={() => navigate(`/opportunities/${opp.id}`)}
      className="group bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-[#0066FF]/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#EBF3FF] border border-blue-100 flex items-center justify-center font-extrabold text-[#0066FF] text-sm shrink-0">
            {(opp.company || opp.organization || 'C').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm text-slate-900 leading-snug group-hover:text-[#0066FF] transition-colors truncate">
              {opp.title}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
              {opp.company || opp.organization || 'Company'}
            </p>
          </div>
        </div>
        {opp.match_score != null && (
          <div className={`shrink-0 px-2 py-1 rounded-lg text-xs font-extrabold ${
            opp.match_score >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {opp.match_score}%
          </div>
        )}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map(s => (
            <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#EBF3FF] text-[#0066FF] border border-blue-100">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${statusOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
          {statusOpen ? 'Open' : 'Closed'}
        </span>
        <span className="text-[10px] font-bold text-[#0066FF] group-hover:underline flex items-center gap-1">
          Apply <ArrowRight size={10} />
        </span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════ MAIN DASHBOARD ═══════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liveOpps, setLiveOpps] = useState([]);
  const [loading, setLoading]   = useState(true);

  const studentName = user?.name ? user.name.split(' ')[0] : 'Student';

  /* Fetch top live opportunities for the "Live Now" strip */
  useEffect(() => {
    let mounted = true;
    api.get('/opportunities')
      .then(r => {
        if (!mounted) return;
        const data = Array.isArray(r.data) ? r.data :
                     Array.isArray(r.data?.opportunities) ? r.data.opportunities : [];
        setLiveOpps(data.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="w-full space-y-8 font-sans pb-12">

      {/* ── HEADER: Unlock Your Career ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Unlock Your <span className="text-[#0066FF]">Career!</span>
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1.5">
            Welcome back, <span className="text-slate-800">{studentName}</span>. Explore what's waiting for you.
          </p>
        </div>

        <div
          onClick={() => navigate('/opportunities/internship')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E0EEFF] text-[#0066FF] border border-blue-200/80 shadow-2xs cursor-pointer hover:bg-[#D0E4FF] transition-colors"
        >
          <Zap size={14} className="fill-[#0066FF]" />
          <span className="text-xs font-bold tracking-wide">Access to 850M+ Profiles with Codovate ONE</span>
        </div>
      </div>

      {/* ── HORIZONTAL CATEGORY CARDS (7) ──────────────────────── */}
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

      {/* ── FEATURED SECTION ────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-7 rounded-full bg-[#0066FF]" />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Featured</h2>
          </div>
          <button
            onClick={() => navigate('/opportunities/internship')}
            className="text-xs sm:text-sm font-bold text-[#0066FF] hover:underline flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`group text-left rounded-[22px] border p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden bg-gradient-to-b ${item.bgFrom} ${item.bgTo} ${item.borderColor} ${item.dark ? 'text-white' : 'text-slate-900'} focus:outline-none`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${item.tagClass}`}>
                    {item.tag}
                  </span>
                  <ShieldCheck size={16} className={item.dark ? 'text-emerald-400' : 'text-emerald-600'} />
                </div>
                <div className="pt-1">
                  <p className={`text-[11px] font-semibold ${item.dark ? 'text-purple-300' : 'text-slate-500'}`}>
                    {item.organizer}
                  </p>
                  <h3 className="font-extrabold text-base leading-snug mt-1 group-hover:text-[#0066FF] transition-colors">
                    {item.title}
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed font-normal ${item.dark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t mt-5 flex items-center justify-between" style={{ borderColor: item.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }}>
                <div>
                  <p className={`text-[9px] uppercase font-bold tracking-wider ${item.dark ? 'text-slate-400' : 'text-slate-400'}`}>
                    Reward / Prize
                  </p>
                  <p className={`text-xs font-extrabold ${item.dark ? 'text-amber-300' : 'text-slate-900'}`}>
                    {item.reward}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#0066FF] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <ArrowRight size={14} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── LIVE OPPORTUNITIES STRIP ─────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-7 rounded-full bg-emerald-500" />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Live Now</h2>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Active
            </span>
          </div>
          <button
            onClick={() => navigate('/opportunities/internship')}
            className="text-xs sm:text-sm font-bold text-[#0066FF] hover:underline flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-5 w-16 bg-blue-50 rounded-lg" />
                  <div className="h-5 w-16 bg-blue-50 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : liveOpps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {liveOpps.map(opp => <LiveCard key={opp.id} opp={opp} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EBF3FF] flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={24} className="text-[#0066FF]" />
            </div>
            <p className="font-bold text-slate-700 text-sm">New opportunities added daily!</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Check back soon or browse all categories above.</p>
            <button
              onClick={() => navigate('/opportunities/internship')}
              className="px-5 py-2.5 rounded-xl bg-[#0066FF] text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Browse All Opportunities
            </button>
          </div>
        )}
      </div>

      {/* ── QUICK ACCESS ROW ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'My Roadmap',     path: '/roadmap',         emoji: '🗺️' },
          { label: 'Resume Builder', path: '/resume-builder',  emoji: '📄' },
          { label: 'Mock Interview', path: '/mock-interview',  emoji: '🎤' },
          { label: 'Leaderboard',    path: '/leaderboard',     emoji: '🏆' },
          { label: 'Community',      path: '/community',       emoji: '💬' },
          { label: 'My Projects',    path: '/projecthub',      emoji: '🚀' },
        ].map(({ label, path, emoji }) => (
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
  );
};

export default Dashboard;