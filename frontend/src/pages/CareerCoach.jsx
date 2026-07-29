import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Target, BookOpen, MessageSquare, ChevronRight, Briefcase, FileText, ArrowRight, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/* ── Circular SVG progress ring ───────────────────────────────── */
const RingProgress = ({ pct = 0, size = 120 }) => {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={10} fill="none" stroke="#e8e6ff" />
      <circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={10} fill="none"
        stroke="url(#ringGradCoach)" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={dash}
        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)' }}
      />
      <defs>
        <linearGradient id="ringGradCoach" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/* ── Skeleton placeholder ─────────────────────────────────────── */
const Skel = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

const CareerCoach = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ai/career-advisor');
      setData(res.data);
    } catch (err) {
      setError('Could not generate your career insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle className="text-emerald-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-orange-500" size={20} />;
      case 'improvement': return <Target className="text-blue-500" size={20} />;
      default: return <Info className="text-purple-500" size={20} />;
    }
  };

  const getInsightBg = (type) => {
    switch(type) {
      case 'success': return 'bg-emerald-50 border-emerald-100';
      case 'warning': return 'bg-orange-50 border-orange-100';
      case 'improvement': return 'bg-blue-50 border-blue-100';
      default: return 'bg-purple-50 border-purple-100';
    }
  };

  /* ── Render Loading State ───────────────────────────────────── */
  if (loading) return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Skel className="h-10 w-64" />
      <Skel className="h-5 w-48 mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skel className="h-64 rounded-3xl" />
        <div className="lg:col-span-2 space-y-4">
          <Skel className="h-28 rounded-2xl" />
          <Skel className="h-28 rounded-2xl" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Skel className="h-72 rounded-3xl" />
        <Skel className="h-72 rounded-3xl" />
      </div>
    </div>
  );

  /* ── Render Error State ─────────────────────────────────────── */
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-3xl">
        ⚠️
      </div>
      <h2 className="text-xl font-bold text-gray-900">Oops!</h2>
      <p className="text-gray-500 text-sm">{error}</p>
      <button onClick={fetchData} className="px-5 py-2.5 rounded-xl text-white font-bold bg-primary hover:bg-primary-light transition-all shadow-md">
        Retry Analysis
      </button>
    </div>
  );

  const scoreColor = data.score >= 80 ? 'text-emerald-500' : data.score >= 50 ? 'text-blue-500' : 'text-orange-500';

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 p-6 rounded-3xl text-white overflow-hidden relative shadow-lg">
        <div className="absolute right-0 top-0 opacity-20 pointer-events-none scale-150 translate-x-1/4 -translate-y-1/4">
           <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#ffffff" d="M45.7,-76.1C58.9,-69.3,69.2,-55.4,78.2,-41.2C87.1,-27.1,94.8,-13.5,93.4,-0.8C92,11.9,81.4,23.8,72.6,35.4C63.9,46.9,56.8,58.2,46.3,66.4C35.8,74.7,21.7,80,6.9,81.9C-7.9,83.9,-23.4,82.4,-36.8,75.4C-50.2,68.4,-61.5,56.1,-71.4,42.5C-81.2,28.8,-89.6,14.4,-90.1,-0.3C-90.6,-15,-83.1,-30,-73.4,-43.3C-63.6,-56.6,-51.7,-68.2,-37.9,-74.6C-24.1,-81,-8.5,-82.1,3.4,-81C15.4,-79.8,29.9,-76.3,45.7,-76.1Z" transform="translate(100 100)" />
            </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              🤖
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">AI Career Coach</h1>
              <p className="text-xs font-semibold text-purple-200 flex items-center gap-1.5 uppercase tracking-widest mt-0.5">
                <Sparkles size={12} /> Powered by Gemini
              </p>
            </div>
          </div>
          <p className="text-sm text-purple-100 max-w-lg mt-3 leading-relaxed">
            Your personalized career roadmap and placement readiness insights, generated dynamically from your activity on Codovate.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Career Readiness Score */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <h2 className="text-gray-900 font-bold text-lg mb-1">Career Readiness</h2>
          <p className="text-gray-500 text-xs mb-6">Based on skills, resume, and applications</p>
          
          <div className="relative mb-6">
            <RingProgress pct={data.score || 0} size={160} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${scoreColor}`}>{data.score || 0}</span>
              <span className="text-xs text-gray-400 font-bold">/ 100</span>
            </div>
          </div>
          
          <div className="w-full grid grid-cols-2 gap-3 text-left">
            {Object.entries(data.score_breakdown || {}).map(([key, val]) => (
              <div key={key} className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase text-gray-400 font-bold block mb-0.5">{key}</span>
                <span className="text-sm font-bold text-gray-800">{val} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-purple-600" /> Key Insights
          </h2>
          
          {data.insights?.map((insight, idx) => (
            <div key={idx} className={`p-4 rounded-2xl border ${getInsightBg(insight.type)} flex items-start gap-4 transition-all hover:shadow-md`}>
              <div className="shrink-0 mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1">
                <p className="text-gray-800 text-sm font-medium leading-relaxed mb-3">
                  {insight.text}
                </p>
                {insight.action && insight.link && (
                  <Link to={insight.link} className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all">
                    {insight.action} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ))}
          
          {(!data.insights || data.insights.length === 0) && (
            <div className="text-center p-8 text-gray-400 border border-dashed rounded-2xl">
              No insights generated yet. Complete your profile to get started!
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Learning Plan */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2">
              <BookOpen size={20} className="text-blue-500" /> Actionable Learning Plan
            </h2>
          </div>
          
          <div className="mb-5">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recommended Skills</p>
             <div className="flex flex-wrap gap-2">
               {data.recommended_skills?.map(s => (
                 <span key={s} className="bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-lg text-xs font-bold">
                   {s}
                 </span>
               ))}
               {(!data.recommended_skills || data.recommended_skills.length === 0) && (
                 <span className="text-gray-400 text-xs">No missing skills detected.</span>
               )}
             </div>
          </div>
          
          <div className="space-y-3">
            {data.learning_plan?.map((plan, idx) => (
              <div key={idx} className="group border border-gray-100 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer bg-gray-50/50" onClick={() => navigate(plan.link || '/roadmap')}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{plan.title}</h3>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{plan.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Interview Prep */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2">
              <MessageSquare size={20} className="text-emerald-500" /> Interview Prep
            </h2>
          </div>
          
          <div className="space-y-3">
            {data.interview_prep?.map((prep, idx) => (
              <div key={idx} className="group border border-gray-100 rounded-2xl p-4 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer bg-gray-50/50" onClick={() => navigate(prep.link || '/mock-interviews')}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">{prep.title}</h3>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{prep.description}</p>
              </div>
            ))}
            
            {(!data.interview_prep || data.interview_prep.length === 0) && (
               <div className="text-center p-6 text-gray-400 border border-dashed rounded-2xl text-sm">
                 Apply for jobs to receive targeted interview prep.
               </div>
            )}
          </div>
          
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm">Resume Review</h4>
              <p className="text-xs text-gray-400 mt-0.5">Get an ATS score and fixes</p>
            </div>
            <button onClick={() => navigate('/resume-review')} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              <FileText size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CareerCoach;
