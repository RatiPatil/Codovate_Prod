import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: '10K+', label: 'Students' },
  { value: '500+', label: 'Opportunities' },
  { value: '200+', label: 'Companies' },
  { value: '95%', label: 'Success Rate' },
];

const features = [
  {
    icon: '🚀',
    title: 'Opportunity Hub',
    desc: 'Discover internships, hackathons and competitions curated for your skills and goals.',
  },
  {
    icon: '📊',
    title: 'Growth Dashboard',
    desc: 'Track your applications, monitor your progress and visualize your career growth.',
  },
  {
    icon: '🎯',
    title: 'Smart Matching',
    desc: 'Get matched with opportunities that align with your branch, skills and year of study.',
  },
  {
    icon: '🏆',
    title: 'Achievement System',
    desc: 'Earn badges, build your profile and stand out to top recruiters across India.',
  },
];

const Home = () => {
  const heroRef = useRef(null);
  const navRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();

    // Nav animation
    tl.fromTo(navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );

    // Background glow
    tl.fromTo(bgRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' },
      '-=0.4'
    );

    // Title word by word
    tl.fromTo(titleRef.current,
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' },
      '-=0.6'
    );

    // Subtitle
    tl.fromTo(subtitleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
      '-=0.4'
    );

    // CTA buttons
    tl.fromTo(ctaRef.current.children,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power2.out' },
      '-=0.3'
    );

    // Stats
    tl.fromTo(statsRef.current.children,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
      '-=0.2'
    );

    // Features scroll trigger
    gsap.fromTo('.feature-card',
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
        }
      }
    );

    // Floating animation for glow
    gsap.to(bgRef.current, {
      y: -20,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* Navbar */}
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="text-white font-bold text-lg tracking-tight">Codovate</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Opportunities', 'Internships', 'Hackathons', 'Community'].map(item => (
            <a key={item} href="#features" className="text-gray-400 hover:text-white text-sm font-medium transition-colors duration-200">
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors px-4 py-2">
            Login
          </Link>
          <Link to="/signup" className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-primary/20">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 overflow-hidden">

        {/* Background Glow */}
        <div ref={bgRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(32,21,255,0.15) 0%, rgba(32,21,255,0.05) 50%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-primary text-xs font-semibold tracking-wide">India's Student Growth Platform</span>
        </div>

        {/* Title */}
        <h1 ref={titleRef} className="text-4xl md:text-6xl lg:text-7xl font-bold text-center leading-tight max-w-4xl mb-6">
          Launch Your{' '}
          <span className="relative">
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #2015ff, #6c63ff, #a78bfa)' }}>
              Career
            </span>
          </span>
          {' '}with Real Opportunities
        </h1>

        {/* Subtitle */}
        <p ref={subtitleRef} className="text-gray-400 text-base md:text-xl text-center max-w-2xl mb-10 leading-relaxed">
          Discover internships, hackathons and competitions. Build your profile,
          track applications and grow your skills — all in one place.
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link to="/signup"
            className="group flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 text-sm md:text-base">
            Start for Free
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
          <a href="#features"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 text-sm md:text-base">
            See How It Works
          </a>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <p className="text-gray-600 text-xs">Scroll to explore</p>
          <div className="w-5 h-8 border border-gray-700 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-gray-600 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className="py-24 px-4 md:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Why Codovate</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to grow</h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            Built specifically for Indian students to bridge the gap between college and career.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(f => (
            <div key={f.title} className="feature-card group bg-[#0a0a0a] border border-white/8 rounded-2xl p-6 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to grow your career?
            </h2>
            <p className="text-gray-400 mb-8 text-base">
              Join thousands of students already using Codovate to land their dream opportunities.
            </p>
            <Link to="/signup"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 shadow-xl shadow-primary/30 hover:scale-105 text-sm md:text-base">
              Create Free Account →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">C</div>
            <span className="text-gray-400 text-sm font-medium">Codovate</span>
          </div>
          <p className="text-gray-600 text-xs">© 2025 Codovate. Built for Indian students.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(item => (
              <a key={item} href="#" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;