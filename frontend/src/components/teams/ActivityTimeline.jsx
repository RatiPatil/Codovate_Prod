import React from 'react';
import { CheckCircle, MessageSquare, Paperclip, UserPlus, Clock } from 'lucide-react';
import { formatTime } from '../../utils/dateUtils';

const ActionIcon = ({ action }) => {
  switch (true) {
    case action.includes('task'):
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case action.includes('announcement'):
      return <MessageSquare className="w-4 h-4 text-blue-400" />;
    case action.includes('file'):
      return <Paperclip className="w-4 h-4 text-purple-400" />;
    case action.includes('member') || action.includes('joined'):
      return <UserPlus className="w-4 h-4 text-amber-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const ActivityTimeline = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Clock size={32} className="mb-4 opacity-50" />
        <p>No recent activity in this workspace.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative pl-8">
          {/* Vertical line connecting timeline items */}
          {index !== activities.length - 1 && (
            <div className="absolute left-[15px] top-6 bottom-[-24px] w-px bg-white/10" />
          )}
          
          <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-[#12121A] border border-white/10 flex items-center justify-center z-10 shadow-lg">
            <ActionIcon action={activity.action} />
          </div>
          
          <div className="bg-[#12121A] border border-white/5 p-4 rounded-xl shadow-lg">
            <p className="text-sm text-gray-300">
              <span className="font-bold text-white">{activity.user_name}</span> {activity.action}
              {activity.details && (
                <span className="text-gray-400 italic"> {activity.details}</span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1">
              {formatTime(activity.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
