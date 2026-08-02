import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Logo from '../common/Logo';
import { gsap } from 'gsap';

// Particle config — Desktop: 14, Mobile: 6
const generateParticles = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.floor(Math.random() * 3) + 2, // 2px to 4px
    left: `${Math.floor(Math.random() * 90) + 5}%`,
    top: `${Math.floor(Math.random() * 80) + 10}%`,
    color: i % 3 === 0 ? 'bg-blue-500/20' : i % 3 === 1 ? 'bg-indigo-500/20' : 'bg-purple-500/20',
    duration: Math.random() * 4 + 6, // 6s to 10s
    delay: Math.random() * 2,
    yOffset: Math.random() * 20 - 10,
    xOffset: Math.random() * 16 - 8,
  }));
};

const HeroSection = () => {
  const heroRef = useRef(null);
  const logoWrapperRef = useRef(null);
  const sweepRef = useRef(null);
  const badgeRef = useRef(null);
  const headlineRef = useRef(null);
  const subtextRef = useRef(null);
  const ctaRef = useRef(null);
  const trustRef = useRef(null);
  const glow1Ref = useRef(null);
  const glow2Ref = useRef(null);
  const glow3Ref = useRef(null);
  const particlesRef = useRef(null);

  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setParticles(generateParticles(isMobile ? 6 : 14));
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (!prefersReducedMotion) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // 1. Logo Reveal (opacity, scale 0.88 -> 1, blur 8px -> 0px)
        tl.fromTo(
          logoWrapperRef.current,
          { opacity: 0, scale: 0.88, y: 18, filter: 'blur(8px)' },
          { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.9 }
        )
        // One-time subtle light sweep across logo
        .fromTo(
          sweepRef.current,
          { x: '-100%', opacity: 0.8 },
          { x: '200%', opacity: 0, duration: 0.7, ease: 'power2.inOut' },
          '-=0.3'
        )
        // 2. Badge
        .fromTo(badgeRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2')
        // 3. Headline
        .fromTo(headlineRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.2')
        // 4. Subtext
        .fromTo(subtextRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2')
        // 5. CTA Buttons
        .fromTo(ctaRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2')
        // 6. Trust Indicators
        .fromTo(trustRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.1');

        // Ambient background glow slow drift
        if (glow1Ref.current) {
          gsap.to(glow1Ref.current, { x: 15, y: 15, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }
        if (glow2Ref.current) {
          gsap.to(glow2Ref.current, { x: -15, y: 12, duration: 12, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }
        if (glow3Ref.current) {
          gsap.to(glow3Ref.current, { x: 10, y: -10, duration: 11, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }

        // Particle organic floating drift
        if (particlesRef.current) {
          Array.from(particlesRef.current.children).forEach((el, idx) => {
            gsap.to(el, {
              y: idx % 2 === 0 ? -16 : 14,
              x: idx % 3 === 0 ? 10 : -8,
              duration: 6 + (idx % 4),
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              delay: (idx % 3) * 0.4,
            });
          });
        }
      }
    }, heroRef);

    return () => ctx.revert();
  }, [particles]);

  return (
    <section ref={heroRef} className="relative pt-12 sm:pt-16 pb-20 md:pb-28 bg-white overflow-hidden select-none">
      
      {/* ─── Ambient Subtle Radial Background Glows ─── */}
      <div
        ref={glow1Ref}
        className="absolute top-10 left-1/4 w-[500px] h-[300px] bg-gradient-to-tr from-blue-100/40 to-indigo-100/30 blur-3xl rounded-full pointer-events-none -z-10"
      />
      <div
        ref={glow2Ref}
        className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-gradient-to-tr from-purple-100/30 to-pink-100/20 blur-3xl rounded-full pointer-events-none -z-10"
      />
      <div
        ref={glow3Ref}
        className="absolute bottom-10 left-1/3 w-[600px] h-[250px] bg-gradient-to-tr from-indigo-50/40 to-blue-50/40 blur-3xl rounded-full pointer-events-none -z-10"
      />

      {/* ─── Faint Technology Dot Grid Pattern ─── */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none -z-10"
      />

      {/* ─── Minimal Particles Container ─── */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none -z-5 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className={`absolute rounded-full ${p.color} pointer-events-none`}
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: p.left,
              top: p.top,
            }}
          />
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7 relative z-10">
        
        {/* 1. Official Codovate Logo Reveal (Variant Light, Centered) */}
        <div className="flex justify-center items-center pt-2">
          <div ref={logoWrapperRef} className="relative inline-block overflow-hidden p-2 rounded-2xl">
            <Logo size="hero" variant="light" className="drop-shadow-xs relative z-10" />
            {/* One-time Light Sweep Overlay */}
            <div
              ref={sweepRef}
              className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-blue-400/25 to-transparent -skew-x-12 pointer-events-none"
            />
          </div>
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

        {/* 5. CTA Buttons with Premium Microinteractions */}
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
            className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-base text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:-translate-y-0.5 active:scale-98 transition-all text-center"
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
