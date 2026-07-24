import React, { useState, useEffect, Suspense } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { StatCard } from '../../components/admin/widgets/StatCard';
import { WidgetContainer } from '../../components/admin/widgets/WidgetContainer';
import { Badge } from '../../components/admin/ui/Badge';
import { Users, Building, Activity, Database, Server, Clock, Briefcase, FileText } from 'lucide-react';

// Lazy load Recharts to prevent massive initial bundle
const AreaChart = React.lazy(() => import('recharts').then(module => ({ default: module.AreaChart })));
const Area = React.lazy(() => import('recharts').then(module => ({ default: module.Area })));
const XAxis = React.lazy(() => import('recharts').then(module => ({ default: module.XAxis })));
const YAxis = React.lazy(() => import('recharts').then(module => ({ default: module.YAxis })));
const CartesianGrid = React.lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })));
const Tooltip = React.lazy(() => import('recharts').then(module => ({ default: module.Tooltip })));
const ResponsiveContainer = React.lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));

const SuperAdminDashboard = () => {
  // Metric States
  const [overview, setOverview] = useState({ data: null, loading: true, error: null });
  const [health, setHealth] = useState({ data: null, loading: true, error: null });
  const [activity, setActivity] = useState({ data: [], loading: true, error: null });
  const [growth, setGrowth] = useState({ data: [], loading: true, error: null });

  const fetchOverview = async () => {
    setOverview(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await dashboardApi.getOverviewMetrics();
      setOverview({ data: res.data.data, loading: false, error: null });
    } catch (err) {
      setOverview({ data: null, loading: false, error: err });
    }
  };

  const fetchHealth = async () => {
    setHealth(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await dashboardApi.getPlatformHealth();
      setHealth({ data: res.data.data, loading: false, error: null });
    } catch (err) {
      setHealth({ data: null, loading: false, error: err });
    }
  };

  const fetchActivity = async () => {
    setActivity(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await dashboardApi.getRecentActivity();
      setActivity({ data: res.data.data, loading: false, error: null });
    } catch (err) {
      setActivity({ data: [], loading: false, error: err });
    }
  };

  const fetchGrowth = async () => {
    setGrowth(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await dashboardApi.getGrowthMetrics();
      // Reverse array to show oldest first in chart
      setGrowth({ data: res.data.data.reverse(), loading: false, error: null });
    } catch (err) {
      setGrowth({ data: [], loading: false, error: err });
    }
  };

  // Concurrent fetch on mount
  useEffect(() => {
    fetchOverview();
    fetchHealth();
    fetchActivity();
    fetchGrowth();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Command Center</h1>
          <p className="text-gray-500 dark:text-gray-400">Enterprise platform overview and realtime metrics.</p>
        </div>
      </div>

      {/* Platform Health Ribbon */}
      <WidgetContainer isLoading={health.loading} error={health.error} onRetry={fetchHealth} className="bg-gray-900 border-gray-800 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 p-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health.data?.api.status === 'HEALTHY' ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${health.data?.api.status === 'HEALTHY' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="font-medium text-gray-300">API Status</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">Database:</span>
            <Badge variant={health.data?.database.status === 'HEALTHY' ? 'success' : 'danger'}>
              {health.data?.database.status} ({health.data?.database.latencyMs}ms)
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">RAM Used:</span>
            <span className="font-mono">{health.data?.system.processMemoryUsedMB} MB</span>
          </div>
        </div>
      </WidgetContainer>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={overview.data?.totalUsers} 
          icon={Users}
          isLoading={overview.loading}
          error={overview.error}
          onRetry={fetchOverview}
        />
        <StatCard 
          title="Active Users Today" 
          value={overview.data?.activeUsersToday} 
          icon={Activity}
          isLoading={overview.loading}
          error={overview.error}
          onRetry={fetchOverview}
        />
        <StatCard 
          title="Total Organizations" 
          value={overview.data?.totalOrganizations} 
          icon={Building}
          isLoading={overview.loading}
          error={overview.error}
          onRetry={fetchOverview}
        />
        <StatCard 
          title="Audit Logs" 
          value={overview.data?.totalAuditLogs} 
          icon={FileText}
          isLoading={overview.loading}
          error={overview.error}
          onRetry={fetchOverview}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Growth Chart */}
        <div className="lg:col-span-2">
          <WidgetContainer title="User Growth (7 Days)" isLoading={growth.loading} error={growth.error} onRetry={fetchGrowth} className="h-96">
            <Suspense fallback={<div className="w-full h-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-md"></div>}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#f3f4f6' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </Suspense>
          </WidgetContainer>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <WidgetContainer title="Recent Activity" isLoading={activity.loading} error={activity.error} onRetry={fetchActivity} className="h-96">
            <div className="space-y-4 overflow-y-auto h-full pr-2">
              {activity.data?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No recent activity.</p>
              ) : (
                activity.data?.map((log, i) => (
                  <div key={log.id || i} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5" />
                      {i !== activity.data.length - 1 && <div className="w-px h-full bg-gray-200 dark:bg-gray-700 my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.actorEmail || 'System'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {log.action} on {log.collection}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </WidgetContainer>
        </div>
      </div>

    </div>
  );
};

export default SuperAdminDashboard;
