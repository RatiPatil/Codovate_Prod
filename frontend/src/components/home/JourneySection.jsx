import { useEffect, useRef } from 'react';
import { UserCheck, Search, Users, BookOpen, FileText } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    num: '01',
    icon: UserCheck,
    title: 'Create Your Profile',
    desc: 'Set up your student profile with your college, degree, and skills.',
    color: 'from-blue-600 to-blue-700',
  },
  {
    num: '02',
    icon: Search,
    title: 'Explore Opportunities',
    desc: 'Browse internships and jobs tailored to your goals.',
    color: 'from-indigo-600 to-indigo-700',
  },
  {
    num: '03',
    icon: Users,
    title: 'Connect & Build Teams',
    desc: 'Find teammates with complementary skills for projects.',
    color: 'from-purple-600 to-purple-700',
  },
  {
    num: '04',
    icon: BookOpen,
    title: 'Learn & Build Skills',
    desc: 'Follow structured tracks and track your learning progress.',
    color: 'from-pink-600 to-pink-700',
  },
  {
    num: '05',
    icon: FileText,
    title: 'Build Resume & Grow',
    desc: 'Turn your profile and projects into an ATS-friendly resume.',
    color: 'from-emerald-600 to-emerald-700',
  },
];

const JourneySection = () => {
  const sectionRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate connecting line on scroll
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              end: 'bottom 60%',
              scrub: 0.5,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-slate-50/70 border-y border-slate-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
            SIMPLE PROCESS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
            Your Journey With Codovate
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            A step-by-step path from learning to landing real opportunities.
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          
          {/* Desktop Connecting Line */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-1 bg-slate-200 z-0">
            <div
              ref={lineRef}
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 origin-left"
            />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
            {steps.map((st, i) => (
              <div key={st.num} className="flex flex-col items-center text-center group">
                
                {/* Icon Circle */}
                <div className="w-24 h-24 rounded-full bg-white border-2 border-slate-200 group-hover:border-blue-500 shadow-md flex flex-col items-center justify-center relative transition-all duration-300 group-hover:-translate-y-1">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{st.num}</span>
                  <st.icon size={22} className="text-slate-800 group-hover:text-blue-600 transition-colors mt-0.5" />
                </div>

                {/* Content */}
                <div className="mt-5 space-y-1.5 max-w-xs">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {st.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default JourneySection;
