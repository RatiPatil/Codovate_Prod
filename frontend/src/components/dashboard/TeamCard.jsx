import { Link } from 'react-router-dom';

const TeamCard = () => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] group-hover:bg-cyan-500/20 transition-all duration-500" />
      
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">👥</span>
          <h2 className="text-lg font-bold text-white">Suggested Team</h2>
        </div>

        <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/5">
          <p className="text-white font-bold mb-2">Hackathon Dream Team</p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold px-2 py-1 rounded uppercase">Java</span>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold px-2 py-1 rounded uppercase">React</span>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold px-2 py-1 rounded uppercase">Flutter</span>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold px-2 py-1 rounded uppercase">Python</span>
          </div>
        </div>
      </div>

      <Link to="/teams" className="block w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-bold py-2.5 rounded-xl text-center transition-colors border border-cyan-500/30">
        Connect
      </Link>
    </div>
  );
};

export default TeamCard;
