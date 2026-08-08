import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle, Award, ArrowUpRight, Sparkles, BookOpen, Code2, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const TrustSection = () => {
  const sectionRef = useRef(null);

  const highlights = [
    {
      title: 'Built for Ambitious Learners',
      desc: 'Designed specifically for computer science students seeking real engineering competence.',
    },
    {
      title: 'Learn with Structured Paths',
      desc: 'Step-by-step curriculum starting from core DSA to full-stack web and AI engineering.',
    },
    {
      title: 'Build Projects That Demonstrate Skills',
      desc: 'Ship production-ready codebases with databases, authentication, and deployment pipelines.',
    },
    {
      title: 'Prepare for Your Next Opportunity',
      desc: 'Integrated assessment tools, ATS resume analysis, and technical interview practice.',
    },
  ];

  const pillarCards = [
    {
      title: 'Structured Skill Acquisition',
      subtitle: 'From Fundamentals to Mastery',
      desc: 'Clear roadmap progression tracking your mastery across data structures, algorithms, and core CS subjects.',
      icon: BookOpen,
      badge: 'Learning Engine',
      bgGradient: 'from-blue-500/10 to-indigo-500/10 border-blue-200/80',
    },
    {
      title: 'Production Project Building',
      subtitle: 'Portfolio That Stands Out',
      desc: 'Collaborate in team workspaces to build microservices, AI applications, and full-stack software.',
      icon: Code2,
      badge: 'Project Hub',
      bgGradient: 'from-purple-500/10 to-indigo-500/10 border-purple-200/80',
    },
    {
      title: 'Placement & Career Readiness',
      subtitle: 'Classroom to Industry',
      desc: 'Comprehensive resume review, mock interviews, and skill assessments aligned with modern hiring standards.',
      icon: Compass,
      badge: 'Career Engine',
      bgGradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-200/80',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.trust-left-content', {
        x: -40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });

      gsap.from('.trust-pillar-card', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.18,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="trust-left-content lg:col-span-6 space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/70 text-purple-700 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Career Preparedness</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Built for Ambitious Learners.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Engineered for Outcomes.
              </span>
            </h2>

            <p className="text-slate-600 text-base leading-relaxed">
              Codovate bridges the gap between university theory and high-growth industry careers. Students build real products, prove their skills, and prepare for modern software roles.
            </p>

            <div className="space-y-4 pt-2">
              {highlights.map((h, index) => (
                <div key={index} className="flex items-start gap-3.5 group">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{h.title}</h4>
                    <p className="text-xs text-slate-500 leading-normal">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Platform Pillars */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Core Career Pillars
              </span>
              <Link to="/learning" className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline">
                Explore Curriculum <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {pillarCards.map((card, i) => {
                const IconComp = card.icon;
                return (
                  <div
                    key={i}
                    className={`trust-pillar-card p-5 rounded-2xl bg-white/90 backdrop-blur-md border shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4 ${card.bgGradient}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <IconComp className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{card.title}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700">
                            {card.badge}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-indigo-600 mt-0.5">{card.subtitle}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">{card.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
