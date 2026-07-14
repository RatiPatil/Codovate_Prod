const NotificationsCard = () => {
  const notifs = [
    { type: 'Mentor Replies', text: 'Mentor accepted your session request', time: '10m ago', icon: '👨‍🏫', unread: true },
    { type: 'Applications', text: 'Backend Internship status changed to Under Review', time: '1h ago', icon: '💼', unread: true },
    { type: 'Deadlines', text: 'Global Hackathon registration ends in 48 hours', time: '2h ago', icon: '⏰', unread: false },
    { type: 'Coding Reminder', text: 'You haven\'t solved today\'s coding challenge', time: '5h ago', icon: '🔥', unread: false },
    { type: 'Daily Goals', text: 'You hit a 12 day streak! Keep it up.', time: '1d ago', icon: '🎯', unread: false }
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between group">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔔</span>
        <h2 className="text-lg font-bold text-white">Notifications</h2>
      </div>

      <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: '250px' }}>
        {notifs.map((n, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors hover:bg-white/10 cursor-pointer ${
            n.unread ? 'bg-primary/10 border-primary/30' : 'bg-black/30 border-white/5'
          }`}>
            <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
            <div>
              <p className={`text-sm ${n.unread ? 'text-white font-bold' : 'text-gray-400 font-medium'} leading-tight mb-1`}>
                {n.text}
              </p>
              <div className="flex justify-between items-center">
                <p className="text-[9px] text-primary font-bold uppercase tracking-wider">{n.type}</p>
                <p className="text-[9px] text-gray-500 font-bold uppercase">{n.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsCard;
