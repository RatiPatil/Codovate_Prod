import { Link } from 'react-router-dom';

const MentorCard = ({ profile }) => {
  const mentorType = profile?.career_goal?.split(' ')[0] || 'Backend';
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-[40px] group-hover:bg-pink-500/20 transition-all duration-500" />
      
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">👨‍🏫</span>
          <h2 className="text-lg font-bold text-white">Recommended Mentor</h2>
        </div>

        <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/5">
          <p className="text-white font-bold mb-1">{mentorType} Development Expert</p>
          <p className="text-xs text-gray-400">15 Years Experience • FAANG</p>
        </div>
      </div>

      <Link to="/mentors" className="block w-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 font-bold py-2.5 rounded-xl text-center transition-colors border border-pink-500/30">
        Book Session
      </Link>
    </div>
  );
};

export default MentorCard;
