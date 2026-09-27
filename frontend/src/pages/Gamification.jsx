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
    <div ref={containerRef} className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-8 pt-24 md:pt-32 max-w-7xl mx-auto space-y-8 pb-32 overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="stagger-item text-center max-w-3xl mx-auto mb-12 relative">
        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
          Rewards & Progress
        </h1>
        <p className="text-slate-600">Track your learning journey, earn badges, and climb the ranks.</p>
      </div>

      {/* TOP STATS: XP, COINS, STREAK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* XP Card */}
        <div className="stagger-item group bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
          <div className="absolute inset-0 bg-blue-50/50 group-hover:bg-blue-100/50 transition-colors duration-500" />
          <span className="text-5xl mb-4 animate-bounce relative z-10">⚡</span>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Total XP</h3>
          <p className="text-4xl md:text-5xl font-black text-slate-900 relative z-10">{data.xp.toLocaleString()}</p>
        </div>

        {/* Coins Card */}
        <div className="stagger-item group bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
          <div className="absolute inset-0 bg-amber-50/50 group-hover:bg-amber-100/50 transition-colors duration-500" />
          <span className="text-5xl mb-4 animate-[spin_4s_linear_infinite] relative z-10">🪙</span>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Codovate Coins</h3>
          <p className="text-4xl md:text-5xl font-black text-amber-600 relative z-10">{data.coins.toLocaleString()}</p>
        </div>

        {/* Streak Card */}
        <div className="stagger-item group bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
          <div className="absolute inset-0 bg-orange-50/50 group-hover:bg-orange-100/50 transition-colors duration-500" />
          <span className="text-5xl mb-4 animate-pulse relative z-10">🔥</span>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Daily Streak</h3>
          <p className="text-4xl md:text-5xl font-black text-orange-600 mb-4 relative z-10">{data.streak} <span className="text-xl text-orange-400">Days</span></p>
          <button 
            onClick={handleCheckIn}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white font-bold rounded-full text-xs transition-all shadow-sm relative z-10"
          >
            Check In
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* LEFT COL: Goals & Challenges */}
        <div className="space-y-8">
          
          {/* Challenges List */}
          <div className="stagger-item bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900"><span>🎯</span> Weekly Challenges</h2>
            </div>
            
            <div className="space-y-6">
              {data.weeklyChallenges?.map((challenge) => (
                <div key={challenge.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-700 font-semibold text-sm">{challenge.title}</p>
                    <span className="text-xs text-indigo-600 font-bold">{challenge.current} / {challenge.target}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min((challenge.current / challenge.target) * 100, 100)}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold text-right">+ {challenge.reward} XP</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COL: Badges Array */}
        <div className="stagger-item bg-white border border-slate-200 rounded-3xl p-6 md:p-8 h-fit shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900"><span>🎖️</span> Your Badges</h2>
            <span className="text-slate-500 text-sm font-bold">
              {data.badges.filter(b => b.earned).length} / {data.badges.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {data.badges.map((badge) => (
              <div 
                key={badge.id}
                className={`group flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
                  badge.earned 
                    ? 'bg-indigo-50/50 border-indigo-200 shadow-sm hover:-translate-y-1' 
                    : 'bg-slate-50 border-slate-200 opacity-60 grayscale hover:grayscale-0'
                }`}
              >
                <span className="text-4xl mb-3 drop-shadow-sm">{badge.icon}</span>
                <span className="text-xs font-bold text-center text-slate-800 leading-tight">{badge.name}</span>
                {!badge.earned && <span className="mt-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">Locked</span>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Gamification;
