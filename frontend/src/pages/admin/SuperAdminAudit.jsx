import React, { useState, useEffect, useMemo } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import { formatDate } from '../../utils/dateUtils';
import api from '../../api/axios';

const SuperAdminAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/audit-logs');
        if (res.data.success) {
          setLogs(res.data.logs);
        }
      } catch (err) {
        console.error('Error fetching audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (filterTab === 'system') return logs.filter(l => l.admin_role === 'System');
    if (filterTab === 'user') return logs.filter(l => l.admin_role !== 'System');
    return logs;
  }, [logs, filterTab]);

  const columns = [
    { 
      header: 'Admin / Actor', 
      render: (row) => {
        const displayName = row.admin_name || row.admin_email || 'System';
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2015FF]/10 text-[#2015FF] flex items-center justify-center font-bold text-xs border border-[#2015FF]/20">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-white">{displayName}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">{row.admin_role || 'System'}</p>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'Action Performed', 
      render: (row) => (
        <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-white/5 border border-white/10 text-gray-300">
          {row.action}
        </span>
      )
    },
    { 
      header: 'Target / Entity', 
      render: (row) => (
        <p className="text-sm font-semibold text-gray-300">{row.target}</p>
      )
    },
    { 
      header: 'Timestamp', 
      render: (row) => (
        <p className="text-xs text-gray-500 font-mono">
          {formatDate(row.timestamp || row.created_at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      )
    }
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white mb-2">Audit Logs</h1>
          <p className="text-sm text-gray-400">Track all administrative actions and system events across the platform.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'all' ? 'bg-[#2015FF] text-white shadow-lg shadow-[#2015FF]/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          All Events
        </button>
        <button
          onClick={() => setFilterTab('user')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'user' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          Admin Actions
        </button>
        <button
          onClick={() => setFilterTab('system')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'system' ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          System Events
        </button>
      </div>

      <AdminDataTable 
        title="Event History"
        data={filteredLogs}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search logs by action, actor, or target..."
        searchableKeys={['admin_name', 'action', 'target', 'admin_role']}
      />
    </div>
  );
};

export default SuperAdminAudit;
