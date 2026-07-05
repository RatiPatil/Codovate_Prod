import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

import { formatDate, formatDateTime, parseDate } from '../utils/dateUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : (n ?? 0);
const fmtDate = (iso) => formatDate(iso, { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (iso) => formatDateTime(iso, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// ─── Toast ────────────────────────────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
  return { toast, show };
};

// ─── Shared UI Components ─────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon, color, sub, trend }) => (
  <div className="relative bg-[#080812] border border-white/5 rounded-2xl p-5 overflow-hidden group hover:border-[#2015FF]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(32,21,255,0.1)]">
    <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: color }} />
    <div className="flex items-start justify-between mb-3 relative z-10">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        {icon}
      </div>
      {trend !== undefined && (
        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${trend >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-3xl font-black text-white tracking-tight">{fmt(value)}</p>
      <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mt-1">{label}</p>
      {sub && <p className="text-gray-600 text-[10px] mt-1">{sub}</p>}
    </div>
  </div>
);

const Badge = ({ children, color = 'blue' }) => {
  const colors = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    blue: 'bg-[#2015FF]/10 text-[#6060FF] border-[#2015FF]/20',
    gray: 'bg-white/5 text-gray-400 border-white/10',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a1a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] text-gray-400 font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white font-black text-sm">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const DataTable = ({ columns, rows, loading, emptyMsg = 'No data found', colSpan }) => (
  <div className="bg-[#080812] border border-white/5 rounded-2xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left whitespace-nowrap">
        <thead>
          <tr className="border-b border-white/5">
            {columns.map(c => (
              <th key={c} className="px-5 py-3.5 text-[9px] font-black text-gray-500 uppercase tracking-widest">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <tr key={i} className="border-b border-white/5">
                <td colSpan={colSpan || columns.length} className="px-5 py-4">
                  <div className="h-4 bg-white/5 rounded animate-pulse" />
                </td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr><td colSpan={colSpan || columns.length} className="text-center py-16 text-gray-600 text-sm">{emptyMsg}</td></tr>
          ) : rows}
        </tbody>
      </table>
    </div>
  </div>
);

const ActionBtn = ({ onClick, label, color = 'blue', disabled }) => {
  const colors = {
    blue: 'bg-[#2015FF]/10 text-[#6060FF] border-[#2015FF]/20 hover:bg-[#2015FF] hover:text-white',
    green: 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-white',
    red: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500 hover:text-white',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500 hover:text-white',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${colors[color]} disabled:opacity-40`}>
      {label}
    </button>
  );
};

const ComingSoonBadge = () => (
  <div className="ml-auto">
    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">SOON</span>
  </div>
);

// ─── INPUT / FORM HELPERS ─────────────────────────────────────────────────────
const InputField = ({ label, value, onChange, placeholder, type = 'text', required }) => (
  <div>
    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">{label}</label>
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
      className="w-full bg-[#0d0d1a] border border-white/5 rounded-xl py-3 px-4 text-white text-sm placeholder-gray-600 focus:border-[#2015FF]/50 focus:outline-none transition-all"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">{label}</label>
    <select value={value} onChange={onChange}
      className="w-full bg-[#0d0d1a] border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:border-[#2015FF]/50 focus:outline-none [&>option]:bg-[#0d0d1a]">
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. OVERVIEW PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const OverviewPage = ({ stats, regData, appData, activity, loading }) => {
  const KPI_CONFIG = [
    { key: 'totalUsers',         label: 'Total Users',       icon: '👥', color: '#2015FF', trend: 12 },
    { key: 'totalStudents',      label: 'Students',          icon: '🎓', color: '#10B981', trend: 8 },
    { key: 'totalOpportunities', label: 'Opportunities',     icon: '🔍', color: '#F59E0B', trend: 5 },
    { key: 'totalApplications',  label: 'Applications',      icon: '📋', color: '#8B5CF6', trend: 15 },
    { key: 'totalTeams',         label: 'Teams',             icon: '🤝', color: '#EC4899', trend: 3 },
    { key: 'totalMentors',       label: 'Mentors',           icon: '🧑‍🏫', color: '#06B6D4', trend: 2 },
    { key: 'newUsersToday',      label: 'New Today',         icon: '✨', color: '#2015FF', sub: 'Last 24 hrs' },
    { key: 'newAppsThisWeek',    label: 'Apps This Week',    icon: '📈', color: '#10B981', sub: 'Last 7 days' },
    { key: 'totalAuditEvents',   label: 'Admin Actions',     icon: '📜', color: '#6B7280' },
  ];

  const DISTRICT_DATA = [
    { name: 'Solapur', students: 124 }, { name: 'Pandharpur', students: 98 },
    { name: 'Latur', students: 67 }, { name: 'Satara', students: 45 }, { name: 'Kolhapur', students: 38 },
  ];

  const PIE_COLORS = ['#2015FF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-8">
      {/* KPI */}
      <div>
        <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Platform KPIs — Live</p>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(9)].map((_, i) => <div key={i} className="bg-[#080812] border border-white/5 rounded-2xl p-5 h-28 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {KPI_CONFIG.map(k => <KpiCard key={k.key} label={k.label} value={stats[k.key]} icon={k.icon} color={k.color} sub={k.sub} trend={k.trend} />)}
          </div>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="text-sm font-black text-white">New Registrations</h3><p className="text-gray-500 text-xs">Last 30 days</p></div>
            <Badge color="blue">Live</Badge>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={regData}>
              <defs>
                <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2015FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2015FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" tick={{ fill: '#4B5563', fontSize: 9 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: '#4B5563', fontSize: 9 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="count" name="Registrations" stroke="#2015FF" strokeWidth={2} fill="url(#rg1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="text-sm font-black text-white">Applications Submitted</h3><p className="text-gray-500 text-xs">Last 30 days</p></div>
            <Badge color="green">Live</Badge>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={appData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" tick={{ fill: '#4B5563', fontSize: 9 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: '#4B5563', fontSize: 9 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Applications" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* District Distribution */}
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white mb-5">District-wise Users</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={DISTRICT_DATA} dataKey="students" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {DISTRICT_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Skills */}
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6 col-span-1 xl:col-span-2">
          <h3 className="text-sm font-black text-white mb-5">Top Skills on Platform</h3>
          <div className="space-y-3">
            {[
              { skill: 'Python', pct: 78 }, { skill: 'JavaScript', pct: 65 },
              { skill: 'React', pct: 52 }, { skill: 'Machine Learning', pct: 44 },
              { skill: 'Java', pct: 38 }, { skill: 'Node.js', pct: 31 },
            ].map(s => (
              <div key={s.skill} className="flex items-center gap-3">
                <span className="text-gray-400 text-xs w-28 shrink-0">{s.skill}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2015FF] rounded-full transition-all" style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-gray-500 text-[10px] font-bold w-8 text-right">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-white">Live Activity Feed</h3>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-bold">Real-time</span>
          </div>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-hide">
          {activity.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No recent activity</p>
          ) : activity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-base shrink-0">{a.icon}</div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{a.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge color="gray">{a.subtitle}</Badge>
                  <span className="text-gray-600 text-[10px]">{fmtTime(a.time)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ANALYTICS CENTER
// ═══════════════════════════════════════════════════════════════════════════════
const AnalyticsPage = ({ regData, appData }) => {
  const INVESTOR_METRICS = [
    { label: 'DAU', value: 'N/A', icon: '📊', color: '#2015FF', sub: 'Daily Active Users' },
    { label: 'MAU', value: 'N/A', icon: '📅', color: '#10B981', sub: 'Monthly Active Users' },
    { label: 'Retention', value: 'N/A', icon: '🔄', color: '#F59E0B', sub: 'D30 Retention' },
    { label: 'Placements', value: 'N/A', icon: '🏆', color: '#8B5CF6', sub: 'Total placed' },
  ];
  const DISTRICT_DATA = [
    { name: 'Solapur', students: 124, applications: 87 },
    { name: 'Pandharpur', students: 98, applications: 65 },
    { name: 'Latur', students: 67, applications: 42 },
    { name: 'Satara', students: 45, applications: 28 },
    { name: 'Kolhapur', students: 38, applications: 21 },
  ];
  const TOP_COLLEGES = [
    { name: 'SVERI College of Engineering', students: 45, apps: 32 },
    { name: 'Solapur University', students: 38, apps: 24 },
    { name: 'BSIET Solapur', students: 28, apps: 18 },
    { name: 'MIT College Pune', students: 22, apps: 15 },
    { name: 'VIT Vellore', students: 18, apps: 12 },
  ];

  return (
    <div className="space-y-8">
      {/* Investor Metrics */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-black text-white">Investor Dashboard</h2>
          <Badge color="purple">Internal</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {INVESTOR_METRICS.map(m => <KpiCard key={m.label} label={m.label} value={m.value} icon={m.icon} color={m.color} sub={m.sub} />)}
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white mb-5">Registration Trend — 30 Days</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={regData}>
              <defs>
                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2015FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2015FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" tick={{ fill: '#4B5563', fontSize: 9 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: '#4B5563', fontSize: 9 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="count" name="Users" stroke="#2015FF" strokeWidth={2} fill="url(#ag1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white mb-5">Application Trend — 30 Days</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={appData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" tick={{ fill: '#4B5563', fontSize: 9 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: '#4B5563', fontSize: 9 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Applications" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Analytics */}
      <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-black text-white mb-5">District Analytics — Maharashtra</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={DISTRICT_DATA} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis type="number" tick={{ fill: '#4B5563', fontSize: 9 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#9CA3AF', fontSize: 10 }} width={90} />
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Bar dataKey="students" name="Students" fill="#2015FF" radius={[0, 4, 4, 0]} maxBarSize={14} />
            <Bar dataKey="applications" name="Applications" fill="#10B981" radius={[0, 4, 4, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Colleges */}
      <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-black text-white mb-5">Top Colleges by Activity</h3>
        <div className="space-y-3">
          {TOP_COLLEGES.map((c, i) => (
            <div key={c.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/3 transition-colors">
              <span className="text-[#2015FF] font-black text-sm w-5">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold truncate">{c.name}</p>
                <div className="flex gap-3 mt-1">
                  <Badge color="blue">{c.students} students</Badge>
                  <Badge color="green">{c.apps} applications</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
const UsersPage = ({ showToast }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const { socket } = useSocket();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      params.set('limit', '100');
      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  }, [roleFilter, statusFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (!socket) return;
    socket.on('admin_user_updated', ({ id, is_active }) => setUsers(p => p.map(u => u.id === id ? { ...u, is_active } : u)));
    socket.on('admin_user_deleted', ({ id }) => setUsers(p => p.filter(u => u.id !== id)));
    return () => { socket.off('admin_user_updated'); socket.off('admin_user_deleted'); };
  }, [socket]);

  const handleStatus = async (userId, isActive) => {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/status`, { is_active: !isActive });
      showToast(`User ${!isActive ? 'activated' : 'suspended'}`);
    } catch { showToast('Action failed', 'error'); setActionLoading(null); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id, email) => {
    if (!confirm(`Delete ${email}?`)) return;
    setActionLoading(id);
    try { await api.delete(`/admin/users/${id}`); showToast('Deleted'); }
    catch { showToast(e?.response?.data?.message || 'Failed', 'error'); setActionLoading(null); }
  };

  const roleColor = r => ({ student: 'blue', mentor: 'green', admin: 'yellow', super_admin: 'red' }[r] || 'gray');

  return (
    <div>
      <SectionHeader title="User Management" subtitle={`${users.length} users`}
        action={<ActionBtn onClick={fetchUsers} label="↻ Refresh" color="blue" />} />
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
            className="w-full bg-[#080812] border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-white text-xs placeholder-gray-600 focus:border-[#2015FF]/50 focus:outline-none" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-[#080812] border border-white/5 rounded-xl py-2.5 px-4 text-gray-400 text-xs focus:outline-none [&>option]:bg-[#080812]">
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="mentor">Mentors</option>
          <option value="admin">Admins</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#080812] border border-white/5 rounded-xl py-2.5 px-4 text-gray-400 text-xs focus:outline-none [&>option]:bg-[#080812]">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <DataTable
        columns={['User', 'Role', 'Status', 'Joined', 'Actions']}
        loading={loading}
        rows={users.map(u => (
          <tr key={u.id} className={`border-b border-white/3 hover:bg-white/2 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#2015FF]/15 border border-[#2015FF]/20 flex items-center justify-center text-[#6060FF] font-black text-xs shrink-0">
                  {u.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{u.name || '—'}</p>
                  <p className="text-gray-500 text-[10px]">{u.email}</p>
                </div>
              </div>
            </td>
            <td className="px-5 py-3.5"><Badge color={roleColor(u.role)}>{u.role?.replace('_', ' ')}</Badge></td>
            <td className="px-5 py-3.5"><Badge color={u.is_active ? 'green' : 'red'}>{u.is_active ? 'Active' : 'Suspended'}</Badge></td>
            <td className="px-5 py-3.5 text-gray-500 text-[11px] font-mono">{fmtDate(u.created_at)}</td>
            <td className="px-5 py-3.5">
              <div className="flex gap-2">
                <ActionBtn onClick={() => handleStatus(u.id, u.is_active)} label={actionLoading === u.id ? '...' : u.is_active ? 'Suspend' : 'Activate'}
                  color={u.is_active ? 'yellow' : 'green'} disabled={actionLoading === u.id} />
                <ActionBtn onClick={() => handleDelete(u.id, u.email)} label="Delete" color="red" disabled={actionLoading === u.id} />
              </div>
            </td>
          </tr>
        ))}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. OPPORTUNITY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
const OpportunitiesPage = ({ showToast }) => {
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actLoading, setActLoading] = useState(null);

  useEffect(() => {
    api.get('/admin/opportunities').then(r => setOpps(r.data)).finally(() => setLoading(false));
  }, []);

  const update = async (id, payload) => {
    setActLoading(id);
    try { await api.put(`/admin/opportunities/${id}/status`, payload); setOpps(p => p.map(o => o.id === id ? { ...o, ...payload } : o)); showToast('Updated'); }
    catch { showToast('Failed', 'error'); }
    finally { setActLoading(null); }
  };

  const del = async (id) => {
    if (!confirm('Delete this opportunity?')) return;
    setActLoading(id);
    try { await api.delete(`/opportunities/${id}`); setOpps(p => p.filter(o => o.id !== id)); showToast('Deleted'); }
    catch { showToast('Failed', 'error'); setActLoading(null); }
  };

  const typeColor = { Internship: 'blue', Hackathon: 'yellow', Job: 'green', Competition: 'red', Scholarship: 'cyan' };

  return (
    <div>
      <SectionHeader title="Opportunity Management" subtitle={`${opps.length} listings`}
        action={<ActionBtn onClick={() => setShowModal(true)} label="+ New Opportunity" color="blue" />} />
      <DataTable
        columns={['Opportunity', 'Type', 'Mode', 'Apps', 'Status', 'Featured', 'Actions']}
        loading={loading}
        rows={opps.map(o => (
          <tr key={o.id} className="border-b border-white/3 hover:bg-white/2">
            <td className="px-5 py-3.5">
              <p className="text-white text-xs font-bold">{o.title}</p>
              <p className="text-[#6060FF] text-[10px] font-bold uppercase tracking-wide">{o.company}</p>
            </td>
            <td className="px-5 py-3.5"><Badge color={typeColor[o.type] || 'gray'}>{o.type}</Badge></td>
            <td className="px-5 py-3.5"><Badge color="gray">{o.mode || 'Online'}</Badge></td>
            <td className="px-5 py-3.5 text-white font-black text-sm">{o.applications_count || 0}</td>
            <td className="px-5 py-3.5"><Badge color={o.admin_status === 'rejected' ? 'red' : 'green'}>{o.admin_status || 'approved'}</Badge></td>
            <td className="px-5 py-3.5">
              <button onClick={() => update(o.id, { is_featured: !o.is_featured })} disabled={actLoading === o.id}
                className={`text-xl transition-all ${o.is_featured ? 'opacity-100' : 'opacity-20 hover:opacity-60'}`}>⭐</button>
            </td>
            <td className="px-5 py-3.5">
              <div className="flex gap-2">
                <ActionBtn onClick={() => update(o.id, { admin_status: o.admin_status === 'rejected' ? 'approved' : 'rejected' })}
                  label={actLoading === o.id ? '...' : o.admin_status === 'rejected' ? 'Approve' : 'Reject'}
                  color={o.admin_status === 'rejected' ? 'green' : 'yellow'} disabled={actLoading === o.id} />
                <ActionBtn onClick={() => del(o.id)} label="Delete" color="red" disabled={actLoading === o.id} />
              </div>
            </td>
          </tr>
        ))}
      />
      {showModal && <OppFormModal onClose={() => setShowModal(false)} showToast={showToast} onCreated={o => setOpps(p => [o, ...p])} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. APPLICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const ApplicationsPage = ({ showToast }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => { api.get('/applications').then(r => setApps(r.data)).finally(() => setLoading(false)); }, []);

  const update = async (id, status) => {
    try { await api.put(`/applications/${id}/status`, { status }); setApps(p => p.map(a => a.id === id ? { ...a, status } : a)); showToast(`→ ${status}`); }
    catch { showToast('Failed', 'error'); }
  };

  const sc = { Applied: 'blue', 'Under Review': 'yellow', Selected: 'green', Rejected: 'red' };

  return (
    <div>
      <SectionHeader title="Applications" subtitle={`${apps.length} total`} />
      <DataTable
        columns={['Student', 'Opportunity', 'Status', 'Change Status', 'Action']}
        loading={loading}
        rows={apps.map(a => (
          <tr key={a.id} className="border-b border-white/3 hover:bg-white/2">
            <td className="px-5 py-3.5">
              <p className="text-white text-xs font-bold">{a.student_name}</p>
              <p className="text-gray-500 text-[10px]">{a.student_email}</p>
            </td>
            <td className="px-5 py-3.5">
              <p className="text-white text-xs font-semibold">{a.opportunity_title}</p>
              <p className="text-[#6060FF] text-[10px] font-bold">{a.company}</p>
            </td>
            <td className="px-5 py-3.5"><Badge color={sc[a.status] || 'gray'}>{a.status}</Badge></td>
            <td className="px-5 py-3.5">
              <select value={a.status} onChange={e => update(a.id, e.target.value)}
                className="bg-[#0d0d1a] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-gray-300 focus:outline-none [&>option]:bg-[#0d0d1a]">
                {['Applied', 'Under Review', 'Selected', 'Rejected'].map(s => <option key={s}>{s}</option>)}
              </select>
            </td>
            <td className="px-5 py-3.5">
              <ActionBtn onClick={() => setSelectedApp(a)} label="👁️ View" color="blue" />
            </td>
          </tr>
        ))}
      />

      {selectedApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setSelectedApp(null)} />
          <div className="bg-[#080812] border border-white/10 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>📄</span> Application Details
              </h2>
              <button onClick={() => setSelectedApp(null)} className="w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:text-white flex items-center justify-center text-sm">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Applicant</p>
                <p className="text-white font-bold">{selectedApp.student_name}</p>
                <p className="text-gray-400 text-sm">{selectedApp.student_email}</p>
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Opportunity</p>
                <p className="text-white font-bold">{selectedApp.opportunity_title}</p>
                <p className="text-[#6060FF] text-sm font-semibold">{selectedApp.company}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Applied Date</p>
                  <p className="text-white text-sm font-bold">
                    {formatDate(selectedApp.applied_at || selectedApp.created_at, {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status</p>
                  <Badge color={sc[selectedApp.status] || 'gray'}>{selectedApp.status}</Badge>
                </div>
              </div>
              
              {selectedApp.answers && Object.keys(selectedApp.answers).length > 0 && (
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Custom Answers</p>
                  <div className="space-y-3">
                    {Object.entries(selectedApp.answers).map(([q, a]) => (
                      <div key={q}>
                        <p className="text-gray-300 text-xs mb-1 font-semibold">{q}</p>
                        <p className="text-white text-sm bg-black/30 p-3 rounded-lg border border-white/5">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. COLLEGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
const CollegesPage = ({ showToast }) => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/colleges').then(r => setColleges(r.data)).catch(() => showToast('Failed to load colleges', 'error')).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <SectionHeader title="College Management" subtitle="All registered colleges" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Colleges', value: colleges.length, icon: '🏛️', color: '#2015FF' },
          { label: 'Total Students', value: colleges.reduce((a, c) => a + (c.students || 0), 0), icon: '🎓', color: '#10B981' },
          { label: 'Total Placements', value: colleges.reduce((a, c) => a + (c.placements || 0), 0), icon: '💼', color: '#F59E0B' },
          { label: 'Total Projects', value: colleges.reduce((a, c) => a + (c.projects || 0), 0), icon: '🚀', color: '#8B5CF6' },
          { label: 'Certificates', value: colleges.reduce((a, c) => a + (c.certs || 0), 0), icon: '📜', color: '#EC4899' },
        ].map(k => <KpiCard key={k.label} {...k} />)}
      </div>
      <DataTable
        columns={['College', 'District', 'Students', 'Participation', 'Placements', 'Projects', 'Certs']}
        loading={loading}
        rows={colleges.map(c => (
          <tr key={c.id} className="border-b border-white/3 hover:bg-white/2">
            <td className="px-5 py-3.5"><p className="text-white text-xs font-bold">{c.name}</p></td>
            <td className="px-5 py-3.5"><Badge color="gray">{c.district}</Badge></td>
            <td className="px-5 py-3.5 text-white font-black text-sm">{c.students}</td>
            <td className="px-5 py-3.5 text-white font-bold text-sm">{c.participation}</td>
            <td className="px-5 py-3.5 text-green-400 font-black text-sm">{c.placements}</td>
            <td className="px-5 py-3.5 text-purple-400 font-black text-sm">{c.projects}</td>
            <td className="px-5 py-3.5 text-yellow-400 font-black text-sm">{c.certs}</td>
          </tr>
        ))}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. COMPANY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
const CompaniesPage = ({ showToast }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/companies').then(r => setCompanies(r.data)).catch(() => showToast('Failed to load companies', 'error')).finally(() => setLoading(false));
  }, []);

  const toggle = async (id, status) => {
    setActLoading(id);
    try {
      await api.put(`/companies/${id}/status`, { status });
      setCompanies(p => p.map(c => c.id === id ? { ...c, status } : c));
      showToast(`Company status updated to ${status}`);
    } catch { showToast('Failed to update status', 'error'); }
    finally { setActLoading(null); }
  };

  return (
    <div>
      <SectionHeader 
        title="Company Management" 
        subtitle="Manage recruiters & companies" 
        action={<ActionBtn onClick={() => setShowModal(true)} label="+ Post Job" color="blue" />} 
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Companies', value: companies.length, icon: '🏢', color: '#2015FF' },
          { label: 'Active Jobs', value: companies.reduce((a, c) => a + (c.jobs || 0), 0), icon: '💼', color: '#10B981' },
          { label: 'Internships', value: companies.reduce((a, c) => a + (c.internships || 0), 0), icon: '🎓', color: '#F59E0B' },
          { label: 'Total Hirings', value: companies.reduce((a, c) => a + (c.hiring || 0), 0), icon: '🏆', color: '#8B5CF6' },
        ].map(k => <KpiCard key={k.label} {...k} />)}
      </div>
      <DataTable
        columns={['Company', 'Status', 'Jobs', 'Internships', 'Applications', 'Hirings', 'Actions']}
        loading={loading}
        rows={companies.map(c => (
          <tr key={c.id} className="border-b border-white/3 hover:bg-white/2">
            <td className="px-5 py-3.5"><p className="text-white text-xs font-bold">{c.name}</p></td>
            <td className="px-5 py-3.5">
              <Badge color={c.status === 'approved' ? 'green' : c.status === 'rejected' ? 'red' : 'yellow'}>{c.status}</Badge>
            </td>
            <td className="px-5 py-3.5 text-white font-bold text-sm">{c.jobs}</td>
            <td className="px-5 py-3.5 text-white font-bold text-sm">{c.internships}</td>
            <td className="px-5 py-3.5 text-white font-bold text-sm">{c.applications}</td>
            <td className="px-5 py-3.5 text-green-400 font-black text-sm">{c.hiring}</td>
            <td className="px-5 py-3.5">
              <div className="flex gap-2">
                {c.status !== 'approved' && <ActionBtn onClick={() => toggle(c.id, 'approved')} disabled={actLoading === c.id} label="Approve" color="green" />}
                {c.status !== 'rejected' && <ActionBtn onClick={() => toggle(c.id, 'rejected')} disabled={actLoading === c.id} label="Reject" color="red" />}
              </div>
            </td>
          </tr>
        ))}
      />
      {showModal && <OppFormModal onClose={() => setShowModal(false)} showToast={showToast} onCreated={() => {}} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. MENTOR MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
const MentorsPage = ({ showToast }) => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mentors').then(r => setMentors(r.data || [])).catch(() => setMentors([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <SectionHeader title="Mentor Management" subtitle={`${mentors.length} mentors registered`} />
      {mentors.length === 0 && !loading ? (
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🧑‍🏫</div>
          <p className="text-white font-black text-lg mb-2">No Mentors Yet</p>
          <p className="text-gray-500 text-sm">Mentor profiles will appear here as they register on the platform.</p>
        </div>
      ) : (
        <DataTable
          columns={['Mentor', 'Expertise', 'Status', 'Actions']}
          loading={loading}
          rows={mentors.map(m => (
            <tr key={m.id} className="border-b border-white/3 hover:bg-white/2">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-500/15 border border-green-500/20 flex items-center justify-center text-green-400 font-black text-xs shrink-0">
                    {m.name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">{m.name}</p>
                    <p className="text-gray-500 text-[10px]">{m.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5"><Badge color="green">{m.expertise || 'General'}</Badge></td>
              <td className="px-5 py-3.5"><Badge color={m.is_active ? 'green' : 'red'}>{m.is_active ? 'Active' : 'Inactive'}</Badge></td>
              <td className="px-5 py-3.5">
                <ActionBtn onClick={() => showToast('Feature coming in Phase 2')} label="View Profile" color="blue" />
              </td>
            </tr>
          ))}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 9. PROJECTS MODERATION
// ═══════════════════════════════════════════════════════════════════════════════
const ProjectsPage = ({ showToast }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(null);

  useEffect(() => {
    api.get('/projects/admin').then(r => setProjects(r.data)).catch(() => showToast('Failed to load projects', 'error')).finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (id, status) => {
    setActLoading(id);
    try {
      await api.put(`/projects/${id}/status`, { status });
      setProjects(p => p.map(pr => pr.id === id ? { ...pr, status } : pr));
      showToast(`Project status updated to ${status}`);
    } catch { showToast('Failed to update status', 'error'); }
    finally { setActLoading(null); }
  };

  const toggleFeature = async (id, currentFeature) => {
    setActLoading(id);
    try {
      await api.put(`/projects/${id}/status`, { is_featured: !currentFeature });
      setProjects(p => p.map(pr => pr.id === id ? { ...pr, is_featured: !currentFeature } : pr));
      showToast(currentFeature ? 'Project unfeatured' : 'Project featured!');
    } catch { showToast('Failed to feature project', 'error'); }
    finally { setActLoading(null); }
  };

  return (
    <div>
      <SectionHeader title="Project Moderation" subtitle="Approve, feature or remove projects" />
      <DataTable
        columns={['Project', 'Author', 'Technology', 'Likes', 'Status', 'Actions']}
        loading={loading}
        rows={projects.map(pr => (
          <tr key={pr.id} className={`border-b border-white/3 hover:bg-white/2 ${pr.status === 'flagged' ? 'bg-red-500/5' : ''}`}>
            <td className="px-5 py-3.5">
              <p className="text-white text-xs font-bold">{pr.title}</p>
              <p className="text-gray-500 text-[10px]">{pr.college}</p>
            </td>
            <td className="px-5 py-3.5 text-gray-400 text-xs">{pr.author}</td>
            <td className="px-5 py-3.5"><Badge color="purple">{pr.tech}</Badge></td>
            <td className="px-5 py-3.5 text-yellow-400 font-black text-sm">♥ {pr.likes}</td>
            <td className="px-5 py-3.5">
              <Badge color={pr.status === 'approved' ? 'green' : pr.status === 'flagged' ? 'red' : 'yellow'}>{pr.status}</Badge>
              {pr.is_featured && <span className="ml-2 text-[10px]">⭐</span>}
            </td>
            <td className="px-5 py-3.5">
              <div className="flex gap-2">
                {pr.status !== 'approved' && <ActionBtn onClick={() => toggleStatus(pr.id, 'approved')} disabled={actLoading === pr.id} label="Approve" color="green" />}
                {pr.status !== 'flagged' && <ActionBtn onClick={() => toggleStatus(pr.id, 'flagged')} disabled={actLoading === pr.id} label="Flag" color="red" />}
                <ActionBtn onClick={() => toggleFeature(pr.id, pr.is_featured)} disabled={actLoading === pr.id} label={pr.is_featured ? "Unfeature" : "⭐ Feature"} color="purple" />
              </div>
            </td>
          </tr>
        ))}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 10. CERTIFICATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
const CertificatesPage = ({ showToast }) => {
  const CERTS = [
    { id: 1, student: 'Rahul Sharma', email: 'r@g.com', title: 'Python Certification', issuer: 'Coursera', status: 'pending' },
    { id: 2, student: 'Priya Patil', email: 'p@g.com', title: 'AWS Cloud Practitioner', issuer: 'Amazon', status: 'approved' },
    { id: 3, student: 'Unknown User', email: 'u@g.com', title: 'Fake IIT Certificate', issuer: 'Unknown', status: 'flagged' },
  ];

  const [certs, setCerts] = useState(CERTS);
  const update = (id, status) => { setCerts(p => p.map(c => c.id === id ? { ...c, status } : c)); showToast(`Certificate ${status}`); };

  return (
    <div>
      <SectionHeader title="Certificate Management" subtitle="Verify and moderate uploaded certificates" />
      <DataTable
        columns={['Student', 'Certificate', 'Issuer', 'Status', 'Actions']}
        loading={false}
        rows={certs.map(c => (
          <tr key={c.id} className={`border-b border-white/3 hover:bg-white/2 ${c.status === 'flagged' ? 'bg-red-500/5' : ''}`}>
            <td className="px-5 py-3.5">
              <p className="text-white text-xs font-bold">{c.student}</p>
              <p className="text-gray-500 text-[10px]">{c.email}</p>
            </td>
            <td className="px-5 py-3.5 text-gray-300 text-xs font-semibold">{c.title}</td>
            <td className="px-5 py-3.5"><Badge color="gray">{c.issuer}</Badge></td>
            <td className="px-5 py-3.5">
              <Badge color={c.status === 'approved' ? 'green' : c.status === 'flagged' ? 'red' : 'yellow'}>{c.status}</Badge>
            </td>
            <td className="px-5 py-3.5">
              <div className="flex gap-2">
                {c.status !== 'approved' && <ActionBtn onClick={() => update(c.id, 'approved')} label="Approve" color="green" />}
                {c.status !== 'flagged' && <ActionBtn onClick={() => update(c.id, 'flagged')} label="Flag Fake" color="red" />}
                {c.status !== 'pending' && <ActionBtn onClick={() => update(c.id, 'pending')} label="Reset" color="gray" />}
              </div>
            </td>
          </tr>
        ))}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 11. TEAM MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
const TeamsPage = ({ showToast }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teams').then(r => setTeams(r.data || [])).catch(() => setTeams([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <SectionHeader title="Team Management" subtitle={`${teams.length} teams on platform`} />
      <DataTable
        columns={['Team', 'Members', 'Looking For', 'Status', 'Actions']}
        loading={loading}
        rows={teams.map(t => (
          <tr key={t.id} className="border-b border-white/3 hover:bg-white/2">
            <td className="px-5 py-3.5">
              <p className="text-white text-xs font-bold">{t.name}</p>
              <p className="text-gray-500 text-[10px]">{t.project_idea?.slice(0, 40)}...</p>
            </td>
            <td className="px-5 py-3.5 text-white font-bold text-sm">{(t.members || []).length}</td>
            <td className="px-5 py-3.5"><Badge color="blue">{t.looking_for || '—'}</Badge></td>
            <td className="px-5 py-3.5"><Badge color={t.is_open ? 'green' : 'gray'}>{t.is_open ? 'Open' : 'Closed'}</Badge></td>
            <td className="px-5 py-3.5">
              <ActionBtn onClick={() => showToast('Team details: Coming in Phase 2')} label="View" color="blue" />
            </td>
          </tr>
        ))}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 12. NOTIFICATIONS CENTER
// ═══════════════════════════════════════════════════════════════════════════════
const NotificationsPage = ({ showToast }) => {
  const [form, setForm] = useState({ title: '', body: '', target_role: '', target_all: true });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) return showToast('Title and body required', 'error');
    setSending(true);
    try {
      const res = await api.post('/admin/notifications/broadcast', { ...form, target_all: form.target_role === '' });
      showToast(`✅ Sent to ${res.data.count} users`);
      setHistory(p => [{ ...form, count: res.data.count, time: new Date().toISOString() }, ...p]);
      setForm({ title: '', body: '', target_role: '', target_all: true });
    } catch { showToast('Failed', 'error'); }
    finally { setSending(false); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div>
        <SectionHeader title="Broadcast Notification" subtitle="Push messages to your users" />
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6 space-y-4">
          <form onSubmit={handleSend} className="space-y-4">
            <SelectField label="Target Audience" value={form.target_role} onChange={e => setForm({ ...form, target_role: e.target.value })}
              options={[
                { value: '', label: '🌍 All Users' }, { value: 'student', label: '🎓 All Students' },
                { value: 'mentor', label: '🧑‍🏫 All Mentors' }, { value: 'admin', label: '🛡️ All Admins' },
              ]} />
            <InputField label="Notification Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. New Hackathon Alert!" required />
            <div>
              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Message</label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required rows={4}
                placeholder="Write your message here..."
                className="w-full bg-[#0d0d1a] border border-white/5 rounded-xl py-3 px-4 text-white text-sm placeholder-gray-600 focus:border-[#2015FF]/50 focus:outline-none resize-none" />
            </div>
            <button type="submit" disabled={sending}
              className="w-full py-3 bg-[#2015FF] hover:bg-[#3525FF] text-white rounded-xl text-sm font-black shadow-[0_4px_20px_rgba(32,21,255,0.4)] disabled:opacity-50 transition-all">
              {sending ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span> : '🔔 Broadcast Now'}
            </button>
          </form>
        </div>
      </div>
      <div>
        <SectionHeader title="Sent History" subtitle="Recent broadcasts this session" />
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6 space-y-3 min-h-48">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-600">
              <span className="text-4xl mb-3">🔔</span>
              <p className="text-sm">No broadcasts yet</p>
            </div>
          ) : history.map((h, i) => (
            <div key={i} className="p-4 bg-white/3 border border-white/5 rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-white text-xs font-bold">{h.title}</p><p className="text-gray-500 text-[10px] mt-1">{h.body}</p></div>
                <Badge color="blue">{h.count} sent</Badge>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge color="gray">{h.target_role || 'All'}</Badge>
                <span className="text-gray-600 text-[10px]">{fmtTime(h.time)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 13. GAMIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
const GamificationPage = ({ showToast }) => {
  const [xpRules, setXpRules] = useState([
    { action: 'Certificate Upload', xp: 50, icon: '📜' },
    { action: 'Hackathon Join', xp: 30, icon: '🏁' },
    { action: 'Hackathon Win', xp: 200, icon: '🏆' },
    { action: 'Project Creation', xp: 75, icon: '🚀' },
    { action: 'Job Selected', xp: 150, icon: '💼' },
    { action: 'Profile Complete', xp: 25, icon: '👤' },
    { action: 'Team Created', xp: 40, icon: '🤝' },
    { action: 'Mentor Session', xp: 60, icon: '🧑‍🏫' },
  ]);

  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    showToast('XP Rules saved successfully!');
  };

  return (
    <div>
      <SectionHeader title="Gamification Management" subtitle="Configure XP values, badges, and achievements"
        action={<ActionBtn onClick={save} label={saving ? 'Saving...' : '💾 Save Rules'} color="blue" />} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white mb-5">XP Rules Configuration</h3>
          <div className="space-y-3">
            {xpRules.map((rule, i) => (
              <div key={rule.action} className="flex items-center gap-4 p-3 bg-white/3 rounded-xl border border-white/5">
                <span className="text-xl">{rule.icon}</span>
                <span className="text-white text-xs font-bold flex-1">{rule.action}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rule.xp}
                    onChange={e => setXpRules(p => p.map((r, j) => j === i ? { ...r, xp: parseInt(e.target.value) || 0 } : r))}
                    className="w-16 bg-[#0d0d1a] border border-white/10 rounded-lg py-1.5 px-2 text-[#6060FF] font-black text-sm text-center focus:outline-none focus:border-[#2015FF]/50"
                  />
                  <span className="text-gray-600 text-[10px] font-bold">XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-black text-white mb-5">Badge System</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'First Step', icon: '🌱', xp: 10 },
                { name: 'Rising Star', icon: '⭐', xp: 100 },
                { name: 'Hustler', icon: '💪', xp: 250 },
                { name: 'Champion', icon: '🏆', xp: 500 },
                { name: 'Legend', icon: '🔥', xp: 1000 },
                { name: 'GOD Mode', icon: '⚡', xp: 2500 },
              ].map(b => (
                <div key={b.name} className="p-3 bg-white/3 border border-white/5 rounded-xl text-center hover:border-[#2015FF]/30 transition-all">
                  <div className="text-2xl mb-1">{b.icon}</div>
                  <p className="text-white text-[10px] font-bold">{b.name}</p>
                  <p className="text-[#6060FF] text-[9px] mt-0.5">{b.xp} XP</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-black text-white mb-3">Leaderboard Config</h3>
            <div className="space-y-2">
              {[{ label: 'Reset Period', value: 'Monthly' }, { label: 'Top N Display', value: '50' }, { label: 'Public Visible', value: 'Yes' }].map(c => (
                <div key={c.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/3">
                  <span className="text-gray-400 text-xs">{c.label}</span>
                  <Badge color="blue">{c.value}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 14. CONTENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
const ContentPage = ({ showToast }) => {
  const [banners, setBanners] = useState([
    { id: 1, title: 'New Hackathon Season', active: true, link: '/opportunities' },
    { id: 2, title: 'Top Internships Open', active: false, link: '/opportunities' },
  ]);
  const [newBanner, setNewBanner] = useState({ title: '', link: '' });

  const addBanner = () => {
    if (!newBanner.title) return showToast('Title required', 'error');
    setBanners(p => [...p, { id: Date.now(), ...newBanner, active: true }]);
    setNewBanner({ title: '', link: '' });
    showToast('Banner added!');
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Content Management" subtitle="Manage banners, announcements & featured content" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Banners */}
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white mb-4">Homepage Banners</h3>
          <div className="space-y-2 mb-4">
            {banners.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${b.active ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className="text-white text-xs font-bold flex-1">{b.title}</span>
                <ActionBtn onClick={() => { setBanners(p => p.map(b2 => b2.id === b.id ? { ...b2, active: !b2.active } : b2)); showToast('Banner toggled'); }} label={b.active ? 'Disable' : 'Enable'} color={b.active ? 'yellow' : 'green'} />
                <ActionBtn onClick={() => { setBanners(p => p.filter(b2 => b2.id !== b.id)); showToast('Removed'); }} label="×" color="red" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newBanner.title} onChange={e => setNewBanner({ ...newBanner, title: e.target.value })} placeholder="New banner title..."
              className="flex-1 bg-[#0d0d1a] border border-white/5 rounded-xl py-2 px-3 text-white text-xs placeholder-gray-600 focus:outline-none" />
            <button onClick={addBanner} className="px-4 py-2 bg-[#2015FF] text-white text-xs font-black rounded-xl hover:bg-[#3525FF] transition-all">+</button>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white mb-4">Announcements</h3>
          <div className="space-y-3">
            {[
              { title: 'Platform v2.0 Released', date: '26 Jun 2026', type: 'update' },
              { title: 'Summer Hackathon 2026', date: '20 Jun 2026', type: 'event' },
              { title: 'New Mentors Onboarded', date: '15 Jun 2026', type: 'news' },
            ].map(a => (
              <div key={a.title} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/5">
                <Badge color={a.type === 'update' ? 'blue' : a.type === 'event' ? 'yellow' : 'green'}>{a.type}</Badge>
                <span className="text-white text-xs font-semibold flex-1">{a.title}</span>
                <span className="text-gray-600 text-[10px]">{a.date}</span>
                <ActionBtn onClick={() => showToast('Announcement removed')} label="×" color="red" />
              </div>
            ))}
          </div>
          <button onClick={() => showToast('Announcement composer: Phase 2')}
            className="mt-4 w-full py-2 border border-dashed border-white/10 text-gray-600 text-xs rounded-xl hover:border-[#2015FF]/30 hover:text-[#6060FF] transition-all">
            + New Announcement
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 15. SYSTEM SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
const SettingsPage = ({ showToast }) => {
  const [flags, setFlags] = useState([
    { key: 'enable_signup', label: 'Enable User Signup', enabled: true },
    { key: 'enable_google_auth', label: 'Google OAuth Login', enabled: true },
    { key: 'enable_notifications', label: 'Push Notifications', enabled: true },
    { key: 'enable_leaderboard', label: 'Public Leaderboard', enabled: true },
    { key: 'enable_teams', label: 'Team Formation', enabled: true },
    { key: 'maintenance_mode', label: 'Maintenance Mode', enabled: false },
    { key: 'enable_chat', label: 'Platform Chat', enabled: false },
    { key: 'enable_certificates', label: 'Certificate Upload', enabled: true },
  ]);

  const toggle = key => {
    setFlags(p => p.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
    showToast('Feature flag updated');
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="System Settings" subtitle="Feature flags, platform config, roles & permissions" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Feature Flags */}
        <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white mb-5">Feature Flags</h3>
          <div className="space-y-2">
            {flags.map(f => (
              <div key={f.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/3 transition-colors">
                <div>
                  <p className="text-white text-xs font-bold">{f.label}</p>
                  <p className="text-gray-600 text-[9px] font-mono">{f.key}</p>
                </div>
                <button onClick={() => toggle(f.key)}
                  className={`w-11 h-6 rounded-full transition-all relative ${f.enabled ? 'bg-[#2015FF]' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${f.enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Roles & Platform Info */}
        <div className="space-y-4">
          <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-black text-white mb-5">Admin Role Levels</h3>
            <div className="space-y-2">
              {[
                { role: 'super_admin', desc: 'Full system access', color: 'red' },
                { role: 'admin', desc: 'Platform management', color: 'yellow' },
                { role: 'college_admin', desc: 'College-specific data', color: 'blue' },
                { role: 'company_admin', desc: 'Jobs & internships only', color: 'green' },
              ].map(r => (
                <div key={r.role} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl">
                  <Badge color={r.color}>{r.role}</Badge>
                  <span className="text-gray-400 text-xs">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#080812] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-black text-white mb-4">Platform Info</h3>
            <div className="space-y-2">
              {[
                { label: 'Version', value: 'v1.0.0-beta' },
                { label: 'Environment', value: 'Development' },
                { label: 'Database', value: 'Firestore' },
                { label: 'Auth', value: 'JWT + Firebase' },
                { label: 'Real-time', value: 'Socket.io' },
              ].map(i => (
                <div key={i.label} className="flex items-center justify-between py-1.5">
                  <span className="text-gray-500 text-xs">{i.label}</span>
                  <Badge color="gray">{i.value}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 16. AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════════════
const AuditPage = ({ showToast }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => showToast('Failed to load', 'error')).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const ac = (action) => {
    if (action?.includes('DELETE')) return 'red';
    if (action?.includes('SUSPEND') || action?.includes('REJECT')) return 'yellow';
    if (action?.includes('ACTIV') || action?.includes('APPROV')) return 'green';
    if (action?.includes('BROADCAST')) return 'blue';
    return 'gray';
  };

  return (
    <div>
      <SectionHeader title="Audit Logs" subtitle="Complete admin activity trail"
        action={<ActionBtn onClick={fetch} label="↻ Refresh" color="blue" />} />
      <DataTable
        columns={['Time', 'Actor', 'Action', 'Module', 'Details']}
        loading={loading}
        emptyMsg="No audit events yet. Actions will appear here automatically."
        rows={logs.map(log => (
          <tr key={log.id} className="border-b border-white/3 hover:bg-white/2">
            <td className="px-5 py-3 text-gray-500 text-[10px] font-mono">{fmtTime(log.created_at)}</td>
            <td className="px-5 py-3 text-gray-400 text-[11px]">{log.actor_email}</td>
            <td className="px-5 py-3"><Badge color={ac(log.action)}>{log.action?.replace(/_/g, ' ')}</Badge></td>
            <td className="px-5 py-3 text-gray-500 text-[10px] uppercase tracking-widest">{log.module}</td>
            <td className="px-5 py-3 text-gray-600 text-[10px] max-w-xs truncate font-mono">
              {Object.entries(log.details || {}).map(([k, v]) => `${k}=${v}`).join(' · ')}
            </td>
          </tr>
        ))}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// OPP FORM MODAL
// ═══════════════════════════════════════════════════════════════════════════════
const OppFormModal = ({ onClose, showToast, onCreated }) => {
  const [formData, setFormData] = useState({ title: '', type: 'Internship', company: '', description: '', mode: 'Online', required_skills: [] });
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData(p => ({ ...p, required_skills: [...p.required_skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkill = (sk) => {
    setFormData(p => ({ ...p, required_skills: p.required_skills.filter(s => s !== sk) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/opportunities', formData);
      showToast('Opportunity created! 🎉');
      if (onCreated) onCreated(res.data);
      onClose();
    } catch { showToast('Error creating', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-[#080812] border border-white/10 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-white">New Opportunity</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:text-white flex items-center justify-center text-sm">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <InputField label="Title *" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. SDE Intern" required />
          <InputField label="Company *" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="e.g. Google" required />
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Type" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
              options={['Internship', 'Hackathon', 'Job', 'Competition', 'Scholarship']} />
            <SelectField label="Mode" value={formData.mode} onChange={e => setFormData({ ...formData, mode: e.target.value })}
              options={['Online', 'Offline', 'Hybrid']} />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Required Skills</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill(e)} placeholder="e.g. React, Python"
                className="flex-1 bg-[#0d0d1a] border border-white/5 rounded-xl px-4 py-2 text-white text-sm focus:outline-none" />
              <button type="button" onClick={addSkill} className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.required_skills.map(sk => (
                <span key={sk} className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  {sk} <button type="button" onClick={() => removeSkill(sk)} className="hover:text-white">✕</button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Details..."
              className="w-full bg-[#0d0d1a] border border-white/5 rounded-xl py-3 px-4 text-white text-sm placeholder-gray-600 focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-400 hover:text-white text-sm font-bold rounded-xl hover:bg-white/5 transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-[#2015FF] hover:bg-[#3525FF] text-white text-sm font-black rounded-xl shadow-[0_4px_20px_rgba(32,21,255,0.4)] disabled:opacity-50 transition-all">
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOP BAR
// ═══════════════════════════════════════════════════════════════════════════════
const PAGE_LABELS = {
  '/admin': 'Overview', '/admin/analytics': 'Analytics Center', '/admin/users': 'User Management',
  '/admin/opportunities': 'Opportunity Management', '/admin/applications': 'Applications',
  '/admin/colleges': 'College Management', '/admin/companies': 'Company Management',
  '/admin/mentors': 'Mentor Management', '/admin/projects': 'Project Moderation',
  '/admin/certificates': 'Certificate Management', '/admin/teams': 'Team Management',
  '/admin/notifications': 'Notifications Center', '/admin/gamification': 'Gamification',
  '/admin/content': 'Content Management', '/admin/settings': 'System Settings',
  '/admin/audit': 'Audit Logs',
};

const TopBar = ({ toast }) => {
  const location = useLocation();
  const label = PAGE_LABELS[location.pathname] || 'Admin';
  return (
    <div className="h-14 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-[#050510]/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-gray-600 text-xs shrink-0">Codovate</span>
        <span className="text-gray-700 shrink-0">/</span>
        <span className="text-white text-xs font-black truncate">{label}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {toast && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold animate-[fade-in-down_0.3s_ease-out] ${
            toast.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
            toast.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
            'bg-green-500/10 text-green-400 border border-green-500/20'
          }`}>
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>{toast.msg}
          </div>
        )}
        <div className="text-[10px] text-gray-600 font-mono hidden sm:block">{formatDate(new Date(), { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT ADMIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Admin = () => {
  const [stats, setStats] = useState({});
  const [regData, setRegData] = useState([]);
  const [appData, setAppData] = useState([]);
  const [activity, setActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const { toast, show: showToast } = useToast();
  const { socket } = useSocket();

  const loadData = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [sRes, rRes, aRes, acRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/analytics/registrations'),
        api.get('/admin/analytics/applications'),
        api.get('/admin/activity'),
      ]);
      setStats(sRes.data);
      setRegData(rRes.data);
      setAppData(aRes.data);
      setActivity(acRes.data);
    } catch { showToast('Failed to load dashboard', 'error'); }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!socket) return;
    socket.on('admin_new_student', s => {
      setStats(p => ({ ...p, totalUsers: (p.totalUsers || 0) + 1, totalStudents: (p.totalStudents || 0) + 1, newUsersToday: (p.newUsersToday || 0) + 1 }));
      setActivity(p => [{ type: 'new_user', title: `${s.name} joined`, subtitle: 'student', time: new Date().toISOString(), icon: '👤' }, ...p.slice(0, 14)]);
      showToast(`🔔 New student: ${s.name}`);
    });
    socket.on('admin_new_application', a => {
      setStats(p => ({ ...p, totalApplications: (p.totalApplications || 0) + 1 }));
      setActivity(p => [{ type: 'new_application', title: `${a.student_name} applied`, subtitle: a.status, time: new Date().toISOString(), icon: '📋' }, ...p.slice(0, 14)]);
      showToast(`📋 New application: ${a.student_name}`);
    });
    socket.on('new_opportunity', o => {
      setStats(p => ({ ...p, totalOpportunities: (p.totalOpportunities || 0) + 1 }));
      setActivity(p => [{ type: 'new_opp', title: `${o.title} posted by ${o.company}`, subtitle: o.type, time: new Date().toISOString(), icon: '🔍' }, ...p.slice(0, 14)]);
    });
    return () => { socket.off('admin_new_student'); socket.off('admin_new_application'); socket.off('new_opportunity'); };
  }, [socket]);

  return (
    <div className="flex flex-col h-full">
      <TopBar toast={toast} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <Routes>
          <Route index element={<OverviewPage stats={stats} regData={regData} appData={appData} activity={activity} loading={statsLoading} />} />
          <Route path="analytics" element={<AnalyticsPage regData={regData} appData={appData} />} />
          <Route path="users" element={<UsersPage showToast={showToast} />} />
          <Route path="opportunities" element={<OpportunitiesPage showToast={showToast} />} />
          <Route path="applications" element={<ApplicationsPage showToast={showToast} />} />
          <Route path="colleges" element={<CollegesPage showToast={showToast} />} />
          <Route path="companies" element={<CompaniesPage showToast={showToast} />} />
          <Route path="mentors" element={<MentorsPage showToast={showToast} />} />
          <Route path="projects" element={<ProjectsPage showToast={showToast} />} />
          <Route path="certificates" element={<CertificatesPage showToast={showToast} />} />
          <Route path="teams" element={<TeamsPage showToast={showToast} />} />
          <Route path="notifications" element={<NotificationsPage showToast={showToast} />} />
          <Route path="gamification" element={<GamificationPage showToast={showToast} />} />
          <Route path="content" element={<ContentPage showToast={showToast} />} />
          <Route path="settings" element={<SettingsPage showToast={showToast} />} />
          <Route path="audit" element={<AuditPage showToast={showToast} />} />
        </Routes>
      </div>
    </div>
  );
};

export default Admin;
