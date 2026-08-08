import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, ArrowRight, Play, ShieldCheck, Star } from 'lucide-react';
import ProductDashboardPreview from './ProductDashboardPreview';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const HeroSectionV2 = () => {
  const heroRef = useRef(null);
  const textContentRef = useRef(null);
  const dashboardWrapperRef = useRef(null);
  const badgeRef = useRef(null);
  const title1Ref = useRef(null);
  const title2Ref = useRef(null);
  const descRef = useRef(null);
  const ctaRef = useRef(null);
  const proofRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial Staggered Entrance Animation
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.2 }
      )
        .fromTo(
          title1Ref.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.4'
        )
        .fromTo(
          title2Ref.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.5'
        )
        .fromTo(
          descRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.4'
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.4'
        )
        .fromTo(
          proofRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5 },
          '-=0.3'
        )
        .fromTo(
          dashboardWrapperRef.current,
          { opacity: 0, y: 40, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power2.out' },
          '-=0.5'
        );

      // 2. Scroll-linked Parallax & Scale Connection
      gsap.to(textContentRef.current, {
        y: '-15%',
        opacity: 0.85,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.fromTo(
        dashboardWrapperRef.current,
        { scale: 0.96, y: 0 },
        {
          scale: 1,
          y: -20,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[90vh] lg:min-h-screen pt-28 pb-16 md:pt-36 md:pb-24 flex flex-col justify-between items-center z-10"
    >
      {/* Hero Header Content */}
      <div
        ref={textContentRef}
        className="w-full max-w-5xl mx-auto px-4 text-center space-y-6 flex flex-col items-center"
      >
        {/* Small Badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/80 shadow-xs backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-semibold text-indigo-700 tracking-wide uppercase">
            ✦ Next-Gen AI Learning & Career Ecosystem
          </span>
        </div>

        {/* Large Headline */}
        <div className="space-y-1">
          <h1
            ref={title1Ref}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]"
          >
            Build Skills. Build Projects.
          </h1>
          <h1
            ref={title2Ref}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"
          >
            Build Your Career.
          </h1>
        </div>

        {/* Supporting Description */}
        <p
          ref={descRef}
          className="max-w-2xl text-base sm:text-lg text-slate-600 font-normal leading-relaxed text-balance"
        >
          Codovate unites AI-guided roadmaps, interactive coding, production project hub, and direct mentor guidance in ONE continuous career workspace.
        </p>

        {/* Primary & Secondary CTAs */}
        <div ref={ctaRef} className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/signup"
            className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#features"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-slate-700 bg-white/80 hover:bg-white border border-slate-200/90 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
            <span>Explore Platform</span>
          </a>
        </div>

        {/* Quick Trust Badges */}
        <div
          ref={proofRef}
          className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>No Credit Card Required</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
            <span className="font-semibold text-slate-700 ml-1">4.9/5</span>
            <span>(50,000+ Students)</span>
          </div>
        </div>
      </div>

      {/* Hero -> Dashboard Connection Container */}
      <div ref={dashboardWrapperRef} className="w-full pt-12 md:pt-16">
        <ProductDashboardPreview />
      </div>
    </section>
  );
};

export default HeroSectionV2;
