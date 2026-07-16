import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';

const HeroSection = ({ profile }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // GSAP Reveal Animation
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && containerRef.current) {
      gsap.fromTo(containerRef.current.children, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div ref={containerRef} className="relative w-full rounded-3xl p-8 md:p-12 overflow-hidden border border-white/10 bg-[#0a0a0c]">
      {/* Background Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row gap-10 items-start justify-between">
        
        {/* Left Side: Greeting & Goal */}
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">
              {getGreeting()}, {profile.name.split(' ')[0] || 'Builder'} <span className="inline-block hover:animate-wave">👋</span>
            </h1>
            <p className="text-xl text-gray-400 font-medium">
              Continue your journey to becoming a <span className="text-white font-bold">{profile.career_goal}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link to="/opportunities" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(32,21,255,0.3)]">
              Find Opportunities
            </Link>
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">
              ⭐ <span className="text-white">{profile.points || 0}</span> Profile Score
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300">
              👋 Joined <span className="text-white">{new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Primary Stats */}
        <div className="w-full md:w-[350px] space-y-6 shrink-0">
          
          {/* Profile Completion */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wider">Profile Completion</h3>
              <span className="text-2xl font-black text-white">{profile.profile_completion || 0}%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" 
                style={{ width: `${profile.profile_completion || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">Complete your profile to stand out to recruiters.</p>
          </div>

          {/* Applications Submitted */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wider">Total Applications</h3>
              <span className="text-2xl font-black text-white">{profile.appsCount || 0}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Keep applying to land your dream role.</p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default HeroSection;
