import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import api from '../../api/axios';
import { formatDate } from '../../utils/dateUtils';

const CompanyAdminHiring = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [hires, setHires] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch Analytics Data
      const analyticsRes = await api.get('/company-admin/analytics');
      setAnalytics(analyticsRes.data);

      // 2. Fetch Hires (for the table at the bottom)
      const appsRes = await api.get('/company-admin/applications');
      setHires(appsRes.data.filter(app => (app.status || '').toLowerCase() === 'selected'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      header: 'Candidate Name', 
      render: (row) => (
        <div>
          <p className="font-bold">{row.student_name}</p>
          <p className="text-xs text-gray-400">{row.student_email}</p>
        </div>
      ) 
    },
    { header: 'Role', accessor: 'opportunity_title' },
    { 
      header: 'Hired On', 
      render: (row) => formatDate(row.updated_at || row.created_at) 
    },
    { 
      header: 'Status', 
      render: () => (
        <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-emerald-500/20 text-emerald-500">
          HIRED
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const funnel = analytics?.funnel || {};
  const maxFunnel = Math.max(funnel.Applied || 1, 1);
  const stages = [
    { label: 'Applied', count: funnel.Applied || 0, color: 'bg-blue-500' },
    { label: 'Shortlisted', count: (funnel.Shortlisted || 0) + (funnel.Bookmarked || 0), color: 'bg-indigo-500' },
    { label: 'Interviewing', count: funnel.Interviewing || 0, color: 'bg-purple-500' },
    { label: 'Selected', count: funnel.Selected || 0, color: 'bg-emerald-500' },
  ];

  const skillDist = analytics?.skillDistribution || [];
  const maxSkill = skillDist.length > 0 ? Math.max(...skillDist.map(s => s.count)) : 1;

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Hiring Analytics</h1>
        <p className="text-gray-400">Data-driven insights to optimize your recruitment pipeline.</p>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: analytics?.totalApplications || 0, icon: '📥', color: 'from-blue-500/20 to-transparent', textColor: 'text-blue-500' },
          { label: 'Avg Match Rate', value: `${analytics?.avgMatchRate || 0}%`, icon: '🎯', color: 'from-amber-500/20 to-transparent', textColor: 'text-amber-500' },
          { label: 'Avg Time to Hire', value: `${analytics?.avgTimeToHire || 0} Days`, icon: '⏱️', color: 'from-purple-500/20 to-transparent', textColor: 'text-purple-500' },
          { label: 'Total Hires', value: analytics?.totalHires || 0, icon: '🤝', color: 'from-emerald-500/20 to-transparent', textColor: 'text-emerald-500' }
        ].map((kpi, i) => (
          <div key={i} className={`bg-gradient-to-br ${kpi.color} bg-[#080812] border border-white/5 rounded-2xl p-6 relative overflow-hidden group`}>
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <div className="text-3xl font-black text-white">{kpi.value}</div>
            <div className={`text-xs font-bold uppercase tracking-wider ${kpi.textColor} mt-1`}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hiring Funnel Visualization */}
        <div className="bg-[#080812] border border-white/5 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Hiring Funnel</h2>
          <div className="flex flex-col items-center justify-center space-y-2 relative pt-4 pb-4">
            {stages.map((stage, i) => {
              const widthPct = Math.max((stage.count / maxFunnel) * 100, 15); // min 15% width
              return (
                <div key={stage.label} className="w-full flex flex-col items-center group relative z-10">
                  <div 
                    className={`${stage.color} h-12 rounded-lg flex items-center justify-between px-4 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10`}
                    style={{ width: `${widthPct}%` }}
                  >
                    <span className="text-white font-bold text-xs md:text-sm truncate mr-2">{stage.label}</span>
                    <span className="bg-black/30 px-2 py-0.5 rounded text-white font-black text-sm">{stage.count}</span>
                  </div>
                  {/* Visual Funnel Connector */}
                  {i < stages.length - 1 && (
                    <div className="h-6 w-full flex justify-center items-center opacity-30">
                      <div className="w-px h-full bg-white"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Skill Distribution */}
        <div className="bg-[#080812] border border-white/5 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Top Candidate Skills</h2>
          <div className="space-y-4">
            {skillDist.length > 0 ? skillDist.map((skill, i) => {
              const widthPct = (skill.count / maxSkill) * 100;
              return (
                <div key={skill.name} className="relative">
                  <div className="flex justify-between text-xs text-gray-300 font-bold mb-1">
                    <span>{skill.name}</span>
                    <span>{skill.count}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              )
            }) : (
              <div className="text-gray-500 text-sm text-center py-8">Not enough data to analyze skills.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Hires Table */}
      <div className="pt-4">
        <AdminDataTable 
          title="Recent Hires"
          data={hires}
          columns={columns}
          searchPlaceholder="Search hires..."
        />
      </div>

    </div>
  );
};

export default CompanyAdminHiring;
