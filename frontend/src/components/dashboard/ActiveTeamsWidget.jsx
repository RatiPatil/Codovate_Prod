import { Link } from 'react-router-dom';

const ActiveTeamsWidget = ({ teams }) => {
  if (!teams || teams.length === 0) {
    return null; // Hide if not in any teams
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium tracking-widest text-gray-400 uppercase">Active Teams</h3>
        <Link to="/team-management" className="text-xs text-primary hover:text-primary/80 transition-colors">View All</Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {teams.slice(0, 3).map((team) => (
          <Link 
            to="/team-management" 
            key={team._id} 
            className="bg-white/[0.02] border border-white/5 p-4 rounded-xl hover:bg-white/[0.05] transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-white text-sm font-medium line-clamp-1">{team.name}</h4>
              <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded flex-shrink-0">
                {team.members?.length || 1} Members
              </span>
            </div>
            
            {team.projectIdea && (
              <p className="text-gray-400 text-xs line-clamp-2 mb-4">
                {team.projectIdea}
              </p>
            )}
            
            <div className="flex items-center gap-1.5 flex-wrap">
              {team.skillsNeeded?.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="text-[9px] font-medium uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {skill}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ActiveTeamsWidget;
