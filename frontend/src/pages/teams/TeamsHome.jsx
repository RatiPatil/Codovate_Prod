import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { showAlert } from '../../utils/uiUtils';
import TeamDetailsModal from './TeamDetailsModal';

const TeamsHome = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teams/all');
      setTeams(res.data);
    } catch (err) {
      console.error(err);
      showAlert('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Recruiting': 'bg-green-500/10 text-green-500 border-green-500/20',
      'Open': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'Closed': 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] || colors['Recruiting']}`}>
        {status}
      </span>
    );
  };

  const getModeBadge = (mode) => {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-white/5 text-gray-300 border-white/10 flex items-center gap-1">
        {mode === 'Remote' ? '🌍' : mode === 'Hybrid' ? '🏢' : '📍'} {mode || 'Remote'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl mb-4">
          🔭
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Teams Available</h2>
        <p className="text-gray-400">
          There are currently no active teams looking for members. Check back later or create your own team!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 scrollbar-hide pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div 
            key={team.id} 
            className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-primary/30 transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {team.logo ? (
                    <img src={team.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{team.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{team.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-1">{team.project_title || 'Untitled Project'}</p>
                </div>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-6 line-clamp-2 relative z-10 min-h-[40px]">
              {team.description || "No description provided for this team."}
            </p>

            <div className="flex flex-wrap gap-2 mb-6 relative z-10">
              {getStatusBadge(team.status)}
              {getModeBadge(team.work_mode)}
              {team.category && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20">
                  {team.category}
                </span>
              )}
            </div>

            <div className="space-y-4 mt-auto pt-4 border-t border-white/10 relative z-10">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-lg">👑</span>
                  <span className="truncate max-w-[100px]">{team.owner_name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-300">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                  <span>{team.member_count} / {team.capacity || 4} Members</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTeam(team)}
                className="w-full py-2.5 bg-white/5 hover:bg-primary/10 text-white hover:text-primary rounded-xl font-medium transition-colors border border-white/10 hover:border-primary/30"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedTeam && (
        <TeamDetailsModal 
          team={selectedTeam} 
          onClose={() => setSelectedTeam(null)} 
          onUpdate={fetchTeams}
        />
      )}
    </div>
  );
};

export default TeamsHome;
