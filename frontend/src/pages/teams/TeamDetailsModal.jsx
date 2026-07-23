import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/dateUtils';

const TeamDetailsModal = ({ team, onClose, onUpdate, currentUserRole }) => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOwner = currentUserRole === 'leader' || team.created_by === currentUser?.id;

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/teams/${team.id}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
      showAlert('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [team.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleJoin = async () => {
    try {
      await api.post('/teams/join', { join_code: team.join_code });
      showAlert('Joined team successfully!', 'success');
      onUpdate?.();
      onClose();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to join team');
    }
  };

  const handleLeave = async () => {
    if (!await showConfirm('Are you sure you want to leave this team?')) return;
    try {
      await api.delete(`/teams/${team.id}/leave`);
      showAlert('You left the team.', 'success');
      onUpdate?.();
      onClose();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to leave team');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!await showConfirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/teams/${team.id}/members/${userId}`);
      fetchMembers();
      onUpdate?.();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Determine if user is already a member
  const isMember = members.some(m => m.id === currentUser?.id);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 lg:p-10 overflow-y-auto">
      <div className="absolute inset-0 min-h-[120%]" onClick={onClose} />
      <div className="relative z-10 w-[95vw] md:w-full max-w-5xl bg-[#0f0f11] border border-white/10 rounded-2xl shadow-2xl my-10 overflow-hidden flex flex-col">
        {/* Cover Photo Area */}
        <div className="h-32 md:h-48 bg-gradient-to-r from-primary/30 to-purple-600/30 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-full backdrop-blur-sm transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="px-6 md:px-10 pb-10">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-8 relative z-10">
            <div className="w-32 h-32 rounded-2xl bg-[#1a1a1f] border-4 border-[#0f0f11] flex items-center justify-center overflow-hidden shrink-0 shadow-xl">
              {team.logo ? (
                <img loading="lazy" decoding="async" src={team.logo} alt="Team Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-gray-500">{team.name?.charAt(0).toUpperCase() || 'T'}</span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-white">{team.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  team.status === 'Recruiting' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                  team.status === 'Open' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                  'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                  {team.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-gray-300">
                  {team.work_mode || 'Remote'}
                </span>
              </div>
              <p className="text-primary font-medium text-lg mb-4">{team.project_title || 'Untitled Project'}</p>
              
              <div className="flex flex-wrap items-center gap-3">
                {!isMember ? (
                  team.status !== 'Closed' && team.status !== 'Full' && (
                    <button onClick={handleJoin} className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
                      Join Team
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 bg-green-400/10 border border-green-400/20 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2">
                      <span>✓</span> You are a member
                    </span>
                    {!isOwner && (
                      <button onClick={handleLeave} className="text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 px-4 py-2.5 rounded-xl font-medium transition-colors">
                        Leave Team
                      </button>
                    )}
                  </div>
                )}
                {isOwner && (
                  <div className="flex gap-2">
                    <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-xl font-medium transition-colors">
                      Edit Team
                    </button>
                    <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2">
                      Join Code: <span className="font-mono font-bold">{team.join_code}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-white mb-3">About the Project</h3>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {team.description || "No detailed description provided."}
                </div>
              </section>

              {team.required_skills && team.required_skills.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-white mb-3">Tech Stack & Skills Needed</h3>
                  <div className="flex flex-wrap gap-2">
                    {team.required_skills.map((skill, i) => {
                      const skillName = typeof skill === 'string' ? skill : (skill?.name || '');
                      return (
                      <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold">{skillName}</span>
                      );
                    })}
                  </div>
                </section>
              )}

              {team.tags && team.tags.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-white mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {team.tags.map((tag, i) => (
                      <span key={i} className="bg-white/5 text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Members & Metadata */}
            <div className="space-y-8">
              <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Team Members</h3>
                  <span className="text-sm font-medium text-gray-400 bg-black/30 px-3 py-1 rounded-full">
                    {members.length} / {team.capacity || 4}
                  </span>
                </div>

                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5 group relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
                          {m.avatar ? <img loading="lazy" decoding="async" src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : m.name?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium text-sm truncate flex items-center gap-1.5">
                            {m.name} {m.id === currentUser?.id && <span className="text-gray-500 text-xs">(You)</span>}
                            {m.role === 'leader' && <span title="Team Owner">👑</span>}
                          </p>
                          <p className="text-gray-500 text-xs truncate capitalize">{m.role}</p>
                        </div>
                        {isOwner && m.id !== currentUser?.id && (
                          <button 
                            onClick={() => handleRemoveMember(m.id)}
                            className="opacity-0 group-hover:opacity-100 absolute right-3 text-red-400 hover:text-red-300 text-xs bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">Metadata</h3>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-gray-400 text-sm">Created</span>
                  <span className="text-white text-sm font-medium">
                    {team.created_at ? new Date(team.created_at.seconds ? team.created_at.seconds * 1000 : team.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-gray-400 text-sm">Category</span>
                  <span className="text-white text-sm font-medium">{team.category || 'General'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">College</span>
                  <span className="text-white text-sm font-medium truncate max-w-[120px]">{team.college || 'Any'}</span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailsModal;
