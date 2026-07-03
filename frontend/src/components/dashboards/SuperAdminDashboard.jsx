import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const StatCard = ({ title, value, icon, trend }) => (
  <div className="bg-[#080812] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
    <div className="flex justify-between items-start mb-4">
      <div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
      {trend && (
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="text-4xl font-black text-white tracking-tighter mb-1">
      {value.toLocaleString()}
    </div>
    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</div>
    
    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#2015FF]/5 rounded-full blur-2xl group-hover:bg-[#2015FF]/10 transition-colors pointer-events-none" />
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#080812] border border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-white text-sm font-black" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SuperAdminDashboard = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load admin stats", err);
        setLoading(false);
      });

    if (!socket) return;
    
    // Future real-time listeners for all these stats
    socket.emit('join_admin', { role: 'super_admin' });
  }, [socket]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-[#2015FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats?.success) {
    return (
      <div className="p-8 text-red-400">Failed to load statistics.</div>
    );
  }

  const data = stats.data;
  const charts = stats.charts;

  return (
    <div className="w-full">
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-[#2015FF]/15 border border-[#2015FF]/30 flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(32,21,255,0.2)]">⚡</span>
            Command Center
          </h1>
          <p className="text-gray-500 font-medium">Global Codovate Ecosystem Intelligence</p>
        </header>
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard title="Total Users" value={data.users} icon="👥" isLive trend={12} />
          <StatCard title="Students" value={data.students} icon="🎓" trend={8} />
          <StatCard title="Colleges" value={data.colleges} icon="🏛️" trend={2} />
          <StatCard title="Companies" value={data.companies} icon="🏢" trend={5} />
          <StatCard title="Mentors" value={data.mentors} icon="🧑‍🏫" trend={15} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          <StatCard title="Hackathons" value={data.hackathons} icon="🏆" trend={24} />
          <StatCard title="Jobs" value={data.jobs} icon="💼" trend={18} />
          <StatCard title="Applications" value={data.applications} icon="📄" isLive trend={45} />
          <StatCard title="Projects" value={data.projects} icon="🚀" trend={30} />
          <StatCard title="Certificates" value={data.certificates} icon="📜" trend={10} />
        </div>

        {/* Real-time Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#080812] border border-white/5 rounded-3xl p-6 relative">
            <h2 className="text-lg font-bold text-white mb-6">Daily Active Users</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.activeUsers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2015FF" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2015FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="uv" name="Active Users" stroke="#2015FF" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#080812] border border-white/5 rounded-3xl p-6 relative">
            <h2 className="text-lg font-bold text-white mb-6">Monthly Registrations</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.registrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar dataKey="uv" name="Students" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pv" name="Companies" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-[#080812] border border-white/5 rounded-3xl p-6 relative">
          <h2 className="text-lg font-bold text-white mb-6">Revenue & Engagement Trends</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="uv" name="Revenue ($)" stroke="#F59E0B" strokeWidth={3} dot={{r: 4, fill: '#080812', strokeWidth: 2}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="pv" name="Engagement Score" stroke="#EC4899" strokeWidth={3} dot={{r: 4, fill: '#080812', strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
