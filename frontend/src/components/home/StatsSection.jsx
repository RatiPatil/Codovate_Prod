import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, FolderCheck, BookOpenCheck, TrendingUp } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const StatsSection = () => {
  const sectionRef = useRef(null);

  const stats = [
    {
      id: 'stat-1',
      icon: Users,
      value: 50000,
      suffix: '+',
      label: 'Active Learners',
      desc: 'Coding daily on Codovate',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      id: 'stat-2',
      icon: FolderCheck,
      value: 120000,
      suffix: '+',
      label: 'Projects Built',
      desc: 'Shipped to live web apps',
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      id: 'stat-3',
      icon: BookOpenCheck,
      value: 350,
      suffix: '+',
      label: 'Learning Modules',
      desc: 'DSA, System Design & AI',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      id: 'stat-4',
      icon: TrendingUp,
      value: 98,
      suffix: '%',
      label: 'Career Placement Rate',
      desc: 'Within 6 months of completion',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Cards rise into position
      gsap.from('.stat-card', {
        y: 35,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });

      // Animated Number counters
      stats.forEach((s) => {
        const obj = { val: 0 };
        const el = document.getElementById(s.id);
        if (!el) return;

        gsap.to(obj, {
          val: s.value,
          duration: 2.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
          onUpdate: () => {
            el.innerText = Math.floor(obj.val).toLocaleString() + s.suffix;
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 md:py-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="stat-card p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${s.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                    Verified Metric
                  </span>
                </div>

                <div className="space-y-1">
                  <h3
                    id={s.id}
                    className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono"
                  >
                    0{s.suffix}
                  </h3>
                  <p className="text-sm font-bold text-slate-800">{s.label}</p>
                  <p className="text-xs text-slate-500">{s.desc}</p>
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
