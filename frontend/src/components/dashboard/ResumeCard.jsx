import { Link } from 'react-router-dom';

const ResumeCard = () => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
          <span className="text-xl">📄</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Resume Score</h2>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-black text-green-400">82</span>
            <span className="text-sm font-bold text-gray-500 mb-1">/100</span>
          </div>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 font-bold uppercase mb-2">Missing Improvements</p>
        <div className="flex flex-wrap gap-2">
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold px-2 py-1 rounded">Projects</span>
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold px-2 py-1 rounded">Achievements</span>
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold px-2 py-1 rounded">Keywords</span>
        </div>
      </div>

      <Link to="/resume" className="block w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl text-center transition-colors border border-white/10">
        Improve Resume
      </Link>
    </div>
  );
};

export default ResumeCard;
