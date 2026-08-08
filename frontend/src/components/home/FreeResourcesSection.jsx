import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen, Download, FileText, Code2, ArrowUpRight, Sparkles } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const FreeResourcesSection = () => {
  const sectionRef = useRef(null);

  const resources = [
    { title: 'Top 100 DSA Patterns Cheat Sheet', desc: 'Quick reference guide for Sliding Window, Two Pointers, Graphs, and DP.', type: 'PDF Guide', icon: FileText },
    { title: 'System Design Basics Blueprint', desc: 'Architecture diagrams for caching, load balancing, and database sharding.', type: 'Architectural Map', icon: Code2 },
    { title: 'ATS Resume Master Template', desc: 'LaTeX and Word formats engineered to pass tech company recruiter screening.', type: 'Template', icon: Download },
    { title: 'Behavioral Interview Playbook', desc: 'STAR framework examples for tech lead and hiring manager interviews.', type: 'Interview Prep', icon: BookOpen },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.resource-card-item', {
        y: 25,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="resources" className="py-14 sm:py-16 md:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Access Library</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Free Developer Resources.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 dark:from-emerald-400 dark:via-teal-400 dark:to-indigo-400">
              Zero Paywalls.
            </span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base">
            Essential study materials, blueprints, and templates open to all ambitious learners.
          </p>
        </div>

        {/* 4 Open Access Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className="resource-card-item p-6 rounded-3xl bg-white/90 dark:bg-[#111522]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {r.type}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {r.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{r.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Download Free</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FreeResourcesSection;
