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
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/* Category Cards Row matching Unstop Screenshot Spec */
const CATEGORIES = [
  { id: 'internships', title: 'Internships', path: '/opportunities?type=internship', Icon: GraduationCap, color: '#0066FF', bg: '#EBF3FF' },
  { id: 'jobs', title: 'Jobs', path: '/opportunities?type=job', Icon: Briefcase, color: '#0066FF', bg: '#EBF3FF' },
  { id: 'competitions', title: 'Competitions', path: '/opportunities?type=competition', Icon: Trophy, color: '#0066FF', bg: '#EBF3FF' },
  { id: 'mock-tests', title: 'Mock Tests', path: '/skill-assessments', Icon: FileCheck2, color: '#0066FF', bg: '#EBF3FF' },
  { id: 'mock-interviews', title: 'Mock Interviews', path: '/mock-interview', Icon: Video, color: '#0066FF', bg: '#EBF3FF' },
  { id: 'mentorships', title: 'Mentorships', path: '/mentors', Icon: Users, color: '#0066FF', bg: '#EBF3FF' },
  { id: 'courses', title: 'Courses', path: '/learning', Icon: BookOpen, color: '#0066FF', bg: '#EBF3FF' },
];

/* Sample Featured Opportunities matching Unstop Showcase Cards */
const FEATURED_ITEMS = [
  {
    id: 1,
    title: 'Smart India Hackathon 2026',
    subtitle: 'National Innovation & Skill Challenge',
    category: 'Competitions',
    reward: '₹8 Lakh Prize Pool',
    tag: 'Registration Open',
    bgColor: 'from-amber-50 to-orange-100/60',
    borderColor: 'border-orange-200/80',
    bannerGradient: 'from-blue-600 to-indigo-700',
    organizer: 'Codovate Innovation Cell',
  },
  {
    id: 2,
    title: 'Maestros Tech & Supply Chain Track',
    subtitle: 'Master Every Link. Deliver Every Win.',
    category: 'Internships & Hiring',
    reward: 'Direct Interview Call',
    tag: 'Live Now',
    bgColor: 'from-amber-100/50 to-yellow-50',
    borderColor: 'border-amber-200/80',
    bannerGradient: 'from-[#7C3AED] to-[#4F46E5]',
    organizer: 'Mondelez International',
  },
  {
    id: 3,
    title: '100 Days of Code & Career Acceleration',
    subtitle: 'Elevate Your Skills with Hands-on Excellence',
    category: 'Courses & Contests',
    reward: 'PhD & Internship Grants',
    tag: 'Apply Now',
    bgColor: 'from-purple-900 to-indigo-950',
    borderColor: 'border-purple-800',
    bannerGradient: 'from-purple-600 to-indigo-900',
    organizer: 'Asian Paints Alchemy',
    isDarkCard: true,
  },
  {
    id: 4,
    title: 'AI Full-Stack Innovation Challenge',
    subtitle: 'Build. Compete. Get Funded by Top Mentors',
    category: 'Hackathons',
    reward: '₹5 Lakh Grant Pool',
    tag: 'Closing Soon',
    bgColor: 'from-[#E0EEFF] to-[#EBF3FF]',
    borderColor: 'border-blue-200',
    bannerGradient: 'from-blue-700 to-cyan-600',
    organizer: 'Codovate ONE Ecosystem',
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Fetch real opportunities from backend if available */
  useEffect(() => {
    let isMounted = true;
    api.get('/opportunities')
      .then(r => {
        if (isMounted && r.data?.opportunities) {
          setOpportunities(r.data.opportunities);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const studentName = user?.name ? user.name.split(' ')[0] : 'Student';

  return (
    <div className="w-full space-y-8 font-sans pb-12">
      
      {/* ── HEADER BANNER: Unlock Your Career! ──────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Unlock Your <span className="text-[#0066FF]">Career!</span>
          </h1>
        </div>

        {/* Access Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E0EEFF] text-[#0066FF] border border-blue-200/80 shadow-2xs">
          <Zap size={15} className="fill-[#0066FF]" />
          <span className="text-xs font-bold tracking-wide">
            Access to 850M+ Profiles with Codovate ONE
          </span>
        </div>
      </div>

      {/* ── HORIZONTAL CATEGORY ACTION CARDS ROW (7 Pill Cards) ─────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.Icon;
          return (
            <div
              key={cat.id}
              onClick={() => navigate(cat.path)}
              className="group cursor-pointer bg-[#EBF3FF] hover:bg-[#E0EEFF] border border-blue-100/80 rounded-[22px] p-4 sm:p-5 flex flex-col items-center justify-between text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-3 shadow-xs group-hover:scale-105 transition-transform">
                <Icon size={24} className="text-[#0066FF]" strokeWidth={2} />
              </div>
              <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-[#0066FF] transition-colors leading-tight">
                {cat.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── FEATURED SECTION ────────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Blue Left Vertical Accent Bar */}
            <div className="w-1.5 h-7 rounded-full bg-[#0066FF]" />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Featured
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/opportunities')}
              className="text-xs sm:text-sm font-bold text-[#0066FF] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Featured Showcase Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURED_ITEMS.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate('/opportunities')}
              className={`group cursor-pointer rounded-[24px] border p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden bg-gradient-to-b ${item.bgColor} ${item.borderColor} ${item.isDarkCard ? 'text-white' : 'text-slate-900'}`}
            >
              {/* Card Banner Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${item.isDarkCard ? 'bg-white/10 text-purple-200 border border-white/20' : 'bg-white/80 text-blue-700 border border-blue-100'}`}>
                    {item.tag}
                  </span>
                  <ShieldCheck size={18} className={item.isDarkCard ? 'text-emerald-400' : 'text-emerald-600'} />
                </div>

                <div className="pt-2">
                  <p className={`text-xs font-semibold ${item.isDarkCard ? 'text-purple-300' : 'text-slate-500'}`}>
                    {item.organizer}
                  </p>
                  <h3 className="font-extrabold text-lg leading-snug mt-1 group-hover:text-[#0066FF] transition-colors">
                    {item.title}
                  </h3>
                  <p className={`text-xs font-normal mt-1 leading-relaxed ${item.isDarkCard ? 'text-slate-300' : 'text-slate-600'}`}>
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Bottom Reward & CTA */}
              <div className="pt-6 border-t border-slate-200/40 dark:border-white/10 mt-6 flex items-center justify-between">
                <div>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${item.isDarkCard ? 'text-slate-400' : 'text-slate-400'}`}>
                    Reward / Prize
                  </p>
                  <p className={`text-xs font-extrabold ${item.isDarkCard ? 'text-amber-300' : 'text-slate-900'}`}>
                    {item.reward}
                  </p>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#0066FF] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;