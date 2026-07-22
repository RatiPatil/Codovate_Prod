import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';

const Gamification = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        const res = await api.get('/gamification');
        setData(res.data);
      } catch (err) {
        console.error("Failed to load gamification data", err);
        setError("Could not load your rewards.");
      } finally {
        setLoading(false);
      }
    };
    fetchGamification();
  }, []);

  const handleCheckIn = async () => {
    try {
      const res = await api.post('/gamification/streak');
      alert(res.data.message);
      // Optimistically update
      setData(prev => ({
        ...prev,
        streak: res.data.streak,
        xp: prev.xp + res.data.xpGain,
        coins: prev.coins + (res.data.xpGain / 2)
      }));
    } catch (err) {
      alert("Failed to check in");
    }
  };

  useEffect(() => {
    if (!loading && data && containerRef.current) {
      const elements = containerRef.current.querySelectorAll('.stagger-item');
      gsap.fromTo(elements,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [loading, data]);

  if (loading) return <Loader fullScreen />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32 max-w-7xl mx-auto space-y-8 pb-32 overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="stagger-item text-center max-w-3xl mx-auto mb-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
          Rewards & Progress
        </h1>
        <p className="text-gray-400 relative z-10">Track your learning journey, earn badges, and climb the ranks.</p>
      </div>

      {/* TOP STATS: XP, COINS, STREAK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* XP Card */}
        <div className="stagger-item group bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500" />
          <span className="text-5xl mb-4 animate-bounce">⚡</span>
          <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Total XP</h3>
          <p className="text-5xl font-black text-white">{data.xp.toLocaleString()}</p>
        </div>

        {/* Coins Card */}
        <div className="stagger-item group bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors duration-500" />
          <span className="text-5xl mb-4 animate-[spin_4s_linear_infinite]">🪙</span>
          <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Codovate Coins</h3>
          <p className="text-5xl font-black text-yellow-400">{data.coins.toLocaleString()}</p>
        </div>

        {/* Streak Card */}
        <div className="stagger-item group bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors duration-500" />
          <span className="text-5xl mb-4 animate-pulse">🔥</span>
          <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Daily Streak</h3>
          <p className="text-5xl font-black text-orange-500 mb-4">{data.streak} <span className="text-2xl text-orange-500/50">Days</span></p>
          <button 
            onClick={handleCheckIn}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full text-sm transition-colors"
          >
            Check In
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* LEFT COL: Goals & Challenges */}
        <div className="space-y-8">
          
          {/* Challenges List */}
          <div className="stagger-item bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><span>🎯</span> Weekly Challenges</h2>
            </div>
            
            <div className="space-y-6">
              {data.weeklyChallenges?.map((challenge) => (
                <div key={challenge.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-300 font-medium text-sm">{challenge.title}</p>
                    <span className="text-xs text-primary font-bold">{challenge.current} / {challenge.target}</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min((challenge.current / challenge.target) * 100, 100)}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 text-right">+ {challenge.reward} XP</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COL: Badges Array */}
        <div className="stagger-item bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 md:p-8 h-fit">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2"><span>🎖️</span> Your Badges</h2>
            <span className="text-gray-400 text-sm font-bold">
              {data.badges.filter(b => b.earned).length} / {data.badges.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {data.badges.map((badge) => (
              <div 
                key={badge.id}
                className={`group flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
                  badge.earned 
                    ? 'bg-gradient-to-b from-white/10 to-white/5 border-white/20 shadow-[0_4px_20px_rgba(255,255,255,0.05)] hover:-translate-y-1' 
                    : 'bg-black/40 border-white/5 grayscale opacity-40 hover:grayscale-0 hover:opacity-100'
                }`}
              >
                <span className="text-4xl mb-3 drop-shadow-lg">{badge.icon}</span>
                <span className="text-xs font-bold text-center text-gray-300 leading-tight">{badge.name}</span>
                {!badge.earned && <span className="mt-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Locked</span>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Gamification;
