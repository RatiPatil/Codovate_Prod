import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  Users, Briefcase, GraduationCap, Trophy, Building2,
  Activity, ArrowUpRight, Plus, RefreshCw, ShieldCheck,
  FileText, Clock, Sparkles, AlertCircle, CheckCircle2,
  TrendingUp, Calendar, Heart, Share2,
} from 'lucide-react';

/* ─── Metric Card Component ─── */
const MetricCard = ({ title, value, subtitle, icon: Icon, color, bg, onClick }) => (
  <div
    onClick={onClick}
    className="bg-[#0D0D1A] border border-white/8 rounded-2xl p-5 hover:border-white/20 transition-all cursor-pointer group flex flex-col justify-between"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
        {title}
      </span>
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color} group-hover:scale-105 transition-transform`}>
        <Icon size={20} />
      </div>
    </div>

    <div className="mt-4">
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-white tracking-tight">
          {value != null ? value : <span className="animate-pulse text-slate-600">--</span>}
        </h3>
        <ArrowUpRight size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
      </div>
      {subtitle && (
        <p className="text-xs text-slate-400 font-medium mt-1">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

/* ─── Quick Action Button ─── */
const QuickActionButton = ({ label, icon: Icon, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/10 font-extrabold text-xs text-white transition-all hover:scale-[1.02] shadow-md ${color}`}
  >
    <Icon size={16} />
    <span>{label}</span>
  </button>
);

/* ═══════════════════════════════════════════════════════════
   MAIN SUPER ADMIN DASHBOARD
═══════════════════════════════════════════════════════════ */
const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const [metrics, setMetrics]       = useState(null);
  const [opportunities, setOpps]     = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [oppsRes, usersRes, logsRes] = await Promise.allSettled([
        api.get('/admin/opportunities'),
        api.get('/admin/students'),
        api.get('/admin/import-history'),
      ]);

      const oppsData = oppsRes.status === 'fulfilled' ? oppsRes.value.data : [];
      const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
      const logsData  = logsRes.status === 'fulfilled' ? logsRes.value.data : [];

      const activeOpps = oppsData.filter(o => o.is_active !== false);
      const featuredOpps = oppsData.filter(o => o.is_featured);

      setOpps(oppsData.slice(0, 5));
      setRecentLogs(logsData.slice(0, 5));
      setMetrics({
        totalOpps:     oppsData.length,
        activeOpps:    activeOpps.length,
        featuredOpps:  featuredOpps.length,
        totalStudents: Array.isArray(usersData) ? usersData.length : 0,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="p-6 lg:p-8 space-y-8 font-sans bg-[#050510] text-slate-100 min-h-screen">
      
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Command Center
            </h1>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black tracking-wide">
              SUPER ADMIN
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Real-time platform overview, ecosystem analytics, and management actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <QuickActionButton
            label="+ Add Opportunity"
            icon={Plus}
            color="bg-blue-600 hover:bg-blue-500"
            onClick={() => navigate('/admin/opportunities')}
          />
        </div>
      </div>

      {/* ── METRICS GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Opportunities"
          value={metrics?.totalOpps}
          subtitle={`${metrics?.activeOpps || 0} active now`}
          icon={Briefcase}
          color="text-blue-400"
          bg="bg-blue-500/10"
          onClick={() => navigate('/admin/opportunities')}
        />
        <MetricCard
          title="Featured Opportunities"
          value={metrics?.featuredOpps}
          subtitle="Showing on student homepage"
          icon={Sparkles}
          color="text-amber-400"
          bg="bg-amber-500/10"
          onClick={() => navigate('/admin/opportunities')}
        />
        <MetricCard
          title="Total Registered Students"
          value={metrics?.totalStudents}
          subtitle="Platform accounts active"
          icon={Users}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          onClick={() => navigate('/admin/students')}
        />
        <MetricCard
          title="System Health"
          value="99.9%"
          subtitle="All APIs Operational"
          icon={ShieldCheck}
          color="text-purple-400"
          bg="bg-purple-500/10"
          onClick={() => navigate('/admin/system')}
        />
      </div>

      {/* ── QUICK ACTIONS STRIP ────────────────────────────── */}
      <div className="bg-[#0D0D1A] border border-white/8 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Management Quick Actions
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <QuickActionButton
            label="Manage Opportunities"
            icon={Briefcase}
            color="bg-blue-600/80 hover:bg-blue-600"
            onClick={() => navigate('/admin/opportunities')}
          />
          <QuickActionButton
            label="Manage Students"
            icon={GraduationCap}
            color="bg-emerald-600/80 hover:bg-emerald-600"
            onClick={() => navigate('/admin/students')}
          />
          <QuickActionButton
            label="Manage Mentors"
            icon={Users}
            color="bg-purple-600/80 hover:bg-purple-600"
            onClick={() => navigate('/admin/mentors')}
          />
          <QuickActionButton
            label="System Audit Logs"
            icon={FileText}
            color="bg-slate-700 hover:bg-slate-600"
            onClick={() => navigate('/admin/audit')}
          />
        </div>
      </div>

      {/* ── 2-COLUMN DETAILS ROW ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Latest Opportunities (2 cols) */}
        <div className="lg:col-span-2 bg-[#0D0D1A] border border-white/8 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="font-extrabold text-lg text-white">Latest Opportunities</h3>
              <p className="text-xs text-slate-400">Recently published across Internships, Jobs, Competitions.</p>
            </div>
            <button
              onClick={() => navigate('/admin/opportunities')}
              className="text-xs font-bold text-blue-400 hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))
            ) : opportunities.length > 0 ? (
              opportunities.map(opp => (
                <div
                  key={opp.id}
                  onClick={() => navigate('/admin/opportunities')}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {(opp.company || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-white truncate">{opp.title}</p>
                      <p className="text-xs text-slate-400 truncate">{opp.company || 'Company'} · {opp.type || 'Internship'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {opp.is_featured && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ★ Featured
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      opp.is_active !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {opp.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No opportunities created yet.</p>
            )}
          </div>
        </div>

        {/* Right: Recent Import Logs (1 col) */}
        <div className="bg-[#0D0D1A] border border-white/8 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="font-extrabold text-lg text-white">Import History</h3>
            <button
              onClick={() => navigate('/admin/audit')}
              className="text-xs font-bold text-blue-400 hover:underline"
            >
              Audit Logs →
            </button>
          </div>

          <div className="space-y-3">
            {recentLogs.length > 0 ? (
              recentLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white truncate">{log.file_name || 'Import'}</p>
                    <span className="text-[10px] text-emerald-400 font-bold">+{log.imported || 0}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">By {log.imported_by || 'Admin'}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 space-y-2">
                <FileText size={24} className="text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No bulk imports logged yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default SuperAdminDashboard;
