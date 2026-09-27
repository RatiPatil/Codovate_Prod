import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  LayoutDashboard,
  BookOpen,
  Code2,
  Video,
  FileText,
  Compass,
  Trophy,
  Search,
  Bell,
  Sparkles,
  Flame,
  ChevronDown,
  Calendar,
  Layers,
  HelpCircle,
  Award,
} from 'lucide-react';
import Logo from '../common/Logo';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const ProductDashboardPreview = () => {
  const containerRef = useRef(null);

  const sidebarNav = [
    { name: 'Dashboard', icon: LayoutDashboard, active: true },
    { name: 'Learning Modules', icon: BookOpen },
    { name: 'DSA Preparation', icon: Code2 },
    { name: 'Interview Prep', icon: Video },
    { name: 'Core Subjects', icon: Layers },
    { name: 'Project Hub', icon: Compass },
    { name: 'ATS Resume', icon: FileText },
    { name: 'Mock Tests', icon: HelpCircle },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { y: 30, scale: 0.97, opacity: 0.9 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            end: 'top 35%',
            scrub: 0.8,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-6xl mx-auto px-4 relative z-20">


      {/* Dashboard Preview Surface Card */}
      <div className="relative rounded-[32px] border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#111522]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(79,70,229,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Dashboard Interior Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
          {/* Left Sidebar */}
          <div className="md:col-span-3 bg-slate-50/70 dark:bg-[#0B0D17]/80 p-5 border-r border-slate-200/70 dark:border-slate-800 space-y-6">
            <div className="px-2 py-1">
              <Logo size="xs" />
            </div>

            <nav className="space-y-1.5">
              {sidebarNav.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      item.active
                        ? 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Main Dashboard Content */}
          <div className="md:col-span-9 p-6 md:p-8 space-y-6 bg-white dark:bg-[#111522] relative">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400">Dashboard</span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-8 pr-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none w-36 sm:w-44"
                    readOnly
                  />
                </div>

                <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <Bell className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Live Dashboard</span>
                </div>

                <button className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors">
                  Continue Learning
                </button>
              </div>
            </div>

            {/* Dashboard Title */}
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Dashboard</h3>
              <p className="text-xs text-slate-400">An exciting exercise is waiting for you</p>
            </div>

            {/* Statistics Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Overall Rank
                  </span>
                  <span className="text-slate-400">↗</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">1,341</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">
                    +2.1% since last month
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Overall Score
                  </span>
                  <span className="text-slate-400">↗</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">525</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">
                    +2.1% since last month
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> Daily Streak
                  </span>
                  <span className="text-slate-400">↗</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">12 <span className="text-xs text-slate-400 font-sans font-normal">days</span></span>
                </div>
              </div>
            </div>

            {/* Rank & Score Progress */}
            <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Rank & Score Progress</h4>
                  <p className="text-xs text-slate-400">An exciting exercise is waiting for you</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
                    Your Score
                  </span>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>This Month</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Progress Wave Graph */}
              <div className="h-24 w-full flex items-end justify-between gap-2 pt-4 px-2">
                {[35, 45, 60, 55, 75, 65, 80, 90, 85, 95, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-indigo-100 dark:bg-indigo-950/50 rounded-t-lg relative group h-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* WHITE/DARK FADE OVERLAYS */}
        <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-b from-transparent via-white/85 dark:via-[#080A12]/85 to-[#FCFDFF] dark:to-[#080A12] pointer-events-none rounded-b-[32px] z-10" />
      </div>

      <div className="absolute -bottom-8 inset-x-0 h-32 bg-gradient-to-b from-transparent via-[#FCFDFF]/90 dark:via-[#080A12]/90 to-[#FCFDFF] dark:to-[#080A12] pointer-events-none z-30" />
    </div>
  );
};

export default ProductDashboardPreview;
