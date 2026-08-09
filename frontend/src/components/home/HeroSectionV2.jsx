import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldCheck, Star } from 'lucide-react';
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
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.2 }
      )
        .fromTo(
          title1Ref.current,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.4'
        )
        .fromTo(
          title2Ref.current,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.5'
        )
        .fromTo(
          descRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.4'
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 18 },
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
          { opacity: 0, y: 35, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power2.out' },
          '-=0.5'
        );

      gsap.to(textContentRef.current, {
        y: '-10%',
        opacity: 0.92,
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
          y: -18,
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
      className="relative pt-24 pb-8 md:pt-32 md:pb-12 flex flex-col justify-between items-center z-10 overflow-hidden"
    >
      {/* Hero Header Content */}
      <div
        ref={textContentRef}
        className="w-full max-w-4xl mx-auto px-4 text-center space-y-5 flex flex-col items-center relative z-10"
      >
        {/* Badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/90 dark:bg-[#151926]/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs backdrop-blur-md"
        >
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 tracking-wide">
            India's #1 Student Career Ecosystem
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-1">
          <h1
            ref={title1Ref}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]"
          >
            Get Your First Job
          </h1>
          <h1
            ref={title2Ref}
            className="text-4xl sm:text-6xl lg:text-7xl font-serif font-normal text-slate-900 dark:text-white tracking-tight leading-[1.1]"
          >
            with Codovate ONE
          </h1>
        </div>

        {/* Description */}
        <p
          ref={descRef}
          className="max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed text-balance"
        >
          Codovate ONE gives you a fully integrated path to placements – DSA, development, projects, contests, core CS subjects and interview prep in one system.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-wrap items-center justify-center gap-4 pt-1 relative z-20">
          <a
            href="#resources"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-white bg-slate-200/70 dark:bg-[#1E2330] hover:bg-slate-200 dark:hover:bg-[#252B3B] border border-slate-300/50 dark:border-slate-700/80 shadow-xs transition-all duration-200 hover:-translate-y-0.5"
          >
            <span>Free Resources</span>
          </a>

          <Link
            to="/signup"
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
          >
            <span>Codovate ONE</span>
          </Link>
        </div>

        {/* Proof */}
        <div
          ref={proofRef}
          className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-semibold"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Structured Path for Ambitious Learners</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200 ml-1">Built for Student Career Growth</span>
          </div>
        </div>
      </div>

      {/* Hero -> Dashboard Connection Container */}
      <div ref={dashboardWrapperRef} className="w-full pt-8 md:pt-10">
        <ProductDashboardPreview />
      </div>
    </section>
  );
};

export default HeroSectionV2;
