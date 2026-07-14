import { Link } from 'react-router-dom';

const RecommendedOpportunities = ({ opportunities, profile }) => {
  // Simplistic matching for demo if no algo
  const opp = opportunities?.[0] || {
    title: 'Backend Developer Internship',
    company: { name: 'Tech Innovators' },
    skills_required: ['Java', 'Spring Boot', 'Docker', 'SQL'],
    match_score: 92
  };
  
  const target = profile?.career_goal || 'Backend Developer';

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col">
      <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] group-hover:bg-green-500/20 transition-all duration-500" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">💼</span>
          <h2 className="text-lg font-bold text-white">Top Match</h2>
        </div>
        <div className="bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-full">
          <span className="text-green-400 font-bold text-sm">{opp.match_score || 92}% Match</span>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/5 flex-1 relative z-10">
        <p className="text-white font-bold text-lg mb-1">{opp.title}</p>
        <p className="text-gray-400 text-sm mb-4">{opp.company?.name || 'Company Name'}</p>
        
        <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Missing Skills</p>
        <div className="flex flex-wrap gap-2">
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2 py-1 rounded uppercase">Docker</span>
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2 py-1 rounded uppercase">Spring Boot</span>
        </div>
      </div>

      <div className="flex gap-3 relative z-10">
        <Link to={`/opportunities/${opp.id || '1'}`} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-center text-sm transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          Apply
        </Link>
        <button className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-4 rounded-xl transition-colors border border-white/10">
          🔖
        </button>
      </div>
    </div>
  );
};

export default RecommendedOpportunities;
