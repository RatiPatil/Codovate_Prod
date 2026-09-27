import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Briefcase, Users, UserCheck, BookOpen } from 'lucide-react';

const PublicStats = () => {
  const [stats, setStats] = useState({
    opportunities: 0,
    teams: 0,
    students: 0,
    courses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get('/public/stats')
      .then(res => {
        if (isMounted && res.data) {
          setStats({
            opportunities: res.data.opportunities || 0,
            teams: res.data.teams || 0,
            students: res.data.students || 0,
            courses: res.data.courses || 0,
          });
        }
      })
      .catch(err => {
        console.warn('Public stats fetch notice:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const items = [
    {
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      value: stats.opportunities,
      label: 'Active Opportunities',
    },
    {
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      value: stats.teams,
      label: 'Teams Recruiting',
    },
    {
      icon: UserCheck,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      value: stats.students,
      label: 'Registered Students',
    },
    {
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      value: stats.courses,
      label: 'Learning Courses',
    },
  ];

  return (
    <section className="py-10 bg-slate-50/70 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex items-center gap-4 transition-all hover:shadow-md"
            >
              <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                <item.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {loading ? (
                    <span className="inline-block w-8 h-6 bg-slate-200 rounded animate-pulse" />
                  ) : (
                    item.value.toLocaleString()
                  )}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicStats;
