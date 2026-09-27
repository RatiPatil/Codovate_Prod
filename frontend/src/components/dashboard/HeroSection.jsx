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
    <div ref={containerRef} className="relative w-full rounded-[2rem] p-8 md:p-12 overflow-hidden border border-white/5 bg-gradient-to-br from-[#0a0a0c] to-[#12121a] shadow-2xl group">
      {/* Background Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/30 transition-all duration-700" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-purple-600/20 transition-all duration-700" />

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row gap-12 items-start justify-between">
        
        {/* Left Side: Greeting & Goal */}
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
              {getGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{profile?.name?.split(' ')[0] || 'Builder'}</span> <span className="inline-block hover:animate-wave origin-bottom-right">👋</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 font-medium leading-relaxed max-w-2xl">
              Continue your journey to becoming a <span className="text-white font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/10">{profile?.career_goal || 'Professional'}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link to="/opportunities" className="relative overflow-hidden group/btn bg-primary text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(32,21,255,0.2)] hover:shadow-[0_0_30px_rgba(32,21,255,0.4)] hover:-translate-y-0.5">
              <span className="relative z-10">Find Opportunities</span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-700 ease-in-out" />
            </Link>
            <div className="flex items-center gap-2 px-5 py-3 glass-panel rounded-xl text-sm font-bold text-gray-300 hover:-translate-y-0.5 transition-transform cursor-default">
              ⭐ <span className="text-white bg-clip-text">{profile?.points || 0}</span> Score
            </div>
            {profile?.joinedAt && (
              <div className="flex items-center gap-2 px-5 py-3 glass-panel rounded-xl text-sm font-bold text-gray-300 hover:-translate-y-0.5 transition-transform cursor-default">
                👋 Joined <span className="text-white">{new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Primary Stats */}
        <div className="w-full md:w-[350px] space-y-4 shrink-0">
          
          {/* Profile Completion */}
          <div className="glass-panel hover:bg-white/[0.04] transition-colors rounded-2xl p-6 relative overflow-hidden group/stat">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
            <div className="relative z-10 flex justify-between items-end mb-3">
              <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest">Profile Completion</h3>
              <span className="text-3xl font-black text-white tracking-tighter">{profile?.profile_completion || 0}%</span>
            </div>
            <div className="relative z-10 w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full relative" 
                style={{ width: `${profile?.profile_completion || 0}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <p className="relative z-10 text-[11px] text-gray-500 mt-4 font-medium uppercase tracking-wide">Complete profile to stand out.</p>
          </div>

          {/* Applications Submitted */}
          <div className="glass-panel hover:bg-white/[0.04] transition-colors rounded-2xl p-6 relative overflow-hidden group/stat">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
            <div className="relative z-10 flex justify-between items-end mb-1">
              <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest">Total Applications</h3>
              <span className="text-3xl font-black text-white tracking-tighter">{profile?.appsCount || 0}</span>
            </div>
            <p className="relative z-10 text-[11px] text-gray-500 mt-2 font-medium uppercase tracking-wide">Keep applying to land roles.</p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default HeroSection;
