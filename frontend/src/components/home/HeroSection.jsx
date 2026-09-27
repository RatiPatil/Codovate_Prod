import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, Code2, Cpu, Users, Layers, FileCheck, Rocket } from 'lucide-react';
import Logo from '../common/Logo';
import { gsap } from 'gsap';

// Particle config — Desktop: 14, Mobile: 6
const generateParticles = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.floor(Math.random() * 3) + 2, // 2px to 4px
    left: `${Math.floor(Math.random() * 90) + 5}%`,
    top: `${Math.floor(Math.random() * 80) + 10}%`,
    color: i % 3 === 0 ? 'bg-blue-500/25' : i % 3 === 1 ? 'bg-indigo-500/25' : 'bg-purple-500/25',
    duration: Math.random() * 4 + 6,
    delay: Math.random() * 2,
  }));
};

const ambientNodes = [
  { icon: Code2, label: 'Full-Stack Dev', pos: 'top-[18%] left-[6%]', color: 'text-blue-600 bg-blue-50 border-blue-200', floatDir: -14 },
  { icon: Cpu, label: 'AI & ML', pos: 'top-[22%] right-[6%]', color: 'text-purple-600 bg-purple-50 border-purple-200', floatDir: 12 },
  { icon: Users, label: 'Team Matching', pos: 'top-[48%] left-[4%]', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', floatDir: -10 },
  { icon: Rocket, label: 'Hackathons', pos: 'top-[52%] right-[4%]', color: 'text-pink-600 bg-pink-50 border-pink-200', floatDir: 15 },
  { icon: FileCheck, label: 'ATS Resume', pos: 'bottom-[15%] left-[8%]', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', floatDir: -12 },
  { icon: Layers, label: 'Learning Tracks', pos: 'bottom-[15%] right-[8%]', color: 'text-violet-600 bg-violet-50 border-violet-200', floatDir: 10 },
];

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
  const cursorSpotlightRef = useRef(null);
  const gridLineRef = useRef(null);
  const particlesRef = useRef(null);
  const nodesRef = useRef([]);

  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setParticles(generateParticles(isMobile ? 6 : 14));
  }, []);

  // Track mouse for ambient spotlight glow
  const handleMouseMove = (e) => {
    if (!heroRef.current || !cursorSpotlightRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 250;
    const y = e.clientY - rect.top - 250;

    gsap.to(cursorSpotlightRef.current, {
      x,
      y,
      duration: 1.2,
      ease: 'power2.out',
    });
  };

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
          gsap.to(glow1Ref.current, { x: 20, y: 20, duration: 9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }
        if (glow2Ref.current) {
          gsap.to(glow2Ref.current, { x: -20, y: 15, duration: 11, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }
        if (glow3Ref.current) {
          gsap.to(glow3Ref.current, { x: 15, y: -15, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }

        // Grid light beam sweep
        if (gridLineRef.current) {
          gsap.to(gridLineRef.current, {
            x: '100%',
            duration: 8,
            repeat: -1,
            ease: 'sine.inOut',
          });
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

        // Ambient Constellation Skill Nodes Float
        nodesRef.current.forEach((node, idx) => {
          if (!node) return;
          gsap.fromTo(
            node,
            { opacity: 0, scale: 0.8 },
            { opacity: 0.85, scale: 1, duration: 1, delay: 0.6 + idx * 0.15 }
          );
          gsap.to(node, {
            y: ambientNodes[idx].floatDir,
            duration: 4.5 + idx,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, [particles]);

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative pt-12 sm:pt-16 pb-20 md:pb-28 bg-white overflow-hidden select-none"
    >
      
      {/* ─── Interactive Mouse Cursor Spotlight Glow ─── */}
      <div
        ref={cursorSpotlightRef}
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-300/15 via-indigo-300/10 to-purple-300/15 blur-3xl rounded-full pointer-events-none -z-10"
      />

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

      {/* ─── Animated Grid Scanning Light Beam ─── */}
      <div
        ref={gridLineRef}
        className="absolute top-0 bottom-0 left-0 w-48 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent -skew-x-12 pointer-events-none -z-10"
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

      {/* ─── Floating Constellation Tech Skill Nodes ─── */}
      {ambientNodes.map((node, i) => (
        <div
          key={i}
          ref={(el) => (nodesRef.current[i] = el)}
          className={`absolute ${node.pos} z-10 hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs text-xs font-bold text-slate-800 transition-all hover:scale-105 pointer-events-none cursor-default`}
        >
          <div className={`w-5 h-5 rounded-full ${node.color} flex items-center justify-center`}>
            <node.icon size={12} />
          </div>
          <span>{node.label}</span>
        </div>
      ))}

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
