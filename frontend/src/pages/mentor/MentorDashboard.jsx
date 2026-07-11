import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Users, MessageSquare, CheckCircle, Calendar, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-${color}-500/20 text-${color}-400`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const MentorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_students: 0,
    pending_questions: 0,
    answered_questions: 0,
    total_chats: 0,
    upcoming_sessions: 0
  });

  useEffect(() => {
    // In a real app, this would fetch from /api/mentor/dashboard-stats
    // For now we will just use placeholders or fetch from mentor document
    const fetchStats = async () => {
      try {
        const res = await api.get('/mentor-queries/dashboard-stats'); // we will build this endpoint
        if (res.data) setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name} 👋</h1>
        <p className="text-gray-400">Here's what's happening with your students today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Students" value={stats.total_students} icon={Users} color="blue" />
        <StatCard title="Pending Questions" value={stats.pending_questions} icon={MessageSquare} color="yellow" />
        <StatCard title="Answered Questions" value={stats.answered_questions} icon={CheckCircle} color="emerald" />
        <StatCard title="Upcoming Sessions" value={stats.upcoming_sessions} icon={Calendar} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-blue-400" /> Recent Activity
            </h2>
          </div>
          <div className="text-center py-12 text-gray-500">
            <p>No recent activity to show.</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Pending Action Items</h2>
          <div className="text-center py-12 text-gray-500">
            <p>You're all caught up!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
