import { useEffect, useState } from 'react';
import api from '../api/axios';

const statusStyles = {
  Applied: 'bg-primary/10 text-primary border-primary/20',
  Selected: 'bg-green-500/10 text-green-400 border-green-500/20',
  Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
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
    <div className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10 max-w-7xl mx-auto w-full">
      <div className="mb-8 text-center md:text-left relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          <span className="text-gradient">My Applications</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">Track all your opportunity applications</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 relative z-10">
        {[
          { label: 'Total', value: counts.total, color: 'text-white' },
          { label: 'Pending', value: counts.applied, color: 'text-primary' },
          { label: 'Selected', value: counts.selected, color: 'text-green-400' },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 text-center">
            <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Applications List */}
      {apps.length === 0 ? (
        <div className="text-center py-24 glass-card border-dashed">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-400 text-sm mb-4">No applications yet.</p>
          <a href="/opportunities" className="btn-primary text-sm inline-block">
            Browse opportunities
          </a>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            {apps.map(app => (
              <div
                key={app.id}
                className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="text-white font-bold text-lg group-hover:text-primary transition-colors">{app.title}</h3>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md bg-white/5 ${typeColors[app.type] || 'text-gray-400'}`}>
                      {app.type}
                    </span>
                  </div>
                  <p className="text-primary text-sm font-semibold">{app.company}</p>
                  <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Applied on {new Date(app.applied_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Deadline</p>
                    <p className="text-gray-300 text-xs font-semibold">
                      {new Date(app.deadline).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short'
                      })}
                    </p>
                  </div>
                  <span className={`text-xs px-4 py-1.5 rounded-full border font-bold shadow-sm backdrop-blur-sm ${statusStyles[app.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;