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
  const particlesRef = useRef(null);

  // Generate 20 sparkling particle coordinates around the purple glow center
  const particles = [
    { top: '35%', left: '48%', size: 'w-1 h-1', delay: '0s', duration: '3.2s' },
    { top: '42%', left: '42%', size: 'w-1.5 h-1.5', delay: '0.4s', duration: '4.1s' },
    { top: '50%', left: '55%', size: 'w-1 h-1', delay: '0.8s', duration: '3.5s' },
    { top: '58%', left: '45%', size: 'w-1.5 h-1.5', delay: '1.2s', duration: '4.5s' },
    { top: '38%', left: '58%', size: 'w-1 h-1', delay: '1.6s', duration: '3.8s' },
    { top: '46%', left: '38%', size: 'w-2 h-2', delay: '0.2s', duration: '4.2s' },
    { top: '54%', left: '62%', size: 'w-1 h-1', delay: '0.9s', duration: '3.6s' },
    { top: '62%', left: '50%', size: 'w-1.5 h-1.5', delay: '1.4s', duration: '4.0s' },
    { top: '40%', left: '52%', size: 'w-1 h-1', delay: '0.5s', duration: '3.9s' },
    { top: '48%', left: '47%', size: 'w-1.5 h-1.5', delay: '1.1s', duration: '4.4s' },
    { top: '56%', left: '54%', size: 'w-1 h-1', delay: '0.7s', duration: '3.3s' },
    { top: '64%', left: '44%', size: 'w-1.5 h-1.5', delay: '1.5s', duration: '4.6s' },
    { top: '36%', left: '40%', size: 'w-1 h-1', delay: '1.0s', duration: '3.7s' },
    { top: '44%', left: '60%', size: 'w-1.5 h-1.5', delay: '0.3s', duration: '4.3s' },
    { top: '52%', left: '36%', size: 'w-1 h-1', delay: '1.3s', duration: '3.4s' },
    { top: '60%', left: '58%', size: 'w-2 h-2', delay: '0.6s', duration: '4.1s' },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial Staggered Entrance Animation
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

      // 2. Continuous Particle Drifting
      gsap.utils.toArray('.hero-sparkle-dot').forEach((dot, i) => {
        gsap.to(dot, {
          y: '-=25',
          x: i % 2 === 0 ? '+=12' : '-=12',
          opacity: i % 3 === 0 ? 0.9 : 0.4,
          scale: i % 2 === 0 ? 1.4 : 0.8,
          duration: 3 + (i % 3),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.15,
        });
      });

      // 3. Scroll-linked Parallax & Scale Connection
      gsap.to(textContentRef.current, {
        y: '-12%',
        opacity: 0.88,
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
      className="relative min-h-[90vh] lg:min-h-screen pt-28 pb-16 md:pt-36 md:pb-24 flex flex-col justify-between items-center z-10 overflow-hidden"
    >
      {/* 🔮 CONCENTRATED PURPLE ATMOSPHERIC GLOW (Positioned directly behind CTA buttons) */}
      <div
        className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[380px] rounded-full blur-[110px] pointer-events-none opacity-90 z-0"
        style={{
          background:
            'radial-gradient(circle, rgba(147, 51, 234, 0.28) 0%, rgba(124, 58, 237, 0.18) 45%, rgba(99, 102, 241, 0.08) 70%, rgba(255, 255, 255, 0) 85%)',
        }}
      />

      {/* ✨ SMALL SPARKLING FLOATING PARTICLES INSIDE PURPLE GLOW ZONE */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none z-0">
        {particles.map((p, i) => (
          <div
            key={i}
            className={`hero-sparkle-dot absolute rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] opacity-70 ${p.size}`}
            style={{ top: p.top, left: p.left }}
          />
        ))}
      </div>

      {/* Hero Header Content */}
      <div
        ref={textContentRef}
        className="w-full max-w-4xl mx-auto px-4 text-center space-y-6 flex flex-col items-center relative z-10"
      >
        {/* Small Rounded Badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/80 shadow-xs backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-bold text-indigo-700 tracking-wide uppercase">
            India's Student Career Ecosystem
          </span>
        </div>

        {/* Large Headline */}
        <div className="space-y-1">
          <h1
            ref={title1Ref}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]"
          >
            Learn. Build. Compete.
          </h1>
          <h1
            ref={title2Ref}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"
          >
            Get Hired with Codovate.
          </h1>
        </div>

        {/* Narrow Supporting Description */}
        <p
          ref={descRef}
          className="max-w-2xl text-base sm:text-lg text-slate-600 font-normal leading-relaxed text-balance"
        >
          Codovate brings learning, projects, coding practice, career guidance, and opportunities together in one platform to help students turn skills into real careers.
        </p>

        {/* Primary & Secondary CTAs */}
        <div ref={ctaRef} className="flex flex-wrap items-center justify-center gap-4 pt-2 relative z-20">
          <Link
            to="/signup"
            className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#resources"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-slate-700 bg-white/80 hover:bg-white border border-slate-200/90 shadow-xs transition-all duration-300 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
            <span>Explore Resources</span>
          </a>
        </div>

        {/* Trust Statements (Honest non-numerical claims) */}
        <div
          ref={proofRef}
          className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-semibold"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Structured Path for Ambitious Learners</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
            <span className="font-bold text-slate-700 ml-1">Built for Student Career Growth</span>
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
