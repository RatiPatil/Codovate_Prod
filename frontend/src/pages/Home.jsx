import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: '🚀',
    title: 'Structured Roadmaps',
    desc: "Don't know what to learn? We provide step-by-step personalized roadmaps for your branch and goals.",
  },
  {
    icon: '🎯',
    title: 'Opportunity Hub',
    desc: 'Never miss another elite hackathon, competition, or exclusive internship again.',
  },
  {
    icon: '🧠',
    title: 'Expert Mentorship',
    desc: 'Get guidance from industry experts and alumni, regardless of your college.',
  },
  {
    icon: '🤝',
    title: 'Team Builder',
    desc: 'Find the perfect, skilled teammates for your next big project or hackathon.',
  },
];

const Home = () => {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const bgRef = useRef(null);
  const ctaBtnRef = useRef(null);
  const scrollTextRef = useRef(null);
  const horizontalSectionRef = useRef(null);
  const cardsWrapperRef = useRef(null);

  useEffect(() => {
    // 1. Initial Hero Load Animation
    const tl = gsap.timeline();
    
    // Background glow fade in
    tl.fromTo(bgRef.current,
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 2, ease: 'power3.out' }
    );

    // Title words stagger
    if (titleRef.current) {
      const words = titleRef.current.querySelectorAll('.word');
      tl.fromTo(words,
        { y: 100, opacity: 0, rotateX: -90 },
        { y: 0, opacity: 1, rotateX: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' },
        '-=1.5'
      );
    }

    // Fade in CTA and bottom elements
    tl.fromTo('.hero-fade-up',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power2.out' },
      '-=0.8'
    );

    // 2. Parallax mouse tracking for Hero
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 60;
      const yPos = (clientY / window.innerHeight - 0.5) * 60;

      gsap.to(bgRef.current, {
        x: xPos,
        y: yPos,
        duration: 1.5,
        ease: 'power2.out',
      });
      gsap.to(titleRef.current, {
        x: xPos * -0.5,
        y: yPos * -0.5,
        duration: 1.5,
        ease: 'power2.out',
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 3. Magnetic Button Effect
    const magneticBtn = ctaBtnRef.current;
    const handleMagneticMove = (e) => {
      const rect = magneticBtn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(magneticBtn, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.4,
        ease: 'power2.out',
      });
    };
    const handleMagneticLeave = () => {
      gsap.to(magneticBtn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
    };
    if (magneticBtn) {
      magneticBtn.addEventListener('mousemove', handleMagneticMove);
      magneticBtn.addEventListener('mouseleave', handleMagneticLeave);
    }

    // 4. Scroll-Triggered Text Highlight
    if (scrollTextRef.current) {
      const textWords = scrollTextRef.current.querySelectorAll('.scroll-word');
      gsap.fromTo(textWords,
        { opacity: 0.2 },
        {
          opacity: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: scrollTextRef.current,
            start: 'top 80%',
            end: 'bottom 40%',
            scrub: true,
          }
        }
      );
    }

    // 5. 3D Card Reveal Animation
    if (cardsWrapperRef.current && horizontalSectionRef.current) {
      const cards = cardsWrapperRef.current.querySelectorAll('.h-card');
      gsap.fromTo(cards,
        { y: 100, opacity: 0, rotationX: -40, rotationY: 10, z: -200 },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          rotationY: 0,
          z: 0,
          duration: 1.2,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: horizontalSectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (magneticBtn) {
        magneticBtn.removeEventListener('mousemove', handleMagneticMove);
        magneticBtn.removeEventListener('mouseleave', handleMagneticLeave);
      }
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white selection:bg-primary/30">
      
      {/* Absolute Logo (No Navbar) */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50 flex items-center gap-2 md:gap-3">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-[0_0_20px_rgba(32,21,255,0.4)]">C</div>
        <span className="text-white font-bold text-lg md:text-xl tracking-tight">Codovate</span>
      </div>

      <div className="absolute top-7 right-6 md:top-10 md:right-8 z-50 flex items-center gap-4 md:gap-6">
        <Link to="/login" className="text-[10px] md:text-xs font-bold text-white hover:text-primary transition-colors uppercase tracking-widest">
          Sign In
        </Link>
        <Link to="/signup" className="text-[10px] md:text-xs font-bold text-black bg-white hover:bg-gray-200 px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-colors uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          Sign Up
        </Link>
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        
        {/* Cinematic Background Glow */}
        <div ref={bgRef} className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
          <div className="w-[150vw] h-[150vw] md:w-[800px] md:h-[800px] bg-primary/20 rounded-full blur-[100px] md:blur-[150px] mix-blend-screen" />
          <div className="absolute w-[100vw] h-[100vw] md:w-[400px] md:h-[400px] bg-[#a78bfa]/20 rounded-full blur-[80px] md:blur-[100px] translate-x-1/2 translate-y-1/2 mix-blend-screen" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          
          <div className="hero-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-300 text-xs font-semibold tracking-widest uppercase">The future of student growth</span>
          </div>

          <h1 ref={titleRef} className="text-4xl sm:text-6xl md:text-8xl lg:text-[110px] font-bold text-center leading-[0.95] sm:leading-[0.9] tracking-tighter mb-6 sm:mb-8 perspective-1000">
            <div className="overflow-hidden inline-block"><span className="word inline-block origin-bottom">Redefine</span></div>{' '}
            <div className="overflow-hidden inline-block"><span className="word inline-block origin-bottom text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#a78bfa]">Your</span></div>{' '}
            <br className="hidden md:block"/>
            <div className="overflow-hidden inline-block"><span className="word inline-block origin-bottom">Potential.</span></div>
          </h1>

          <p className="hero-fade-up text-gray-400 text-base sm:text-lg md:text-2xl text-center max-w-2xl mb-8 sm:mb-12 leading-relaxed font-light px-4 sm:px-0">
            An ecosystem built specifically for ambitious students. Land internships, win hackathons, and build your profile in one unified platform.
          </p>

          <div className="hero-fade-up" ref={ctaBtnRef}>
            <Link to="/signup"
              className="group relative flex items-center justify-center gap-3 bg-white text-black font-bold px-10 py-5 rounded-full overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 text-lg tracking-wide">Enter the Ecosystem</span>
              <div className="relative z-10 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Premium Scroll Indicator */}
        <div className="hero-fade-up absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Explore</span>
          <div className="w-[1px] h-16 bg-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white animate-[scroll-down_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </section>

      {/* Narrative Section (Scroll Tied Text) */}
      <section className="py-32 md:py-48 px-6 max-w-5xl mx-auto relative z-10 flex items-center justify-center min-h-screen">
        <h2 ref={scrollTextRef} className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold text-white leading-snug sm:leading-tight md:leading-tight tracking-tight text-center">
          {"We believe that talent is everywhere, but opportunities are not. Codovate bridges the gap for students outside tier-1 colleges, providing the roadmaps, mentorship, and access you need to stand out globally.".split(' ').map((word, i) => (
            <span key={i} className="scroll-word inline-block mr-2 sm:mr-3 md:mr-4">{word}</span>
          ))}
        </h2>
      </section>

      {/* 3D Grid Features Section */}
      <section ref={horizontalSectionRef} className="py-24 md:py-32 bg-[#050505] relative overflow-hidden w-full">
        
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
          
          <div className="lg:sticky lg:top-32 lg:w-1/3 shrink-0">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6">The <span className="text-primary">Advantage</span></h2>
            <p className="text-gray-400 text-base sm:text-xl max-w-sm">Everything you need to accelerate your growth, built right in.</p>
          </div>

          <div ref={cardsWrapperRef} className="grid sm:grid-cols-2 gap-6 lg:w-2/3" style={{ perspective: '1200px' }}>
            {features.map((f, i) => (
              <div key={i} className="h-card bg-white/[0.03] border border-white/[0.08] p-8 sm:p-10 rounded-2xl hover:bg-white/[0.05] transition-colors backdrop-blur-md hover:-translate-y-2 duration-300" style={{ transformStyle: 'preserve-3d' }}>
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-4xl mb-8">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{f.title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-black" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] md:w-[800px] md:h-[800px] bg-primary/20 blur-[100px] md:blur-[150px] rounded-full pointer-events-none" />
        </div>

        <div className="relative z-10 text-center max-w-3xl">
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-8 tracking-tighter">Start Building.</h2>
          <Link to="/signup"
            className="group relative inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white font-bold px-12 py-6 rounded-full overflow-hidden transition-transform duration-300 hover:scale-105 shadow-[0_0_40px_rgba(32,21,255,0.4)]">
            <span className="relative z-10 text-xl tracking-wide">Create Free Account</span>
            <div className="relative z-10 bg-white/20 p-2 rounded-full group-hover:translate-x-2 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </div>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-10 text-center border-t border-white/5 text-gray-600 text-sm font-semibold uppercase tracking-widest relative z-10 bg-black">
        © 2025 Codovate. Designed for builders.
      </footer>
    </div>
  );
};

export default Home;