import { Link } from 'react-router-dom';

const LearningCard = () => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all duration-500" />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Current Course</h2>
          <p className="text-blue-400 font-bold">Spring Boot</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-white">68%</span>
        </div>
      </div>

      <div className="w-full bg-black/50 rounded-full h-2 mb-6 overflow-hidden">
        <div className="bg-blue-500 h-2 rounded-full w-[68%]" />
      </div>

      <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/5">
        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Suggested Next Lesson</p>
        <div className="flex justify-between items-center">
          <p className="text-white font-semibold text-sm">Building REST Controllers</p>
          <span className="text-xs text-gray-400">⏱️ 25m</span>
        </div>
      </div>

      <Link to="/learning" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-center transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]">
        Continue Learning
      </Link>
    </div>
  );
};

export default LearningCard;
