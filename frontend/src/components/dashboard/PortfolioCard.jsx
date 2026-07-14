import { Link } from 'react-router-dom';

const PortfolioCard = () => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
          <span className="text-xl">🌐</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Portfolio URL</h2>
          <p className="text-xs text-gray-500 truncate max-w-[150px]">codovate.com/p/vivek</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Visitors</p>
          <p className="text-white font-bold text-sm">142</p>
        </div>
        <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Recruiters</p>
          <p className="text-white font-bold text-sm">12</p>
        </div>
        <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Projects</p>
          <p className="text-white font-bold text-sm">4</p>
        </div>
      </div>

      <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl text-center transition-colors border border-white/10">
        Open Portfolio
      </button>
    </div>
  );
};

export default PortfolioCard;
