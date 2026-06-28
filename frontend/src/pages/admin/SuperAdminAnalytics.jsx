import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

const SuperAdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[#2015FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Analytics Overview</h2>
        <p className="text-gray-400 mt-1">Deep dive into platform metrics and historical trends.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: stats.data.users, color: 'text-[#2015FF]' },
          { label: 'Active Projects', value: stats.data.projects, color: 'text-emerald-400' },
          { label: 'Total Applications', value: stats.data.applications, color: 'text-amber-400' },
          { label: 'Certificates Issued', value: stats.data.certificates, color: 'text-purple-400' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[#080812] border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">{kpi.label}</h3>
            <p className={`text-4xl font-black ${kpi.color}`}>{kpi.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Users Trend */}
        <div className="bg-[#080812] border border-white/5 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Active Users (7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.charts.activeUsers}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2015FF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2015FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff50" axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="uv" stroke="#2015FF" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Registrations */}
        <div className="bg-[#080812] border border-white/5 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">New Registrations (Monthly)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts.registrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff50" axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Bar dataKey="pv" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SuperAdminAnalytics;
