import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  FolderGit2,
  Code2,
  FileText,
  Briefcase,
  Video,
  Sparkles,
  Search,
  Bell,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  User,
  Zap,
} from 'lucide-react';
import Logo from '../common/Logo';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const ProductDashboardPreview = () => {
  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const sidebarNav = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Learning', icon: BookOpen },
    { name: 'Roadmap', icon: Compass },
    { name: 'Projects', icon: FolderGit2 },
    { name: 'Coding Practice', icon: Code2 },
    { name: 'Resume', icon: FileText },
    { name: 'Opportunities', icon: Briefcase },
    { name: 'Interviews', icon: Video },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { y: 50, scale: 0.95, opacity: 0.9 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 1,
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
      {/* Subtle Purple Atmospheric Glow Behind Dashboard */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-indigo-500/10 rounded-[36px] blur-2xl pointer-events-none" />

      {/* Main Dashboard Window Container */}
      <div className="relative rounded-[28px] border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_25px_70px_rgba(79,70,229,0.12)] overflow-hidden">
        {/* Top Window Bar */}
        <div className="bg-slate-100/90 px-5 py-3 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
              https://codovate.com/dashboard/overview
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-bold text-slate-600">AI Career Engine Synchronized</span>
          </div>
        </div>

        {/* Dashboard Content Grid: Sidebar + Main Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
          {/* Sidebar Navigation */}
          <div className="md:col-span-3 bg-slate-900 text-slate-300 p-4 border-r border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="px-2 py-1">
                <Logo size="sm" variant="dark" />
              </div>

              <nav className="space-y-1">
                {sidebarNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => setActiveTab(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar User Profile Card */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                AS
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-bold text-white truncate">Aarav Sharma</p>
                <p className="text-[10px] text-indigo-300">Tier 1 Target • 94% Match</p>
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="md:col-span-9 p-6 md:p-8 space-y-6 bg-slate-50/50">
            {/* Header: Welcome Back */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back, Aarav 👋
                </h3>
                <p className="text-xs text-slate-500">
                  Your AI Career Engine updated 3 new recommended tasks for today.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search modules..."
                    className="pl-8 pr-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-36 sm:w-48"
                    readOnly
                  />
                </div>
                <div className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 relative">
                  <Bell className="w-4 h-4" />
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1" />
                </div>
              </div>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Learning Progress</span>
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900">88%</span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> +12% this week
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full w-[88%]" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Career Readiness Score</span>
                  <Compass className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900">94 / 100</span>
                  <span className="text-[11px] font-bold text-purple-600">Top 3%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full w-[94%]" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Project Verification</span>
                  <FolderGit2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900">4 Verified</span>
                  <span className="text-[11px] font-bold text-slate-500">Full-Stack RAG</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[100%]" />
                </div>
              </div>
            </div>

            {/* Middle Section: Career Roadmap & Recommended Modules */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 cols: Career Roadmap Progress */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-bold text-slate-900">Active Target: Full-Stack AI Engineer</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                    Step 4 of 6
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Advanced Graph Algorithms</p>
                        <p className="text-[10px] text-slate-500">Dijkstra, Topological Sort & MST</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600">Completed</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/80">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-indigo-600 animate-pulse shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">System Design: Distributed Cache</p>
                        <p className="text-[10px] text-indigo-600 font-semibold">Current Focus Task</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-full">
                      Continue
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 opacity-60">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Vector Search & RAG Pipelines</p>
                        <p className="text-[10px] text-slate-500">Pinecone & Embeddings</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">Next Up</span>
                  </div>
                </div>
              </div>

              {/* Right 5 cols: Recommended Learning & Opportunities */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Upcoming Opportunity
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-bold">Amazon SDE-1 Placement Drive</h4>
                  <p className="text-xs text-slate-300">
                    Your readiness score qualifies for direct referral match.
                  </p>
                  <button className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-xs font-bold hover:brightness-110 transition-all">
                    Apply via Codovate Referral
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDashboardPreview;
