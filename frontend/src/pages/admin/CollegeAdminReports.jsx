import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

const CollegeAdminReports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/college-admin/reports/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCSV = async () => {
    try {
      const response = await api.get('/college-admin/reports/csv', { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_outcomes_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      showAlert("Failed to generate report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">College Data & Reports</h2>
        <p className="text-gray-400 mt-1">Export comprehensive data and view performance analytics for your students.</p>
      </div>

      <div className="bg-[#080812] border border-white/5 rounded-3xl p-8">
        <h3 className="text-xl font-bold text-white mb-6">Export Data</h3>
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-emerald-500/50 transition-colors">
            <div>
              <h3 className="text-lg font-bold text-white">Student Outcomes Report</h3>
              <p className="text-sm text-gray-400">Includes student skills, profile scores, and application statuses.</p>
            </div>
            <button 
              onClick={handleGenerateCSV}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors"
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top Skills Chart */}
          <div className="bg-[#080812] border border-white/5 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Top Student Skills</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.skills} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" stroke="#ffffff50" axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#ffffff50" axisLine={false} tickLine={false} width={80} />
                  <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Placement Pipeline */}
          <div className="bg-[#080812] border border-white/5 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Placement Pipeline</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.placements}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="month" stroke="#ffffff50" axisLine={false} tickLine={false} />
                  <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="applied" stroke="#3B82F6" strokeWidth={2} name="Applied" />
                  <Line type="monotone" dataKey="interviewed" stroke="#F59E0B" strokeWidth={2} name="Interviewed" />
                  <Line type="monotone" dataKey="hired" stroke="#10B981" strokeWidth={3} name="Hired" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Analytics */}
          <div className="bg-[#080812] border border-white/5 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Department Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.departments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {analytics.departments?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Internships Over Time */}
          <div className="bg-[#080812] border border-white/5 rounded-3xl p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-6">Internships Secured</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.internships}>
                  <defs>
                    <linearGradient id="colorIntern" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="month" stroke="#ffffff50" axisLine={false} tickLine={false} />
                  <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorIntern)" name="Internships" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default CollegeAdminReports;
