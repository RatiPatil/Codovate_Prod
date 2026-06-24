import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveToast, setLiveToast] = useState('');
  const { socket } = useSocket();

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, appsRes, oppsRes] = await Promise.all([
        api.get('/students/profile'),
        api.get('/applications/my'),
        api.get('/opportunities'),
      ]);
      setProfile(profileRes.data);
      setApps(appsRes.data);
      setOpps(oppsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for application updates
    socket.on('application_update', (data) => {
      if (data.type === 'new_application') {
        setApps(prev => [data.application, ...prev]);
        showLiveToast(`✅ Applied to ${data.application.title}`);
      }
      if (data.type === 'status_change') {
        setApps(prev => prev.map(a =>
          a.id === data.application_id
            ? { ...a, status: data.status }
            : a
        ));
        showLiveToast(`🔔 Status updated: ${data.status}`);
      }
    });

    // Listen for new opportunities
    socket.on('new_opportunity', (opp) => {
      setOpps(prev => [opp, ...prev]);
      showLiveToast(`🚀 New opportunity: ${opp.title}`);
    });

    return () => {
      socket.off('application_update');
      socket.off('new_opportunity');
    };
  }, [socket]);

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

  return (
    <div className="p-6 md:p-8">
      {/* Live Toast */}
      {liveToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#111] border border-primary/30 text-white px-4 py-3 rounded-xl shadow-2xl text-sm animate-pulse">
          <div className="w-2 h-2 rounded-full bg-primary" />
          {liveToast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {profile?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Your growth dashboard — live & real-time</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-medium">Live</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Applied', value: apps.length, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
          { label: 'Selected', value: selected, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Opportunities', value: opps.length, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Profile', value: `${profile?.profile_completion || 0}%`, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-5 ${s.bg}`}>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Profile completion bar */}
      {profile?.profile_completion < 100 && (
        <div className="mb-6 p-4 bg-primary/8 border border-primary/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-300 font-medium">Profile Completion</p>
            <span className="text-primary text-sm font-bold">{profile?.profile_completion || 0}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${profile?.profile_completion || 0}%` }}
            />
          </div>
          <Link to="/profile" className="text-xs text-primary hover:underline mt-2 inline-block">
            Complete your profile →
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold">Recent Applications</h2>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>
            <Link to="/applications" className="text-primary text-xs hover:underline">View all</Link>
          </div>
          {apps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No applications yet.</p>
              <Link to="/opportunities" className="text-primary text-xs mt-2 inline-block hover:underline">
                Browse opportunities →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.slice(0, 4).map(app => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/8 transition">
                  <div>
                    <p className="text-white text-sm font-medium">{app.title}</p>
                    <p className="text-gray-400 text-xs">{app.company}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    app.status === 'Selected' ? 'bg-green-500/20 text-green-400' :
                    app.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-primary/20 text-primary'
                  }`}>{app.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Opportunities */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold">Latest Opportunities</h2>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
            <Link to="/opportunities" className="text-primary text-xs hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {opps.slice(0, 4).map(opp => (
              <div key={opp.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/8 transition">
                <div>
                  <p className="text-white text-sm font-medium">{opp.title}</p>
                  <p className="text-gray-400 text-xs">{opp.company}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  opp.type === 'Internship' ? 'bg-blue-500/20 text-blue-400' :
                  opp.type === 'Hackathon' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>{opp.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;