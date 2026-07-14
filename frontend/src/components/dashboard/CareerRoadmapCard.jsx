import { Link } from 'react-router-dom';

const CareerRoadmapCard = ({ profile }) => {
  const goal = profile?.career_goal || 'Backend Developer';
  
  const steps = [
    { title: 'Java', completed: true },
    { title: 'OOP', completed: true },
    { title: 'Collections', completed: true },
    { title: 'SQL', completed: true },
    { title: 'Spring Boot', completed: false },
    { title: 'REST API', completed: false },
    { title: 'Docker', completed: false },
    { title: 'AWS', completed: false },
    { title: 'Projects', completed: false },
    { title: 'Internship', completed: false },
    { title: 'Placement', completed: false },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col group">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">
          <span className="text-primary">{goal}</span> Roadmap
        </h2>
        <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">28% Done</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-4 relative">
          {steps.map((step, idx) => (
            <Link 
              to="/learning" 
              key={idx} 
              className="flex items-start gap-4 relative group/step cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors -ml-2"
            >
              {idx !== steps.length - 1 && (
                <div className={`absolute top-8 left-5 w-0.5 h-[calc(100%+8px)] transition-all duration-700 ${
                  step.completed && steps[idx+1].completed ? 'bg-primary' : 'bg-white/10 group-hover/step:bg-white/30'
                }`} />
              )}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 transform group-hover/step:scale-125 ${
                step.completed ? 'bg-primary text-white shadow-[0_0_10px_rgba(32,21,255,0.5)]' : 'bg-black border border-white/20 text-transparent group-hover/step:border-primary/50'
              }`}>
                {step.completed ? (
                  <span className="text-xs font-bold">✓</span>
                ) : (
                  <span className="text-xs font-bold">⬜</span>
                )}
              </div>
              <span className={`text-sm font-semibold pt-0.5 transition-colors ${
                step.completed ? 'text-white' : 'text-gray-500 group-hover/step:text-gray-300'
              }`}>
                {step.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerRoadmapCard;
