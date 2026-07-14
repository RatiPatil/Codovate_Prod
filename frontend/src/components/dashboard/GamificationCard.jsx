import { Link } from 'react-router-dom';

const GamificationCard = ({ profile }) => {
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const streak = profile?.streak || 12;
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎮</span>
          <h2 className="text-lg font-bold text-white">Gamification</h2>
        </div>
        <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-white/10">
          <span className="text-xs">🔥</span>
          <span className="text-white font-bold text-xs">{streak} Days</span>
        </div>
      </div>

      <div className="flex justify-between items-end mb-2">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase">Current Level</p>
          <p className="text-2xl font-black text-white">Level {level}</p>
        </div>
        <div className="text-right">
          <p className="text-primary font-bold">{xp} XP</p>
        </div>
      </div>
      
      <div className="w-full bg-black/50 rounded-full h-1.5 mb-4 overflow-hidden">
        <div className="bg-primary h-1.5 rounded-full w-[40%]" />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-black/30 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Coins</p>
          <p className="text-yellow-500 font-bold text-sm flex items-center gap-1">🪙 {xp * 2}</p>
        </div>
        <div className="bg-black/30 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Leaderboard</p>
          <p className="text-white font-bold text-sm flex items-center gap-1">#42</p>
        </div>
      </div>

      <div className="space-y-3 mb-4 flex-1">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Weekly Goal</span>
            <span className="text-[10px] text-primary font-bold">3/5 Days</span>
          </div>
          <div className="w-full bg-black/50 rounded-full h-1 overflow-hidden">
            <div className="bg-primary h-1 rounded-full w-[60%]" />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Monthly Challenge</span>
            <span className="text-[10px] text-green-400 font-bold">80%</span>
          </div>
          <div className="w-full bg-black/50 rounded-full h-1 overflow-hidden">
            <div className="bg-green-500 h-1 rounded-full w-[80%]" />
          </div>
        </div>
      </div>

      <Link to="/leaderboard" className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl text-center transition-colors border border-white/10 block mt-auto">
        View Leaderboard
      </Link>
    </div>
  );
};

export default GamificationCard;
