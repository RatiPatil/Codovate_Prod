import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Loader, ChevronLeft, CheckCircle, XCircle, BarChart2, BookOpen, Target, Brain, Code, Terminal, MessageSquare, Briefcase, MonitorPlay } from 'lucide-react';
import toast from 'react-hot-toast';

const TOPICS = [
  { id: 'Java', name: 'Java', icon: <Code size={24} />, color: 'from-orange-500 to-red-500' },
  { id: 'Python', name: 'Python', icon: <Terminal size={24} />, color: 'from-blue-500 to-indigo-500' },
  { id: 'SQL', name: 'SQL', icon: <MonitorPlay size={24} />, color: 'from-green-500 to-emerald-500' },
  { id: 'React', name: 'React', icon: <MonitorPlay size={24} />, color: 'from-cyan-400 to-blue-500' },
  { id: 'Aptitude', name: 'Aptitude', icon: <Brain size={24} />, color: 'from-purple-500 to-pink-500' },
  { id: 'English', name: 'English', icon: <BookOpen size={24} />, color: 'from-yellow-400 to-orange-500' },
  { id: 'Communication', name: 'Communication', icon: <MessageSquare size={24} />, color: 'from-rose-400 to-red-500' },
];

const SkillAssessments = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'taking', 'result'
  
  // Dashboard State
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Taking State
  const [activeTopic, setActiveTopic] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Result State
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (view === 'dashboard') {
      fetchHistory();
    }
  }, [view]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assessments');
      setHistory(res.data);
    } catch (err) {
      toast.error('Failed to load assessment history');
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async (topic) => {
    setActiveTopic(topic);
    setGenerating(true);
    setView('taking');
    try {
      const res = await api.post('/assessments/start', { topic });
      setAssessmentId(res.data.assessmentId);
      setQuestions(res.data.questions);
      setCurrentQIndex(0);
      setAnswers({});
    } catch (err) {
      toast.error('Failed to generate assessment');
      setView('dashboard');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (optionKey) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQIndex].id]: optionKey
    }));
  };

  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  const submitAssessment = async () => {
    // Check if all answered
    if (Object.keys(answers).length < questions.length) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/assessments/submit', { assessmentId, answers });
      setResult(res.data);
      setView('result');
    } catch (err) {
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#050510] text-white p-6 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate('/placement')} className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ChevronLeft size={20} /> Back to Placement Hub
          </button>
          
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-black mb-2">Skill Assessments</h1>
            <p className="text-gray-400 text-lg">Test your skills dynamically with AI-generated questions and personalized improvement plans.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader className="animate-spin text-blue-500" size={32} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOPICS.map(topic => {
                // Find highest score for this topic
                const topicHistory = history.filter(h => h.topic === topic.id);
                const highestScore = topicHistory.length > 0 
                  ? Math.max(...topicHistory.map(h => h.score)) 
                  : null;

                return (
                  <div key={topic.id} className="bg-[#0a0a16] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${topic.color} opacity-10 rounded-bl-full`}></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${topic.color} bg-opacity-20 flex items-center justify-center`}>
                        {topic.icon}
                      </div>
                      {highestScore !== null && (
                        <div className="text-right">
                          <div className="text-2xl font-black">{highestScore}%</div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Best Score</div>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-black mb-1">{topic.name}</h3>
                    <p className="text-gray-400 text-sm mb-6">AI-generated 5-question assessment.</p>
                    
                    <button 
                      onClick={() => startAssessment(topic.id)}
                      className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm transition-colors border border-white/5"
                    >
                      {highestScore !== null ? 'Retake Assessment' : 'Start Assessment'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-black mb-6">Recent Results</h2>
              <div className="bg-[#0a0a16] border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-4 p-4 border-b border-white/5 font-bold text-gray-500 text-xs uppercase tracking-wider">
                  <div className="col-span-2">Topic</div>
                  <div className="text-center">Score</div>
                  <div className="text-right">Date</div>
                </div>
                {history.slice(0, 5).map(item => (
                  <div key={item.id} className="grid grid-cols-4 p-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { setResult(item); setView('result'); }}>
                    <div className="col-span-2 font-bold flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.score >= 80 ? 'bg-green-500' : item.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      {item.topic}
                    </div>
                    <div className="text-center font-black">{item.score}%</div>
                    <div className="text-right text-sm text-gray-400">
                      {item.createdAt ? new Date(item.createdAt._seconds ? item.createdAt._seconds * 1000 : item.createdAt).toLocaleDateString() : 'Just now'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'taking') {
    return (
      <div className="min-h-screen bg-[#050510] text-white flex flex-col font-sans relative">
        <div className="absolute inset-0 bg-blue-900/10 mix-blend-screen pointer-events-none"></div>
        
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a16] relative z-10 shrink-0">
          <div className="font-black text-xl flex items-center gap-2">
            <span className="text-blue-500">{activeTopic}</span> Assessment
          </div>
          <button 
            onClick={() => setView('dashboard')}
            className="text-gray-400 hover:text-white text-sm font-bold"
          >
            Cancel
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          {generating ? (
            <div className="text-center animate-fadeIn">
              <Loader className="animate-spin text-blue-500 mx-auto mb-4" size={40} />
              <h2 className="text-2xl font-black mb-2">Generating Questions...</h2>
              <p className="text-gray-400">Our AI is crafting a unique {activeTopic} assessment just for you.</p>
            </div>
          ) : submitting ? (
            <div className="text-center animate-fadeIn">
              <Loader className="animate-spin text-purple-500 mx-auto mb-4" size={40} />
              <h2 className="text-2xl font-black mb-2">Analyzing Performance...</h2>
              <p className="text-gray-400">Grading answers and generating your personalized improvement plan.</p>
            </div>
          ) : questions.length > 0 ? (
            <div className="w-full max-w-3xl bg-[#0a0a16] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl animate-slideUp">
              {/* Progress Bar */}
              <div className="flex gap-2 mb-10">
                {questions.map((q, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= currentQIndex ? 'bg-blue-500' : 'bg-white/10'}`}></div>
                ))}
              </div>

              <div className="mb-2 text-blue-400 font-bold text-sm tracking-widest uppercase">
                Question {currentQIndex + 1} of {questions.length}
              </div>
              <h2 className="text-2xl md:text-3xl font-black leading-tight mb-8">
                {questions[currentQIndex].question}
              </h2>

              <div className="space-y-4">
                {Object.entries(questions[currentQIndex].options).map(([key, value]) => {
                  const isSelected = answers[questions[currentQIndex].id] === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleAnswerSelect(key)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 group ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400 group-hover:text-white'
                      }`}>
                        {key}
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>{value}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-12 flex justify-between">
                <button 
                  onClick={prevQuestion}
                  disabled={currentQIndex === 0}
                  className="px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-30 flex items-center gap-2 hover:bg-white/10"
                >
                  <ChevronLeft size={20} /> Previous
                </button>
                
                {currentQIndex === questions.length - 1 ? (
                  <button 
                    onClick={submitAssessment}
                    disabled={Object.keys(answers).length < questions.length}
                    className="px-8 py-3 rounded-xl font-black bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 transition-all"
                  >
                    Submit Assessment
                  </button>
                ) : (
                  <button 
                    onClick={nextQuestion}
                    className="px-8 py-3 rounded-xl font-black bg-white text-black hover:bg-gray-200 transition-all"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (view === 'result' && result) {
    return (
      <div className="min-h-screen bg-[#050510] text-white p-6 md:p-10 font-sans pb-24 relative overflow-hidden">
        {/* Glow */}
        <div className={`absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] pointer-events-none ${
          result.score >= 80 ? 'bg-green-600/20' : result.score >= 50 ? 'bg-yellow-600/20' : 'bg-red-600/20'
        }`}></div>

        <div className="max-w-5xl mx-auto relative z-10 animate-slideUp">
          <button onClick={() => setView('dashboard')} className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
            <ChevronLeft size={20} /> Back to Assessments
          </button>

          {/* Hero Result */}
          <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8 md:p-12 text-center mb-8 shadow-2xl relative overflow-hidden">
            <h1 className="text-2xl font-bold text-gray-400 mb-2">{result.topic} Assessment Result</h1>
            <div className={`text-7xl md:text-8xl font-black mb-4 ${
              result.score >= 80 ? 'text-green-400' : result.score >= 50 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {result.score}%
            </div>
            <p className="text-xl text-gray-300">{result.correctCount} out of {result.totalCount} correct</p>
            
            {result.xpEarned && (
              <div className="mt-6 inline-block bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold px-4 py-2 rounded-xl">
                +{result.xpEarned} XP Earned!
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* AI Breakdown */}
            <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="text-purple-400" size={28} />
                <h2 className="text-2xl font-black">AI Skill Breakdown</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6 bg-purple-500/10 p-5 rounded-2xl border border-purple-500/20">
                {result.skillBreakdown}
              </p>

              {result.weakAreas && result.weakAreas.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                    <Target size={16} /> Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {result.weakAreas.map((area, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendedLearning && result.recommendedLearning.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2">
                    <BookOpen size={16} /> Recommended Learning
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendedLearning.map((topic, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Improvement Plan */}
            <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <BarChart2 className="text-green-400" size={28} />
                <h2 className="text-2xl font-black">Action Plan</h2>
              </div>
              <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
                <p>{result.improvementPlan}</p>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="font-bold text-gray-400 mb-4">Question Review</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {result.gradedQuestions?.map((q, i) => (
                    <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="font-medium mb-3 text-sm">{q.question}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`p-2 rounded flex flex-col ${q.isCorrect ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          <span className="opacity-70 mb-1">Your Answer:</span>
                          <span className="font-bold">{q.options[q.userAnswer]}</span>
                        </div>
                        {!q.isCorrect && (
                          <div className="p-2 rounded flex flex-col bg-green-500/10 text-green-400">
                            <span className="opacity-70 mb-1">Correct Answer:</span>
                            <span className="font-bold">{q.options[q.correctAnswer]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SkillAssessments;
