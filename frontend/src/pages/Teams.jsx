import { useEffect, useState } from 'react';
import api from '../api/axios';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [formData, setFormData] = useState({ name: '', join_code: '' });
  const [toast, setToast] = useState('');

  useEffect(() => { fetchTeams(); }, []);
  
  const fetchTeams = () => {
    api.get('/teams/my').then(res => setTeams(res.data)).finally(() => setLoading(false));
  };
  
  const showT = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  
  const handleCreate = async (e) => {
    e.preventDefault();
    try { 
      await api.post('/teams', { name: formData.name }); 
      showT('Team Created!'); 
      setShowCreate(false); 
      fetchTeams(); 
    } catch (err) { 
      showT(err.response?.data?.message || 'Error'); 
    }
  };
  
  const handleJoin = async (e) => {
    e.preventDefault();
    try { 
      await api.post('/teams/join', { join_code: formData.join_code }); 
      showT('Joined Successfully!'); 
      setShowJoin(false); 
      fetchTeams(); 
    } catch (err) { 
      showT(err.response?.data?.message || 'Error'); 
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-white relative z-10">
      {toast && (
        <div className="fixed top-4 right-4 glass-panel px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold z-50 animate-[fade-in-down_0.3s_ease-out]">
          {toast}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <span className="text-4xl">🤝</span> <span className="text-gradient">My Teams</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Form squads for hackathons and group projects.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setShowJoin(true)} className="btn-secondary flex-1 md:flex-none">
            Join Team
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex-1 md:flex-none">
            Create Team
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
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
            
            <h2 className="text-xl font-bold group-hover:text-primary transition-colors mb-6 relative z-10">{t.name}</h2>
            
            <div className="mt-auto relative z-10">
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between mb-4 shadow-inner">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Join Code</span>
                <span className="font-mono text-primary font-bold tracking-widest bg-primary/10 px-2 py-1 rounded">{t.join_code}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <p className="text-sm text-gray-300 font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  {t.member_count} members
                </p>
                {t.opportunity_title && (
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20 truncate max-w-[120px]">
                    {t.opportunity_title}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowCreate(false)}></div>
          <form onSubmit={handleCreate} className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl animate-[scale-in_0.2s_ease-out] relative z-10 border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="text-primary">✨</span> Create Team
            </h3>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team Name</label>
            <input required placeholder="e.g. Code Ninjas" className="input-glass w-full mb-8" onChange={e => setFormData({...formData, name: e.target.value})} />
            <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
              <button type="button" onClick={()=>setShowCreate(false)} className="text-gray-400 hover:text-white px-5 py-2 font-semibold text-sm transition-colors rounded-full hover:bg-white/5">Cancel</button>
              <button className="btn-primary">Create</button>
            </div>
          </form>
        </div>
      )}

      {showJoin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowJoin(false)}></div>
          <form onSubmit={handleJoin} className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl animate-[scale-in_0.2s_ease-out] relative z-10 border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="text-primary">🔗</span> Join Team
            </h3>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team Join Code</label>
            <input required placeholder="6-digit Hex Code" className="input-glass w-full font-mono uppercase tracking-widest mb-8" onChange={e => setFormData({...formData, join_code: e.target.value.toUpperCase()})} />
            <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
              <button type="button" onClick={()=>setShowJoin(false)} className="text-gray-400 hover:text-white px-5 py-2 font-semibold text-sm transition-colors rounded-full hover:bg-white/5">Cancel</button>
              <button className="btn-primary">Join Team</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default Teams;
