import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import api from '../../api/axios';
import { showAlert } from '../../utils/uiUtils';
import TeamDetailsModal from './TeamDetailsModal';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const TeamsHome = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const listRef = useRef(null);

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

  useEffect(() => {
    if (!loading && teams.length > 0 && listRef.current) {
      const cards = listRef.current.querySelectorAll('.team-card');
      gsap.fromTo(cards, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [loading, teams]);

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
      <div className="flex-1 h-full overflow-y-auto pt-4">
        <SkeletonLoader type="card" count={6} />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-3xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[400px] max-w-2xl mx-auto mt-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl relative z-10 transform transition-transform hover:scale-105">
          🔭
        </div>
        <h3 className="text-xl font-bold text-white mb-2 relative z-10">No Teams Available</h3>
        <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto relative z-10">
          There are currently no active teams looking for members. Check back later or create your own team!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 scrollbar-hide pb-20">
      <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div 
            key={team.id} 
            className="team-card glass-panel p-6 rounded-2xl border border-white/10 hover:border-primary/30 transition-all duration-300 group flex flex-col h-full relative overflow-hidden hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(32,21,255,0.2)]"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {team.logo ? (
                    <img loading="lazy" decoding="async" src={team.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{team.name?.charAt(0).toUpperCase() || 'T'}</span>
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
                className="w-full py-2.5 bg-white/5 hover:bg-primary/10 text-white hover:text-primary rounded-xl font-medium transition-all border border-white/10 hover:border-primary/30 active:scale-95"
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
