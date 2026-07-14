import { Link } from 'react-router-dom';

const CodingCard = () => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] group-hover:bg-orange-500/20 transition-all duration-500" />
      
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔥</span>
        <h2 className="text-lg font-bold text-white">Daily Coding Challenge</h2>
      </div>

      <div className="bg-black/30 rounded-xl p-5 mb-6 border border-white/5 flex-1">
        <p className="text-xs text-gray-500 font-bold uppercase mb-2">Question</p>
        <p className="text-white font-bold text-lg mb-4">Binary Search</p>
        
        <div className="flex gap-4">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Difficulty</p>
            <p className="text-yellow-500 font-bold text-sm">Medium</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Reward</p>
            <p className="text-primary font-bold text-sm">+50 XP</p>
          </div>
        </div>
      </div>

      <Link to="/leaderboard" className="block w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold py-3 rounded-xl text-center transition-colors border border-orange-500/30">
        Solve Now
      </Link>
    </div>
  );
};

export default CodingCard;
