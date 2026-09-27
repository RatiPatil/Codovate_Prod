const DashboardHeader = ({ profile }) => {
  const name = profile?.name?.split(' ')[0] || 'Student';
  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const streak = profile?.streak || 0;
  
  // Calculate a mock completeness based on filled fields, assuming real logic might be slightly more complex
  const calculateCompleteness = () => {
    let score = 0;
    if (profile?.skills?.length > 0) score += 20;
    if (profile?.career_goal) score += 20;
    if (profile?.bio) score += 20;
    if (profile?.github) score += 20;
    if (profile?.linkedin) score += 20;
    return score;
  };
  
  const completeness = calculateCompleteness();

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-white/5">
      <div>
        <p className="text-gray-400 text-sm mb-1">Welcome back,</p>
        <h1 className="text-3xl font-medium tracking-tight text-white">{name}</h1>
      </div>
      
      <div className="mt-6 md:mt-0 flex gap-6 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-500 uppercase tracking-widest text-[10px] font-semibold mb-1">Profile</span>
          <span className="text-white font-medium">{completeness}% Complete</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-gray-500 uppercase tracking-widest text-[10px] font-semibold mb-1">Current Status</span>
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">Lvl {level}</span>
            <span className="text-primary font-medium">{xp} XP</span>
            {streak > 0 && <span className="text-yellow-500 font-medium">{streak} Day Streak</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
