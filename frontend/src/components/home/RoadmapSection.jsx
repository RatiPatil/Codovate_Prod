import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  UserPlus,
  UserCheck,
  Compass,
  BookOpen,
  FolderGit2,
  FileText,
  Send,
  Video,
  Trophy,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const RoadmapSection = () => {
  const sectionRef = useRef(null);

  const steps = [
    { title: 'Join Platform', desc: 'Set up your free student account', icon: UserPlus, color: 'border-blue-200 text-blue-600 bg-blue-50' },
    { title: 'Build Profile', desc: 'Input target roles & skill levels', icon: UserCheck, color: 'border-indigo-200 text-indigo-600 bg-indigo-50' },
    { title: 'AI Roadmap', desc: 'AI generates custom daily path', icon: Compass, color: 'border-purple-200 text-purple-600 bg-purple-50' },
    { title: 'Learn & Practice', desc: 'Interactive DSA & Core CS modules', icon: BookOpen, color: 'border-purple-200 text-purple-600 bg-purple-50' },
    { title: 'Build Projects', desc: 'Ship production-ready web apps', icon: FolderGit2, color: 'border-rose-200 text-rose-600 bg-rose-50' },
    { title: 'Resume & Portfolio', desc: 'Generate 90+ ATS verified resume', icon: FileText, color: 'border-amber-200 text-amber-600 bg-amber-50' },
    { title: 'Apply to Drives', desc: 'Direct referral match to top firms', icon: Send, color: 'border-sky-200 text-sky-600 bg-sky-50' },
    { title: 'AI Mock Interview', desc: 'Voice & code technical interview', icon: Video, color: 'border-indigo-200 text-indigo-600 bg-indigo-50' },
    { title: 'Get Hired', desc: 'Secure high-paying SDE placements', icon: Trophy, color: 'border-emerald-200 text-emerald-600 bg-emerald-50' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Step nodes reveal on scroll
      gsap.from('.roadmap-step-card', {
        scale: 0.85,
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });

      // Connecting line progress fill
      gsap.fromTo(
        '.roadmap-line-progress',
        { height: '0%' },
        {
          height: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
            end: 'bottom 40%',
            scrub: 1,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="roadmap" ref={sectionRef} className="py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Step-By-Step Journey</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Your Automated Career Path.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
              Classroom to Offer.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            A clear, 9-stage progression engineered to ensure you never get stuck or wonder what to study next.
          </p>
        </div>

        {/* Roadmap Steps Grid */}
        <div className="relative max-w-5xl mx-auto">
          {/* Vertical Connecting Line (Desktop) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-8 bottom-8 w-1 bg-slate-200 hidden md:block rounded-full overflow-hidden">
            <div className="roadmap-line-progress w-full bg-gradient-to-b from-blue-500 via-indigo-600 to-emerald-500 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-y-12 relative z-10">
            {steps.map((step, idx) => {
              const IconComp = step.icon;
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={idx}
                  className={`roadmap-step-card flex items-center gap-4 p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 ${
                    isEven ? 'md:mr-8 md:text-right md:flex-row-reverse' : 'md:ml-8'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${step.color}`}>
                    <IconComp className="w-6 h-6" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 md:justify-end">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        Stage {idx + 1}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                    <p className="text-xs text-slate-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
