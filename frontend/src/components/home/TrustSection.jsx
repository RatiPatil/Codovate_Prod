import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle, Building2, GraduationCap, Award, ArrowUpRight, Sparkles } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const TrustSection = () => {
  const sectionRef = useRef(null);

  const highlights = [
    {
      title: 'Industry-Aligned Curriculum',
      desc: 'Created by senior tech leads from Tier-1 companies and updated weekly.',
    },
    {
      title: 'Real-World Production Projects',
      desc: 'Build full-stack applications with actual APIs, databases, and CI/CD pipelines.',
    },
    {
      title: 'Direct Placement Referral Network',
      desc: 'Get direct referral invites to hiring partners upon completing roadmap assessments.',
    },
    {
      title: '1-on-1 AI & Human Mentorship',
      desc: 'Instant 24/7 code debug help paired with weekly expert office hours.',
    },
  ];

  const placementCards = [
    {
      name: 'Aarav Sharma',
      role: 'SDE-1 at Amazon',
      package: '₹32 LPA',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      badge: 'Amazon',
      bgGradient: 'from-amber-500/10 to-orange-500/10 border-amber-200/80',
    },
    {
      name: 'Priya Patel',
      role: 'Frontend Engineer at Google',
      package: '₹38 LPA',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      badge: 'Google',
      bgGradient: 'from-blue-500/10 to-indigo-500/10 border-blue-200/80',
    },
    {
      name: 'Rohan Verma',
      role: 'Backend Dev at Microsoft',
      package: '₹34 LPA',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      badge: 'Microsoft',
      bgGradient: 'from-purple-500/10 to-indigo-500/10 border-purple-200/80',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Left side text reveal
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

      // Right side cards sequential reveal
      gsap.from('.trust-card', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.2,
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
              <span>Proven Outcomes</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Trusted by Learners.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Built for the Future.
              </span>
            </h2>

            <p className="text-slate-600 text-base leading-relaxed">
              Codovate bridges the gap between university theory and high-growth industry careers. Students build real products, prove their skills in automated assessments, and get hired.
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

          {/* Right Column: Animated Student Placement Cards */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Career Transformations
              </span>
              <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                View All Success Stories <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-4">
              {placementCards.map((card, i) => (
                <div
                  key={i}
                  className={`trust-card p-5 rounded-2xl bg-white/90 backdrop-blur-md border shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4 ${card.bgGradient}`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={card.avatar}
                      alt={card.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{card.name}</h4>
                      <p className="text-xs font-medium text-slate-600">{card.role}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                          {card.badge}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600">
                          Package: {card.package}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">Codovate Alum</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
