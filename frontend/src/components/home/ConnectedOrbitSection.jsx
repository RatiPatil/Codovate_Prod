import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Cpu, Bot, FolderGit2, BookOpen, FileText, Video, Award, Network } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const ConnectedOrbitSection = () => {
  const sectionRef = useRef(null);

  const ecosystemNodes = [
    { name: 'AI Career Roadmap', icon: Bot, desc: 'Tailored 1-on-1 skill trajectory' },
    { name: 'Project Workspace', icon: FolderGit2, desc: 'Real-time team collaboration' },
    { name: 'Smart Curriculum', icon: BookOpen, desc: 'DSA & Core CS mastery' },
    { name: 'ATS Resume Review', icon: FileText, desc: 'Automated formatting & score' },
    { name: 'Mock AI Interview', icon: Video, desc: 'Real-time feedback & scoring' },
    { name: 'Skill Verification', icon: Award, desc: 'Verifiable credentials' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.eco-node-card', {
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="orbit-core" className="py-14 sm:py-16 md:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
            <Network className="w-3.5 h-3.5" />
            <span>Unified Platform Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            One Connected Ecosystem for Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400">
              Entire Career Journey.
            </span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base">
            No more fragmented tools. Codovate connects learning, project building, coding practice, and career opportunities into one intelligent system.
          </p>
        </div>

        {/* Central Core & Orbit Network Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Central AI Hub Banner (Spans full width on top) */}
          <div className="md:col-span-3 p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-md">
                <Cpu className="w-3.5 h-3.5 text-amber-300" />
                <span>Central Codovate Core Engine</span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight">AI-Powered Performance Synchronization</h3>
              <p className="text-indigo-100 text-xs sm:text-sm">
                Every problem you solve, project you ship, and mock interview you complete continuously updates your career readiness score.
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-center w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <Cpu className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>

          {/* 6 Connected Orbit Nodes */}
          {ecosystemNodes.map((n, i) => {
            const Icon = n.icon;
            return (
              <div
                key={i}
                className="eco-node-card p-6 rounded-3xl bg-white/90 dark:bg-[#111522]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 space-y-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{n.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ConnectedOrbitSection;
