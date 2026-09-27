import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import SkeletonLoader from '../components/common/SkeletonLoader';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      // Mark as read globally
      await api.put('/notifications/read/all');
      window.dispatchEvent(new Event('notifications_read'));
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
        <p className="text-gray-400">Stay updated with your latest alerts and announcements.</p>
      </div>
      
      {loading ? (
        <div className="w-full pt-4">
          <SkeletonLoader type="list" count={5} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl relative z-10 transform transition-transform hover:scale-105">
            📭
          </div>
          <h3 className="text-xl font-bold text-white mb-2 relative z-10">All Caught Up</h3>
          <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto relative z-10">
            You don't have any new notifications. We'll alert you here when there are updates to your applications or new opportunities.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(n => {
            // Robustly parse the date regardless of whether it's a Firestore Timestamp from Admin SDK (_seconds), 
            // Client SDK (seconds), or a standard JS date string
            let dateObj = new Date();
            if (n.created_at) {
              if (n.created_at._seconds) {
                dateObj = new Date(n.created_at._seconds * 1000);
              } else if (n.created_at.seconds) {
                dateObj = new Date(n.created_at.seconds * 1000);
              } else {
                dateObj = new Date(n.created_at);
              }
            }
            
            const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString() : 'Unknown Date';
            
            // Ensure we handle both 'message' (used by global) and 'body' (used by user-specific)
            const titleStr = n.title || 'Notification';
            const bodyStr = n.message || n.body || '';

            return (
              <div 
                key={n.id} 
                className={`p-5 rounded-2xl border transition-all ${
                  n.is_read 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(32,21,255,0.1)]'
                }`}
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className={`font-bold text-lg ${n.is_read ? 'text-gray-200' : 'text-white'}`}>
                    {titleStr}
                  </h3>
                  <span className="text-xs font-medium text-gray-500 whitespace-nowrap bg-[#0f0f1a] px-2 py-1 rounded-md border border-white/5">
                    {dateStr}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{bodyStr}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
