const Achievements = () => {
  const badges = [
    { icon: '🚀', name: 'First Login', earned: true },
    { icon: '📝', name: 'Resume Ready', earned: true },
    { icon: '🐘', name: 'SQL Explorer', earned: true },
    { icon: '☕', name: 'Java Beginner', earned: true },
    { icon: '🤝', name: 'Team Player', earned: false },
    { icon: '🏗️', name: 'First Project', earned: false },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🏆</span>
        <h2 className="text-lg font-bold text-white">Achievements</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {badges.map((b, i) => (
          <div key={i} className={`flex flex-col items-center text-center group cursor-pointer transition-all ${
            b.earned ? 'opacity-100 hover:scale-110' : 'opacity-40 grayscale hover:grayscale-0'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1 ${
              b.earned ? 'bg-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-800'
            }`}>
              {b.icon}
            </div>
            <span className="text-[9px] font-bold text-gray-400 uppercase">{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
