import { formatDate, formatTime, formatDateTime, parseDate, getISODate } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const SuperAdminSystem = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/health');
      setHealth(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[#2015FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">System Health</h2>
          <p className="text-gray-400 mt-1">Real-time monitoring of backend server resources.</p>
        </div>
        <button 
          onClick={fetchHealth}
          disabled={loading}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
          {error}
        </div>
      )}

      {health && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-[#080812] border border-white/5 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <h3 className="text-xl font-bold text-white">All Systems Operational</h3>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              Last updated: {formatTime(health.timestamp)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Uptime Card */}
            <div className="bg-[#080812] border border-white/5 rounded-3xl p-6">
              <h4 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Server Uptime</h4>
              <p className="text-3xl font-black text-[#2015FF]">
                {formatUptime(health.process.uptime)}
              </p>
            </div>

            {/* Memory Card */}
            <div className="bg-[#080812] border border-white/5 rounded-3xl p-6">
              <h4 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Memory Usage</h4>
              <p className="text-3xl font-black text-amber-400 mb-2">
                {health.memory.usagePercent}%
              </p>
              <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                <div 
                  className="bg-amber-400 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${health.memory.usagePercent}%` }} 
                />
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {health.memory.usedMem} / {health.memory.totalMem} used
              </p>
            </div>

            {/* CPU Card */}
            <div className="bg-[#080812] border border-white/5 rounded-3xl p-6">
              <h4 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">CPU Info</h4>
              <p className="text-lg font-black text-white leading-tight mb-2">
                {health.system.cpuModel}
              </p>
              <p className="text-sm text-gray-400 mb-1">
                <span className="text-gray-500">Cores:</span> {health.system.cpuCount}
              </p>
              <p className="text-sm text-gray-400">
                <span className="text-gray-500">Platform:</span> {health.system.platform} {health.system.arch}
              </p>
            </div>
          </div>
          
          <div className="bg-[#080812] border border-white/5 rounded-3xl p-6 mt-6">
            <h4 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Environment</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 p-4 rounded-xl">
                <span className="text-gray-500 block mb-1">Node Version</span>
                <span className="text-white font-mono">{health.process.nodeVersion}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                <span className="text-gray-500 block mb-1">Load Average (1, 5, 15m)</span>
                <span className="text-white font-mono">
                  {health.system.loadAvg.map(n => n.toFixed(2)).join(', ')}
                </span>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default SuperAdminSystem;
