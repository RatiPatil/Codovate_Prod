import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Compass, CheckCircle2, Circle } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const RoadmapSection = () => {
  const sectionRef = useRef(null);

  const steps = [
    { num: '01', title: 'Join Codovate Platform', desc: 'Create your account and set up your student developer profile.' },
    { num: '02', title: 'Diagnostic Skill Assessment', desc: 'Take quick baseline quizzes to identify strengths and skill gaps.' },
    { num: '03', title: 'AI Career Roadmap Generation', desc: 'Receive your personalized step-by-step learning trajectory.' },
    { num: '04', title: 'Master Core CS & DSA', desc: 'Solve curated problems with automated real-time code evaluation.' },
    { num: '05', title: 'Build Production Projects', desc: 'Construct full-stack applications with databases and API security.' },
    { num: '06', title: 'ATS Resume Optimization', desc: 'Format your achievements for ATS algorithms and top tech recruiters.' },
    { num: '07', title: 'Apply to Curated Opportunities', desc: 'Access exclusive campus and off-campus tech job listings.' },
    { num: '08', title: 'Mock AI Technical Interviews', desc: 'Practice system design and live coding rounds with real-time feedback.' },
    { num: '09', title: 'Get Hired & Launch Career', desc: 'Land your dream software role and join our alum network.' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.roadmap-step-card', {
        y: 25,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="roadmap" className="py-14 sm:py-16 md:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Clear Progression</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Your Step-by-Step{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400">
              Career Journey.
            </span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base">
            From your first day on Codovate to landing your software engineering offer, every milestone is structured for success.
          </p>
        </div>

        {/* 9 Step Progression Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((s, i) => (
            <div
              key={i}
              className="roadmap-step-card p-6 rounded-3xl bg-white/90 dark:bg-[#111522]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                  {s.num}
                </span>
                <CheckCircle2 className="w-5 h-5 text-indigo-500/80" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
