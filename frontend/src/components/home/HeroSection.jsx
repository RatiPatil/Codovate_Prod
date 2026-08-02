import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Briefcase, Users, BookOpen, CheckCircle2, TrendingUp, Search } from 'lucide-react';
import { gsap } from 'gsap';

const HeroSection = () => {
  const heroRef = useRef(null);
  const badgeRef = useRef(null);
  const headlineRef = useRef(null);
  const subtextRef = useRef(null);
  const ctaRef = useRef(null);
  const trustRef = useRef(null);
  const previewRef = useRef(null);
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const card3Ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(badgeRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .fromTo(headlineRef.current, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.4')
        .fromTo(subtextRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
        .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
        .fromTo(trustRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.3')
        .fromTo(previewRef.current, { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8 }, '-=0.8');

      // Subtle continuous floating motion for mini-cards
      if (card1Ref.current) {
        gsap.to(card1Ref.current, {
          y: -8,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
      if (card2Ref.current) {
        gsap.to(card2Ref.current, {
          y: -10,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.5,
        });
      }
      if (card3Ref.current) {
        gsap.to(card3Ref.current, {
          y: -7,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 1,
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-white overflow-hidden">
      {/* Background Soft Radial Depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-100/40 via-indigo-100/30 to-purple-100/30 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-purple-50/60 blur-2xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Small Premium Badge */}
            <div ref={badgeRef} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/60 text-blue-700 text-xs font-semibold shadow-xs">
              <Sparkles size={14} className="text-blue-600 animate-pulse" />
              <span>Built for Students. Designed for Growth.</span>
            </div>

            {/* Headline */}
            <h1 ref={headlineRef} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12]">
              Build Skills. <br />
              Find Your Team. <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Create Your Future.
              </span>
            </h1>

            {/* Subtext */}
            <p ref={subtextRef} className="text-lg text-slate-600 max-w-2xl leading-relaxed">
              Codovate brings opportunities, collaboration, learning, and career tools together in one platform — helping students move from learning to real-world experience.
            </p>

            {/* CTA Buttons */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                to="/signup"
                className="px-7 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-center gap-2 group"
              >
                Get Started Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/opportunities"
                className="px-6 py-3.5 rounded-xl font-semibold text-base text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-center"
              >
                Explore Opportunities
              </Link>
            </div>

            {/* Trust Footer */}
            <p ref={trustRef} className="text-xs font-medium text-slate-500 pt-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>Built for college students • Simple to start • Designed for growth</span>
            </p>
          </div>

          {/* Right Column: Product Preview Composition */}
          <div className="lg:col-span-5 relative">
            <div ref={previewRef} className="relative z-10 bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-200/60 p-6 md:p-7 space-y-5">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                    CP
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Your Career Workspace</h3>
                    <p className="text-xs text-slate-500">Student Profile & Activity</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Active
                </span>
              </div>

              {/* Progress Summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Profile Completion</span>
                  <span className="text-blue-600">80%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-[80%]" />
                </div>
              </div>

              {/* Workspace Modules Row */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs text-center space-y-1">
                  <Briefcase size={16} className="mx-auto text-blue-600" />
                  <p className="text-[11px] font-bold text-slate-800">Applications</p>
                  <p className="text-xs text-slate-500 font-medium">3 Active</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs text-center space-y-1">
                  <Users size={16} className="mx-auto text-indigo-600" />
                  <p className="text-[11px] font-bold text-slate-800">Teams</p>
                  <p className="text-xs text-slate-500 font-medium">1 Joined</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs text-center space-y-1">
                  <BookOpen size={16} className="mx-auto text-purple-600" />
                  <p className="text-[11px] font-bold text-slate-800">Learning</p>
                  <p className="text-xs text-slate-500 font-medium">2 Courses</p>
                </div>
              </div>
            </div>

            {/* Floating Mini Card 1: Opportunity Found */}
            <div
              ref={card1Ref}
              className="absolute -top-6 -left-6 z-20 hidden sm:flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xl shadow-slate-200/80 text-xs font-semibold text-slate-800"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Briefcase size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Opportunity Found</p>
                <p className="text-xs font-bold text-slate-900">Software Developer Intern</p>
              </div>
            </div>

            {/* Floating Mini Card 2: Team Match */}
            <div
              ref={card2Ref}
              className="absolute -bottom-6 -right-6 z-20 hidden sm:flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xl shadow-slate-200/80 text-xs font-semibold text-slate-800"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Team Match</p>
                <p className="text-xs font-bold text-slate-900">3 students match your skills</p>
              </div>
            </div>

            {/* Floating Mini Card 3: Learning Progress */}
            <div
              ref={card3Ref}
              className="absolute top-1/2 -right-8 z-20 hidden lg:flex items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-lg shadow-slate-200/70 text-xs font-semibold text-slate-800"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp size={14} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Learning Progress</p>
                <p className="text-xs font-bold text-emerald-600">Continue Learning →</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
