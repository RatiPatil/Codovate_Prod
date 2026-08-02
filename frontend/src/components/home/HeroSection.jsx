import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Logo from '../common/Logo';
import { gsap } from 'gsap';

const HeroSection = () => {
  const heroRef = useRef(null);
  const logoRef = useRef(null);
  const badgeRef = useRef(null);
  const headlineRef = useRef(null);
  const subtextRef = useRef(null);
  const ctaRef = useRef(null);
  const trustRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(logoRef.current, { scale: 0.95, opacity: 0, y: -15 }, { scale: 1, opacity: 1, y: 0, duration: 0.7 })
        .fromTo(badgeRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.4')
        .fromTo(headlineRef.current, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3')
        .fromTo(subtextRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.3')
        .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.3')
        .fromTo(trustRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.2');
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative pt-12 sm:pt-16 pb-20 md:pb-28 bg-white overflow-hidden">
      {/* Extremely Subtle Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-100/30 via-indigo-50/20 to-purple-100/20 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
        
        {/* 1. Official Codovate Logo (Centered & Sharp) */}
        <div ref={logoRef} className="flex justify-center items-center pt-4">
          <Logo size="hero" variant="light" className="drop-shadow-xs" />
        </div>

        {/* 2. Small Premium Badge */}
        <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/60 text-blue-700 text-xs font-bold tracking-wide shadow-xs">
          <Sparkles size={14} className="text-blue-600 animate-pulse" />
          <span>Built for Students. Designed for Growth.</span>
        </div>

        {/* 3. Main Headline */}
        <h1 ref={headlineRef} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12] max-w-4xl mx-auto">
          Build Skills. Find Your Team. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Create Your Future.
          </span>
        </h1>

        {/* 4. Subtext */}
        <p ref={subtextRef} className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Codovate brings opportunities, collaboration, learning, and career tools together in one platform — helping students move from learning to real-world experience.
        </p>

        {/* 5. CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Get Started Free</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/opportunities"
            className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-base text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-center"
          >
            Explore Opportunities
          </Link>
        </div>

        {/* 6. Trust Indicators */}
        <div ref={trustRef} className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 pt-4">
          <span className="flex items-center gap-1.5 text-slate-700">
            <CheckCircle2 size={15} className="text-emerald-500" />
            Built for College Students
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <CheckCircle2 size={15} className="text-blue-500" />
            Simple to Start
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <CheckCircle2 size={15} className="text-purple-500" />
            Designed for Your Growth
          </span>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
