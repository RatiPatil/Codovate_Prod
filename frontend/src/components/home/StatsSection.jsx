import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Target, Trophy, Flame, Code2 } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const StatsSection = () => {
  const sectionRef = useRef(null);

  const stats = [
    { label: 'Structured Skill Modules', val: 120, suffix: '+', icon: Code2, color: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Production Projects', val: 45, suffix: '+', icon: Target, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Skill Assessments', val: 85, suffix: '+', icon: Trophy, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Daily Coding Streak', val: 365, suffix: ' Days', icon: Flame, color: 'text-amber-500' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stat-card-item', {
        y: 25,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-10 sm:py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="stat-card-item p-6 rounded-3xl bg-white/90 dark:bg-[#111522]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-300 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    Active
                  </span>
                </div>

                <div>
                  <div className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                    {s.val}
                    <span className="text-indigo-600 dark:text-indigo-400">{s.suffix}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
