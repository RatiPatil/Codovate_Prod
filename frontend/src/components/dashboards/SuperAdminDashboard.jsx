import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  UserCheck, 
  Briefcase, 
  FileText, 
  Award, 
  Rocket, 
  Trophy,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const StatCard = ({ title, value, Icon, trend, linkTo }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => linkTo && navigate(linkTo)}
      className={`bg-[#0A0A10] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[#2015FF]/30 transition-all duration-300 ${linkTo ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-white/5 group-hover:bg-[#2015FF]/10 text-gray-400 group-hover:text-[#2015FF] transition-all">
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-white tracking-tighter mb-1">
        {value.toLocaleString()}
      </div>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</div>
      
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#2015FF]/0 rounded-full blur-2xl group-hover:bg-[#2015FF]/5 transition-colors pointer-events-none" />
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#12121A] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              <p className="text-white text-sm font-bold flex-1">{entry.name}</p>
              <p className="text-white font-black" style={{ color: entry.color }}>{entry.value}</p>
            </div>
          ))}
        </div>
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
    <div className="w-full h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar">
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">
              Command Center
            </h1>
            <p className="text-sm font-medium text-gray-500">
              Global Platform Intelligence Overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold transition-colors">
              Download Report
            </button>
            <button className="px-4 py-2 bg-[#2015FF] hover:bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-[#2015FF]/20 transition-colors">
              Manage System
            </button>
          </div>
        </header>
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Users" value={data.users} Icon={Users} trend={12} linkTo="/super-admin/users" />
          <StatCard title="Students" value={data.students} Icon={GraduationCap} trend={8} linkTo="/super-admin/students" />
          <StatCard title="Colleges" value={data.colleges} Icon={Building2} trend={2} linkTo="/super-admin/colleges" />
          <StatCard title="Companies" value={data.companies} Icon={Briefcase} trend={5} linkTo="/super-admin/companies" />
          <StatCard title="Mentors" value={data.mentors} Icon={UserCheck} trend={15} linkTo="/super-admin/mentors" />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Hackathons" value={data.hackathons} Icon={Trophy} trend={24} linkTo="/super-admin/opportunities" />
          <StatCard title="Jobs & Internships" value={data.jobs + data.internships} Icon={Briefcase} trend={18} linkTo="/super-admin/opportunities" />
          <StatCard title="Applications" value={data.applications} Icon={FileText} trend={45} linkTo="/super-admin/applications" />
          <StatCard title="Projects" value={data.projects} Icon={Rocket} trend={30} linkTo="/super-admin/projects" />
          <StatCard title="Certificates" value={data.certificates} Icon={Award} trend={10} linkTo="/super-admin/certificates" />
        </div>

        {/* Real-time Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0A0A10] border border-white/5 rounded-2xl p-6 relative">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Daily Active Users</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.activeUsers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="uv" name="Active Users" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0A0A10] border border-white/5 rounded-2xl p-6 relative">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Monthly Registrations</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.registrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#666', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                  <Bar dataKey="uv" name="Students" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pv" name="Companies" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
