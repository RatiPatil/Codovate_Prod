import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { showAlert } from '../../../utils/uiUtils';
import TeamDetailsModal from './TeamDetailsModal';

const MyTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Create Team Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    project_title: '',
    description: '',
    category: 'General',
    work_mode: 'Remote',
    capacity: 4
  });

  useEffect(() => {
    fetchMyTeams();
  }, []);

  const fetchMyTeams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teams/my');
      setTeams(res.data);
    } catch (err) {
      console.error(err);
      showAlert('Failed to load your teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', newTeamData);
      showAlert('Team created successfully!', 'success');
      setIsCreating(false);
      fetchMyTeams();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to create team');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Your Teams</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Create Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl mb-4">
            💼
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Teams Yet</h2>
          <p className="text-gray-400">
            You are not part of any teams. Create a new team or join an existing one from the Discover Teams tab.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div 
                key={team.id} 
                className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-primary/30 transition-all duration-300 flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white line-clamp-1">{team.name}</h3>
                    <p className="text-sm text-gray-400">{team.project_title || 'Untitled Project'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    team.my_role === 'leader' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                    'bg-white/5 text-gray-400 border-white/10'
                  }`}>
                    {team.my_role === 'leader' ? 'Owner' : team.my_role}
                  </span>
                </div>

                <p className="text-gray-300 text-sm mb-6 line-clamp-2 min-h-[40px]">
                  {team.description || "No description provided."}
                </p>

                <div className="mt-auto space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                      👥 {team.member_count} / {team.capacity || 4} Members
                    </span>
                    <span className="text-primary font-medium">{team.status}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedTeam(team)}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/10"
                  >
                    Manage Team
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTeam && (
        <TeamDetailsModal 
          team={selectedTeam} 
          onClose={() => setSelectedTeam(null)} 
          onUpdate={fetchMyTeams}
          currentUserRole={selectedTeam.my_role}
        />
      )}

      {isCreating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setIsCreating(false)} />
          <div className="relative z-10 w-full max-w-lg glass-panel rounded-2xl shadow-2xl overflow-hidden p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Team</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Team Name</label>
                <input 
                  type="text" 
                  required
                  value={newTeamData.name}
                  onChange={(e) => setNewTeamData({...newTeamData, name: e.target.value})}
                  className="w-full bg-black/50 text-white border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Project Title (Optional)</label>
                <input 
                  type="text" 
                  value={newTeamData.project_title}
                  onChange={(e) => setNewTeamData({...newTeamData, project_title: e.target.value})}
                  className="w-full bg-black/50 text-white border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea 
                  required
                  rows="3"
                  value={newTeamData.description}
                  onChange={(e) => setNewTeamData({...newTeamData, description: e.target.value})}
                  className="w-full bg-black/50 text-white border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select 
                    value={newTeamData.category}
                    onChange={(e) => setNewTeamData({...newTeamData, category: e.target.value})}
                    className="w-full bg-black/50 text-white border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                  >
                    <option>General</option>
                    <option>Web Development</option>
                    <option>Machine Learning</option>
                    <option>App Development</option>
                    <option>Data Science</option>
                    <option>Hackathon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Work Mode</label>
                  <select 
                    value={newTeamData.work_mode}
                    onChange={(e) => setNewTeamData({...newTeamData, work_mode: e.target.value})}
                    className="w-full bg-black/50 text-white border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                  >
                    <option>Remote</option>
                    <option>Hybrid</option>
                    <option>Offline</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Capacity (Max Members)</label>
                <input 
                  type="number" 
                  min="2" max="20"
                  value={newTeamData.capacity}
                  onChange={(e) => setNewTeamData({...newTeamData, capacity: parseInt(e.target.value)})}
                  className="w-full bg-black/50 text-white border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTeams;
