import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

const calculateMatchScore = (opp, profileSkills) => {
  if (!profileSkills || profileSkills.length === 0) return 60;
  if (!opp.skills_required || opp.skills_required.length === 0) return 80;
  
  const oppSkills = opp.skills_required.map(s => s.toLowerCase());
  const mySkills = profileSkills.map(s => s.toLowerCase());
  
  const matches = oppSkills.filter(s => mySkills.includes(s));
  if (oppSkills.length === 0) return 80;
  
  const matchPercentage = (matches.length / oppSkills.length) * 100;
  return Math.floor(50 + (matchPercentage / 2));
};

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);
  const [opps, setOpps] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveToast, setLiveToast] = useState('');
  const { socket } = useSocket();

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, appsRes, oppsRes, activityRes] = await Promise.all([
        api.get('/students/profile'),
        api.get('/applications/my'),
        api.get('/opportunities'),
        api.get('/students/activity').catch(() => ({ data: [] }))
      ]);
      setProfile(profileRes.data);
      setApps(appsRes.data);
      setOpps(oppsRes.data);
      setActivity(activityRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!socket) return;
    socket.on('application_update', (data) => {
      if (data.type === 'new_application') {
        setApps(prev => [data.application, ...prev]);
        showLiveToast(`✅ Applied to ${data.application.title}`);
        fetchAll(); // Refresh activity
      }
      if (data.type === 'status_change') {
        setApps(prev => prev.map(a =>
          a.id === data.application_id ? { ...a, status: data.status } : a
        ));
        showLiveToast(`🔔 Status updated: ${data.status}`);
      }
    });
    socket.on('new_opportunity', (opp) => {
      setOpps(prev => [opp, ...prev]);
      showLiveToast(`🚀 New opportunity: ${opp.title}`);
    });
    return () => {
      socket.off('application_update');
      socket.off('new_opportunity');
    };
  }, [socket, fetchAll]);

  const showLiveToast = (msg) => {
    setLiveToast(msg);
    setTimeout(() => setLiveToast(''), 4000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const selected = apps.filter(a => a.status === 'Selected').length;

  // Profile Action Items computation
  const getMissingProfileItems = () => {
    if (!profile) return [];
    const items = [];
    if (!profile.bio) items.push({ label: 'Add a short bio', boost: 10 });
    if (!profile.college) items.push({ label: 'Add your college', boost: 15 });
    if (!profile.skills || profile.skills.length === 0) items.push({ label: 'Add your top skills', boost: 20 });
    if (!profile.github) items.push({ label: 'Link GitHub profile', boost: 10 });
    if (!profile.linkedin) items.push({ label: 'Link LinkedIn profile', boost: 10 });
    return items;
  };
  const missingItems = getMissingProfileItems();

  const getStatusColor = (status) => {
    if (status === 'Selected') return 'bg-green-500';
    if (status === 'Rejected') return 'bg-red-500';
    if (status === 'Under Review') return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto relative z-10">
      {liveToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 glass-panel px-4 py-3 rounded-xl shadow-2xl text-sm animate-pulse">
          <div className="w-2 h-2 rounded-full bg-primary" />
          {liveToast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {getGreeting()}, <span className="text-gradient">{profile?.name?.split(' ')[0] || 'Student'}</span> 👋
          </h1>
          <p className="text-gray-400 text-sm mt-2">Here is what's happening with your profile today.</p>
        </div>
      </div>

      {/* Quick Access Shortcuts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Find Opportunities', icon: '🔍', to: '/opportunities', color: 'from-blue-500/20 to-primary/20 hover:border-primary/50' },
          { label: 'Build Resume', icon: '📄', to: '/resume', color: 'from-purple-500/20 to-pink-500/20 hover:border-purple-500/50' },
          { label: 'Find Teammates', icon: '🤝', to: '/teams', color: 'from-green-500/20 to-emerald-500/20 hover:border-green-500/50' },
          { label: 'Book Mentor', icon: '🎓', to: '/mentors', color: 'from-orange-500/20 to-amber-500/20 hover:border-orange-500/50' }
        ].map((shortcut, idx) => (
          <Link 
            key={idx} 
            to={shortcut.to}
            className={`glass-card p-4 flex items-center gap-3 border border-white/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${shortcut.color}`}
          >
            <span className="text-2xl">{shortcut.icon}</span>
            <span className="text-white font-semibold text-sm">{shortcut.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column (Stats & Timeline) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Applied', value: apps.length, color: 'text-primary', glow: 'hover:shadow-[0_0_20px_rgba(32,21,255,0.2)]' },
              { label: 'Selected', value: selected, color: 'text-green-400', glow: 'hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]' },
              { label: 'Opportunities', value: opps.length, color: 'text-yellow-400', glow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]' },
              { label: 'Profile', value: `${profile?.profile_completion || 0}%`, color: 'text-purple-400', glow: 'hover:shadow-[0_0_20px_rgba(192,132,252,0.2)]' },
            ].map(s => (
              <div key={s.label} className={`glass-card p-5 ${s.glow}`}>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">{s.label}</p>
                <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Application Timeline */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-[60px]" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-white font-bold text-xl flex items-center gap-2">
                  <span className="text-2xl">📍</span> Active Applications
                </h2>
                <Link to="/applications" className="text-primary text-xs font-semibold hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">
                  All
                </Link>
              </div>
              
              {apps.length === 0 ? (
                <div className="text-center py-12 glass-card border-dashed">
                  <p className="text-gray-400 text-sm">No applications yet.</p>
                  <Link to="/opportunities" className="btn-primary inline-block mt-4 text-sm">
                    Browse opportunities
                  </Link>
                </div>
              ) : (
                <div className="relative border-l-2 border-white/10 ml-3 space-y-8 my-4">
                  {apps.slice(0, 4).map((app, idx) => (
                    <div key={app.id} className="relative pl-6 group">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-[#0a0a0a] ${getStatusColor(app.status)} shadow-[0_0_10px_currentColor] transition-transform group-hover:scale-125`} />
                      
                      <div className="glass-card p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <h3 className="text-white font-bold text-sm group-hover:text-primary transition-colors">{app.title}</h3>
                            <p className="text-gray-400 text-xs mt-1">{app.company}</p>
                          </div>
                          <span className={`text-[10px] px-3 py-1 rounded-full font-bold shadow-sm whitespace-nowrap backdrop-blur-sm ${
                            app.status === 'Selected' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            app.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            app.status === 'Under Review' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-primary/10 text-primary border border-primary/20'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Feed */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-white font-bold text-xl flex items-center gap-2">
                  <span className="text-2xl">⚡</span> Recent Activity
                </h2>
              </div>
              
              {activity.length === 0 ? (
                <div className="text-center py-12 glass-card border-dashed">
                  <p className="text-gray-400 text-sm">No recent activity.</p>
                </div>
              ) : (
                <div className="space-y-4 relative z-10">
                  {activity.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-sm">
                        {act.icon || '📌'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-300">
                          {act.title}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                          {new Date(act.time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Profile & Skills) */}
        <div className="space-y-6">
          
          {/* Enhanced Profile Tracker */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            
            <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2 relative z-10">
              <span className="text-2xl">🎯</span> Profile Tracker
            </h2>
            
            <div className="mb-6 relative z-10">
              <div className="flex items-end justify-between mb-3">
                <span className="text-5xl font-black text-white tracking-tighter">{profile?.profile_completion || 0}<span className="text-2xl text-gray-500 ml-1">%</span></span>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">Completion</span>
              </div>
              <div className="h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(32,21,255,0.5)]"
                  style={{ width: `${profile?.profile_completion || 0}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                </div>
              </div>
            </div>

            {profile?.profile_completion < 100 ? (
              <div className="space-y-2 mt-6 relative z-10">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Action Items to 100%</p>
                {missingItems.map((item, idx) => (
                  <Link to="/profile" key={idx} className="flex items-center justify-between p-3.5 rounded-xl glass-card border-transparent hover:border-white/10 group/item">
                    <span className="text-gray-300 text-sm font-medium group-hover/item:text-white transition-colors">{item.label}</span>
                    <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg">+{item.boost}%</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-5 glass-panel bg-green-500/5 border-green-500/20 rounded-xl text-center mt-6 relative z-10">
                <p className="text-green-400 font-bold text-lg mb-1">🎉 You're all set!</p>
                <p className="text-gray-400 text-sm">Your profile is 100% complete.</p>
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] pointer-events-none" />
            <div className="flex items-center justify-between mb-5 relative z-10">
              <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <span className="text-2xl">🤖</span> AI Recommended
              </h2>
            </div>

            {opps.length === 0 ? (
              <div className="text-center py-8 glass-card border-dashed">
                <p className="text-gray-400 text-sm">No new opportunities available.</p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                {opps.slice(0, 3).map((opp, idx) => {
                  const matchScore = calculateMatchScore(opp, profile?.skills || []);
                  return (
                    <div key={idx} className="glass-card p-4 hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-bold text-sm leading-tight">{opp.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${
                          matchScore >= 80 ? 'text-green-400 bg-green-500/10 border border-green-500/20' :
                          matchScore >= 60 ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' :
                          'text-gray-400 bg-gray-500/10 border border-gray-500/20'
                        }`}>
                          {matchScore}% Match
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs font-medium mb-3">{opp.company}</p>
                      <Link to="/opportunities" className="text-[11px] font-bold text-primary uppercase tracking-widest hover:underline">
                        View Details →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;