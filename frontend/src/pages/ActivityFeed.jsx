import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Activity, Trophy, Calendar, Code, Users, Rocket, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchGlobalActivity();
  }, []);

  const fetchGlobalActivity = async () => {
    try {
      const res = await api.get('/activity/global');
      setActivities(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'project_created': return <Rocket size={20} className="text-blue-400" />;
      case 'event_rsvp': return <Calendar size={20} className="text-green-400" />;
      case 'team_joined': return <Users size={20} className="text-purple-400" />;
      case 'certificate_earned': return <Trophy size={20} className="text-yellow-400" />;
      case 'code_submission': return <Code size={20} className="text-orange-400" />;
      default: return <Activity size={20} className="text-gray-400" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'project_created': return 'bg-blue-500/10 border-blue-500/20';
      case 'event_rsvp': return 'bg-green-500/10 border-green-500/20';
      case 'team_joined': return 'bg-purple-500/10 border-purple-500/20';
      case 'certificate_earned': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'code_submission': return 'bg-orange-500/10 border-orange-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-6 md:p-8 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-1 flex items-center gap-3 text-slate-900">
              <Activity className="text-indigo-600" size={28} /> 
              Live Activity
            </h1>
            <p className="text-slate-600 text-sm">See what's happening across the Codovate community in real-time.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Updates</span>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No recent activity found.</div>
        ) : (
          <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            <div className="space-y-6">
              {activities.map((act) => (
                <div key={act.activityId} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#F8FAFC] bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${getActivityColor(act.type)}`}>
                    {getActivityIcon(act.type)}
                  </div>

                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-indigo-200 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-indigo-100">
                        {act.user_avatar ? (
                          <img src={act.user_avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          act.user_name?.charAt(0) || '?'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {act.user_name}
                          {act.uid === user.id && <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full uppercase font-bold">You</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(act.createdAt?.seconds ? act.createdAt.seconds * 1000 : act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-900 text-base mb-1">{act.title}</h3>
                    {act.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{act.description}</p>
                    )}
                    
                    {act.metadata?.link && (
                      <Link to={act.metadata.link} className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-indigo-600 hover:underline transition-colors">
                        View Details <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
