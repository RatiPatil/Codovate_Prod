import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const MembersModal = ({ team, onClose }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/teams/${team.id}/members`)
      .then(res => setMembers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [team.id]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-xl">{team.name}</h3>
            <p className="text-gray-400 text-sm mt-1">{team.member_count} members</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m, i) => (
              <div key={m.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
                  {m.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{m.name}</p>
                  <p className="text-gray-500 text-xs truncate">{m.email}</p>
                </div>
                {i === 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest shrink-0">Leader</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DiscussionModal = ({ team, onClose, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(() => {
    api.get(`/teams/${team.id}/discussions`)
      .then(res => setMessages(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [team.id]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await api.post(`/teams/${team.id}/discussions`, { message: text });
      setMessages(prev => [...prev, res.data]);
      setText('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 lg:p-10">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl h-[80vh] flex flex-col glass-panel rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
          <div>
            <h3 className="text-white font-bold text-xl flex items-center gap-2">
              <span>💬</span> {team.name}
            </h3>
            <p className="text-gray-400 text-sm mt-1">Team Discussion Board</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
             <div className="flex justify-center py-8">
               <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
             </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((m, idx) => {
              const isMe = m.user_id === currentUser?.uid;
              return (
                <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                    isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white/10 text-gray-200 rounded-bl-sm'
                  }`}>
                    {!isMe && <p className="text-xs font-bold text-gray-400 mb-1">{m.user_name}</p>}
                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 px-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-black/40">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button type="submit" disabled={!text.trim()} className="bg-primary text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const FindTeammates = () => {
  const [filters, setFilters] = useState({ skill: '', domain: '', experience: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDiscover = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/teams/discover?${params}`);
      setResults(res.data);
    } catch (err) {
      console.error("Discover error", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDiscover();
  }, [fetchDiscover]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Sidebar Filters */}
      <div className="w-full lg:w-1/4 glass-panel p-6 rounded-2xl h-fit">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span>🎯</span> Advanced Filters
        </h3>
        
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Skill</label>
            <input 
              placeholder="e.g. React" 
              className="input-glass w-full"
              value={filters.skill}
              onChange={e => setFilters({...filters, skill: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Domain / Goal</label>
            <input 
              placeholder="e.g. Data Science" 
              className="input-glass w-full"
              value={filters.domain}
              onChange={e => setFilters({...filters, domain: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Experience Level</label>
            <select 
              className="input-glass w-full appearance-none"
              value={filters.experience}
              onChange={e => setFilters({...filters, experience: e.target.value})}
            >
              <option value="" className="bg-[#0a0a0a]">All</option>
              <option value="beginner" className="bg-[#0a0a0a]">Beginner</option>
              <option value="intermediate" className="bg-[#0a0a0a]">Intermediate</option>
              <option value="advanced" className="bg-[#0a0a0a]">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="w-full lg:w-3/4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-24 glass-panel rounded-2xl border-dashed">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-400 text-sm">No teammates found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {results.map(user => (
              <div key={user.id} className="glass-card p-5 hover:border-primary/50 transition-all flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg leading-tight">{user.name}</h4>
                    <p className="text-gray-400 text-xs font-medium mt-1">{user.college || 'College not specified'}</p>
                    <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-1">
                      {user.career_goal ? user.career_goal.replace('_', ' ') : 'Open to roles'}
                    </p>
                  </div>
                </div>

                {user.bio && <p className="text-sm text-gray-300 mb-4 line-clamp-2">{user.bio}</p>}

                <div className="mt-auto pt-4 border-t border-white/10">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {user.skills.slice(0, 4).map(s => (
                      <span key={s} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300 whitespace-nowrap">
                        {s}
                      </span>
                    ))}
                    {user.skills.length > 4 && <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-500">+{user.skills.length - 4}</span>}
                  </div>
                  
                  <button className="w-full btn-secondary py-2 text-xs" onClick={() => alert('Connect feature coming soon!')}>
                    Send Invite
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SuggestedMates = ({ myProfile }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const res = await api.get('/teams/discover');
        let students = res.data;
        
        // Smart match score computation (Mock complex algorithm based on shared skills/goals)
        if (myProfile && myProfile.skills) {
          students = students.map(s => {
            let matchScore = 50; // Base score
            const sharedSkills = s.skills.filter(sk => myProfile.skills.includes(sk)).length;
            matchScore += sharedSkills * 10;
            
            if (s.career_goal === myProfile.career_goal) matchScore += 15;
            if (s.college === myProfile.college) matchScore += 10;
            if (s.experience_level === myProfile.experience_level) matchScore += 5;

            return { ...s, matchScore: Math.min(matchScore, 99) };
          });
          students.sort((a, b) => b.matchScore - a.matchScore);
        }

        setResults(students);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggested();
  }, [myProfile]);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">✨</span>
        <p className="text-sm text-primary font-medium">
          These teammates are recommended based on your skills, career goals, and experience level.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.slice(0, 9).map(user => (
          <div key={user.id} className="glass-card p-5 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 bg-green-500/10 text-green-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-green-500/20">
              {user.matchScore || 85}% MATCH
            </div>

            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold border border-white/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-white font-bold text-sm leading-tight">{user.name}</h4>
                <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  {user.career_goal ? user.career_goal.replace('_', ' ') : 'Student'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {user.skills.slice(0, 3).map(s => (
                <span key={s} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300">
                  {s}
                </span>
              ))}
            </div>

            <button className="mt-auto w-full btn-secondary py-2 text-xs" onClick={() => alert('Connect feature coming soon!')}>
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


const Teams = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('my_teams');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [viewMembersTeam, setViewMembersTeam] = useState(null);
  const [discussTeam, setDiscussTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', join_code: '' });
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [leaving, setLeaving] = useState(null);
  const [myProfile, setMyProfile] = useState(null);

  const showT = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const fetchTeams = useCallback(() => {
    api.get('/teams/my').then(res => setTeams(res.data)).finally(() => setLoading(false));
  }, []);

  const fetchProfile = useCallback(() => {
    api.get('/students/profile').then(res => setMyProfile(res.data)).catch(console.error);
  }, []);

  useEffect(() => { 
    fetchTeams(); 
    fetchProfile();
  }, [fetchTeams, fetchProfile]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', { name: formData.name });
      showT('Team created! Share the join code with teammates.', 'success');
      setShowCreate(false);
      setFormData({ name: '', join_code: '' });
      fetchTeams();
    } catch (err) {
      showT(err.response?.data?.message || 'Error creating team.', 'error');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams/join', { join_code: formData.join_code });
      showT('Joined team successfully!', 'success');
      setShowJoin(false);
      setFormData({ name: '', join_code: '' });
      fetchTeams();
    } catch (err) {
      showT(err.response?.data?.message || 'Invalid join code.', 'error');
    }
  };

  const handleLeave = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to leave "${teamName}"?`)) return;
    setLeaving(teamId);
    try {
      await api.delete(`/teams/${teamId}/leave`);
      setTeams(prev => prev.filter(t => t.id !== teamId));
      showT('You have left the team.', 'success');
    } catch (err) {
      showT(err.response?.data?.message || 'Could not leave team.', 'error');
    } finally {
      setLeaving(null);
    }
  };

  const copyJoinCode = (code) => {
    navigator.clipboard.writeText(code);
    showT('Join code copied to clipboard!', 'success');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-white relative z-10">
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 glass-panel px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold ${
          toast.type === 'success' ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'
        }`}>
          {toast.msg}
        </div>
      )}

      {viewMembersTeam && (
        <MembersModal team={viewMembersTeam} onClose={() => setViewMembersTeam(null)} />
      )}

      {discussTeam && (
        <DiscussionModal team={discussTeam} currentUser={currentUser} onClose={() => setDiscussTeam(null)} />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <span className="text-4xl">🤝</span> <span className="text-gradient">Teams & Networking</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Form squads, discover talent, and collaborate on projects.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setShowJoin(true)} className="btn-secondary flex-1 md:flex-none">
            Join Team
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex-1 md:flex-none">
            + Create Team
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 mb-8 overflow-x-auto no-scrollbar relative z-10">
        {[
          { id: 'my_teams', label: 'My Teams', icon: '👥' },
          { id: 'find', label: 'Find Teammates', icon: '🔍' },
          { id: 'suggested', label: 'Suggested for You', icon: '✨' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === tab.id 
                ? 'border-primary text-white bg-primary/5' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <div className="relative z-10">
        {activeTab === 'my_teams' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.length === 0 ? (
              <div className="col-span-full text-center py-24 glass-card border-dashed">
                <p className="text-4xl mb-4">👥</p>
                <p className="text-gray-400 text-sm mb-4">You are not in any teams yet.</p>
                <button onClick={() => setShowJoin(true)} className="btn-primary text-sm inline-block">
                  Join your first team
                </button>
              </div>
            ) : teams.map(t => (
              <div key={t.id} className="glass-card p-6 flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-125" />

                <h2 className="text-xl font-bold group-hover:text-primary transition-colors mb-2 relative z-10">{t.name}</h2>
                {t.opportunity_title && (
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20 self-start mb-4 relative z-10">
                    {t.opportunity_title}
                  </span>
                )}

                <div className="mt-auto relative z-10">
                  <div
                    className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between mb-4 shadow-inner cursor-pointer hover:bg-white/10 transition-all"
                    onClick={() => copyJoinCode(t.join_code)}
                    title="Click to copy join code"
                  >
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Join Code</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary font-bold tracking-widest bg-primary/10 px-2 py-1 rounded">{t.join_code}</span>
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-4">
                    <button
                      onClick={() => setViewMembersTeam(t)}
                      className="text-sm text-gray-300 font-semibold flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      {t.member_count} members
                    </button>
                    <button
                      onClick={() => handleLeave(t.id, t.name)}
                      disabled={leaving === t.id}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    >
                      {leaving === t.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      )}
                      Leave
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setDiscussTeam(t)}
                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    💬 Team Discussion
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'find' && <FindTeammates />}
        
        {activeTab === 'suggested' && <SuggestedMates myProfile={myProfile} />}
      </div>

      {/* Modals for Create/Join */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowCreate(false)} />
          <form onSubmit={handleCreate} className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10 border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="text-primary">✨</span> Create Team
            </h3>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team Name</label>
            <input
              required
              value={formData.name}
              placeholder="e.g. Code Ninjas"
              className="input-glass w-full mb-8"
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
              <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white px-5 py-2 font-semibold text-sm transition-colors rounded-full hover:bg-white/5">Cancel</button>
              <button className="btn-primary">Create</button>
            </div>
          </form>
        </div>
      )}

      {showJoin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowJoin(false)} />
          <form onSubmit={handleJoin} className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10 border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="text-primary">🔗</span> Join Team
            </h3>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team Join Code</label>
            <input
              required
              value={formData.join_code}
              placeholder="6-character Code (e.g. A1B2C3)"
              className="input-glass w-full font-mono uppercase tracking-widest mb-8"
              onChange={e => setFormData({ ...formData, join_code: e.target.value.toUpperCase() })}
            />
            <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
              <button type="button" onClick={() => setShowJoin(false)} className="text-gray-400 hover:text-white px-5 py-2 font-semibold text-sm transition-colors rounded-full hover:bg-white/5">Cancel</button>
              <button className="btn-primary">Join Team</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default Teams;
