import { useEffect, useState } from 'react';
import api from '../api/axios';

const statusStyles = {
  Applied: 'bg-primary/20 text-primary border-primary/30',
  Selected: 'bg-green-500/20 text-green-400 border-green-500/30',
  Rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const typeColors = {
  Internship: 'text-blue-400',
  Hackathon: 'text-purple-400',
  Competition: 'text-yellow-400',
};

const Applications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications/my')
      .then(res => setApps(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    total: apps.length,
    applied: apps.filter(a => a.status === 'Applied').length,
    selected: apps.filter(a => a.status === 'Selected').length,
    rejected: apps.filter(a => a.status === 'Rejected').length,
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center h-full min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Applications</h1>
        <p className="text-gray-400 text-sm mt-1">Track all your opportunity applications</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total', value: counts.total, color: 'text-white' },
          { label: 'Pending', value: counts.applied, color: 'text-primary' },
          { label: 'Selected', value: counts.selected, color: 'text-green-400' },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Applications List */}
      {apps.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-400 text-sm">No applications yet.</p>
          <a href="/opportunities" className="text-primary text-sm mt-2 inline-block hover:underline">
            Browse opportunities →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map(app => (
            <div
              key={app.id}
              className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-white font-semibold text-sm">{app.title}</h3>
                  <span className={`text-xs font-medium ${typeColors[app.type] || 'text-gray-400'}`}>
                    • {app.type}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">{app.company}</p>
                <p className="text-gray-600 text-xs mt-1">
                  Applied on {new Date(app.applied_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-gray-500 text-xs">Deadline</p>
                  <p className="text-gray-300 text-xs font-medium">
                    {new Date(app.deadline).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    })}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${statusStyles[app.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;