import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, BrainCircuit, FileText, UserPlus, ArrowRight } from 'lucide-react';

const PlacementHub = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Coding Practice",
      description: "Practice DSA and algorithmic problems with our built-in code editor and AI validation.",
      icon: <Code size={32} className="text-blue-400" />,
      route: "/placement/coding",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      hover: "hover:border-blue-500/50 hover:bg-blue-500/20"
    },
    {
      title: "Skill Assessment",
      description: "Take AI-generated quizzes tailored to your target role to identify knowledge gaps.",
      icon: <BrainCircuit size={32} className="text-purple-400" />,
      route: "/placement/assessment",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      hover: "hover:border-purple-500/50 hover:bg-purple-500/20"
    },
    {
      title: "AI Resume Review",
      description: "Get instant ATS scoring and actionable feedback on your resume format and content.",
      icon: <FileText size={32} className="text-emerald-400" />,
      route: "/resume", // Routes to Resume Builder
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      hover: "hover:border-emerald-500/50 hover:bg-emerald-500/20"
    },
    {
      title: "AI Mock Interview",
      description: "Practice behavioral and technical interviews with our intelligent AI interviewer.",
      icon: <UserPlus size={32} className="text-orange-400" />,
      route: "/placement/interview",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      hover: "hover:border-orange-500/50 hover:bg-orange-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050510] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Placement Preparation</h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl">
            Get job-ready with targeted coding practice, dynamic skill assessments, and AI-driven mock interviews. Master your next tech interview here.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod, idx) => (
            <div 
              key={idx} 
              onClick={() => navigate(mod.route)}
              className={`cursor-pointer group ${mod.bg} ${mod.border} ${mod.hover} border rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between`}
            >
              <div>
                <div className="w-16 h-16 rounded-2xl bg-[#0a0a16] border border-white/5 flex items-center justify-center mb-6 shadow-xl">
                  {mod.icon}
                </div>
                <h3 className="text-2xl font-black mb-3 group-hover:text-white text-gray-100 transition-colors">{mod.title}</h3>
                <p className="text-gray-400 leading-relaxed mb-8">{mod.description}</p>
              </div>
              <div className="flex items-center text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                Start Module <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlacementHub;
