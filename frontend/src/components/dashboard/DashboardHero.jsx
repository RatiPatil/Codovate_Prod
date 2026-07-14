import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const DashboardHero = ({ profile, mission }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Reveal animation for hero container
    gsap.fromTo(containerRef.current, 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );

    // Number counters
    gsap.utils.toArray('.stat-counter').forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target') || '0', 10);
      gsap.to({ val: 0 }, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        onUpdate: function() {
          if(counter) counter.innerText = Math.round(this.targets()[0].val);
        }
      });
    });
  }, [profile]);

  const firstName = profile?.name?.split(' ')[0] || 'Student';
  const xp = profile?.xp || 0;
  const streak = profile?.streak || 0;
  const profileScore = profile?.profile_completion || 60;
  const readiness = 74; // Simulated dynamic readiness based on AI
  const roadmap = profile?.skills?.length ? Math.min(100, profile.skills.length * 10) : 28;

  return (
    <div ref={containerRef} className="bg-gradient-to-br from-primary/20 via-black to-black border border-white/10 rounded-3xl p-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Good Morning {firstName} 👋</h1>
            <p className="text-gray-400 text-lg">Welcome Back! You're making great progress.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 backdrop-blur-md">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Streak</p>
                <p className="text-white font-bold"><span className="stat-counter" data-target={streak}>0</span> Days</p>
              </div>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 backdrop-blur-md">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Daily XP</p>
                <p className="text-primary font-bold">+<span className="stat-counter" data-target={xp}>0</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Career Goal</p>
            <p className="text-white font-bold text-lg line-clamp-1">{profile?.career_goal || 'Backend Developer'}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 h-1 bg-blue-500 w-[28%]" />
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Roadmap Progress</p>
            <p className="text-white font-bold text-2xl"><span className="stat-counter" data-target={roadmap}>0</span>%</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 h-1 bg-green-500 w-[74%]" />
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Placement Readiness</p>
            <p className="text-white font-bold text-2xl"><span className="stat-counter" data-target={readiness}>0</span>%</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 h-1 bg-purple-500 w-[81%]" />
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Profile Score</p>
            <p className="text-white font-bold text-2xl"><span className="stat-counter" data-target={profileScore}>0</span>%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;
