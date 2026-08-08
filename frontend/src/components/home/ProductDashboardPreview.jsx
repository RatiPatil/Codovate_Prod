import { useState, useEffect, useRef } from 'react';
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
  TrendingUp,
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
        { y: 40, scale: 0.96, opacity: 0.9 },
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
      {/* Atmosphere Glow Concentration Behind Dashboard Top */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-[85%] h-[320px] rounded-full blur-[100px] pointer-events-none opacity-80"
        style={{
          background:
            'radial-gradient(circle, rgba(147, 51, 234, 0.18) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(255, 255, 255, 0) 75%)',
        }}
      />

      {/* Dashboard Preview Surface Card */}
      <div className="relative rounded-[32px] border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(79,70,229,0.08)] overflow-hidden">
        {/* Dashboard Interior Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
          {/* Left Sidebar */}
          <div className="md:col-span-3 bg-slate-50/70 p-5 border-r border-slate-200/70 space-y-6">
            {/* Logo */}
            <div className="px-2 py-1">
              <Logo size="xs" variant="light" />
            </div>

            {/* Sidebar Items */}
            <nav className="space-y-1.5">
              {sidebarNav.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      item.active
                        ? 'bg-slate-200/80 text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.active ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Main Dashboard Content */}
          <div className="md:col-span-9 p-6 md:p-8 space-y-6 bg-white relative">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400">Dashboard</span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-8 pr-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60 text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-36 sm:w-44"
                    readOnly
                  />
                </div>

                {/* Notifications */}
                <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-600">
                  <Bell className="w-4 h-4" />
                </div>

                {/* Live Dashboard Pill */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs font-bold text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Live Dashboard</span>
                </div>

                {/* Continue Learning CTA */}
                <button className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 transition-colors">
                  Continue Learning
                </button>
              </div>
            </div>

            {/* Dashboard Title */}
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Dashboard</h3>
              <p className="text-xs text-slate-400">An exciting exercise is waiting for you</p>
            </div>

            {/* Statistics Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Overall Rank */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-indigo-600" /> Overall Rank
                  </span>
                  <span className="text-slate-400">↗</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">1,341</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    +2.1% since last month
                  </span>
                </div>
              </div>

              {/* Overall Score */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-600" /> Overall Score
                  </span>
                  <span className="text-slate-400">↗</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">525</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    +2.1% since last month
                  </span>
                </div>
              </div>

              {/* Streak */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> Daily Streak
                  </span>
                  <span className="text-slate-400">↗</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">12 <span className="text-xs text-slate-400 font-sans font-normal">days</span></span>
                </div>
              </div>
            </div>

            {/* Rank & Score Progress Chart Bar */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Rank & Score Progress</h4>
                  <p className="text-xs text-slate-400">An exciting exercise is waiting for you</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                    Your Score
                  </span>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>This Month</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Simulated Progress Wave Graph */}
              <div className="h-28 w-full flex items-end justify-between gap-2 pt-4 px-2">
                {[35, 45, 60, 55, 75, 65, 80, 90, 85, 95, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-indigo-100 rounded-t-lg relative group h-full flex items-end">
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

        {/* 🤍 INTENSE MULTI-LAYERED WHITE FADE OVERLAYS */}
        {/* Layer 1: Deep Taller Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-64 sm:h-72 bg-gradient-to-b from-transparent via-white/85 to-[#FCFDFF] pointer-events-none rounded-b-[32px] z-10" />

        {/* Layer 2: Bottom-Right Corner Radial White Vignette Fade */}
        <div
          className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none z-20 rounded-br-[32px]"
          style={{
            background:
              'radial-gradient(circle at bottom right, rgba(252, 253, 255, 1) 0%, rgba(252, 253, 255, 0.95) 45%, rgba(252, 253, 255, 0.6) 70%, rgba(255, 255, 255, 0) 90%)',
          }}
        />

        {/* Layer 3: Bottom-Left Corner Radial White Vignette Fade */}
        <div
          className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none z-20 rounded-bl-[32px]"
          style={{
            background:
              'radial-gradient(circle at bottom left, rgba(252, 253, 255, 1) 0%, rgba(252, 253, 255, 0.95) 45%, rgba(252, 253, 255, 0.6) 70%, rgba(255, 255, 255, 0) 90%)',
          }}
        />
      </div>

      {/* Layer 4: Outer Bottom Transition Fade directly into the section below */}
      <div className="absolute -bottom-10 inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#FCFDFF]/90 to-[#FCFDFF] pointer-events-none z-30" />
    </div>
  );
};

export default ProductDashboardPreview;
