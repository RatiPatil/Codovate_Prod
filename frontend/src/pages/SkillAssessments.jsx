import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Loader, ChevronLeft, CheckCircle, XCircle, BarChart2, BookOpen, Target, Brain, Code, Terminal, MessageSquare, Briefcase, MonitorPlay } from 'lucide-react';
import toast from 'react-hot-toast';

const TOPICS = [
  { id: 'Java', name: 'Java', icon: <Code size={24} />, color: 'bg-orange-100 text-orange-600' },
  { id: 'Python', name: 'Python', icon: <Terminal size={24} />, color: 'bg-blue-100 text-blue-600' },
  { id: 'SQL', name: 'SQL', icon: <MonitorPlay size={24} />, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'React', name: 'React', icon: <MonitorPlay size={24} />, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'Aptitude', name: 'Aptitude', icon: <Brain size={24} />, color: 'bg-purple-100 text-purple-600' },
  { id: 'English', name: 'English', icon: <BookOpen size={24} />, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'Communication', name: 'Communication', icon: <MessageSquare size={24} />, color: 'bg-rose-100 text-rose-600' },
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
      <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-black mb-2 text-gray-900">Skill Assessments</h1>
            <p className="text-gray-500 text-lg">Test your skills dynamically with AI-generated questions and personalized improvement plans.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader className="animate-spin text-blue-600" size={32} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOPICS.map(topic => {
                // Find highest score for this topic
                const topicHistory = history.filter(h => h.topic === topic.id);
                const highestScore = topicHistory.length > 0 
                  ? Math.max(...topicHistory.map(h => h.score)) 
                  : null;

                return (
                  <div key={topic.id} className="bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all">
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-xl ${topic.color} flex items-center justify-center`}>
                        {topic.icon}
                      </div>
                      {highestScore !== null && (
                        <div className="text-right">
                          <div className="text-2xl font-black text-gray-900">{highestScore}%</div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Best Score</div>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1 text-gray-900">{topic.name}</h3>
                    <p className="text-gray-500 text-sm mb-6">AI-generated 5-question assessment.</p>
                    
                    <button 
                      onClick={() => startAssessment(topic.id)}
                      className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold text-sm transition-colors border border-gray-200"
                    >
                      {highestScore !== null ? 'Retake Assessment' : 'Start Assessment'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Recent Results</h2>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-4 p-4 border-b border-gray-100 font-bold text-gray-500 text-xs uppercase tracking-wider bg-gray-50">
                  <div className="col-span-2">Topic</div>
                  <div className="text-center">Score</div>
                  <div className="text-right">Date</div>
                </div>
                {history.slice(0, 5).map(item => (
                  <div key={item.id} className="grid grid-cols-4 p-4 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setResult(item); setView('result'); }}>
                    <div className="col-span-2 font-bold text-gray-800 flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.score >= 80 ? 'bg-green-500' : item.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      {item.topic}
                    </div>
                    <div className="text-center font-black text-gray-900">{item.score}%</div>
                    <div className="text-right text-sm text-gray-500">
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
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans relative">
        
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white relative z-10 shrink-0 shadow-sm">
          <div className="font-black text-xl flex items-center gap-2">
            <span className="text-blue-600">{activeTopic}</span> Assessment
          </div>
          <button 
            onClick={() => setView('dashboard')}
            className="text-gray-500 hover:text-gray-900 text-sm font-bold transition-colors"
          >
            Cancel
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          {generating ? (
            <div className="text-center animate-fadeIn max-w-md">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                <Loader className="animate-spin text-blue-600 mx-auto mb-6" size={48} />
                <h2 className="text-2xl font-black mb-3 text-gray-900">Generating Questions...</h2>
                <p className="text-gray-500">Our AI is crafting a unique {activeTopic} assessment just for you.</p>
              </div>
            </div>
          ) : submitting ? (
            <div className="text-center animate-fadeIn max-w-md">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                <Loader className="animate-spin text-blue-600 mx-auto mb-6" size={48} />
                <h2 className="text-2xl font-black mb-3 text-gray-900">Analyzing Performance...</h2>
                <p className="text-gray-500">Grading answers and generating your personalized improvement plan.</p>
              </div>
            </div>
          ) : questions.length > 0 ? (
            <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm animate-slideUp">
              {/* Progress Bar */}
              <div className="flex gap-2 mb-10">
                {questions.map((q, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= currentQIndex ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
                ))}
              </div>

              <div className="mb-3 text-blue-600 font-bold text-xs tracking-widest uppercase">
                Question {currentQIndex + 1} of {questions.length}
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-8">
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
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                      }`}>
                        {key}
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{value}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-12 flex justify-between">
                <button 
                  onClick={prevQuestion}
                  disabled={currentQIndex === 0}
                  className="px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-30 flex items-center gap-2 hover:bg-gray-100 text-gray-700 disabled:hover:bg-transparent"
                >
                  <ChevronLeft size={20} /> Previous
                </button>
                
                {currentQIndex === questions.length - 1 ? (
                  <button 
                    onClick={submitAssessment}
                    disabled={Object.keys(answers).length < questions.length}
                    className="px-8 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50 transition-all"
                  >
                    Submit Assessment
                  </button>
                ) : (
                  <button 
                    onClick={nextQuestion}
                    className="px-8 py-3 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800 transition-all"
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
      <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10 font-sans pb-24 relative overflow-hidden">
        
        <div className="max-w-5xl mx-auto relative z-10 animate-slideUp">
          <button onClick={() => setView('dashboard')} className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium">
            <ChevronLeft size={20} /> Back to Assessments
          </button>

          {/* Hero Result */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 text-center mb-8 shadow-sm">
            <h1 className="text-xl font-bold text-gray-500 mb-2">{result.topic} Assessment Result</h1>
            <div className={`text-6xl md:text-7xl font-black mb-4 ${
              result.score >= 80 ? 'text-green-500' : result.score >= 50 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {result.score}%
            </div>
            <p className="text-lg text-gray-600 font-medium">{result.correctCount} out of {result.totalCount} correct</p>
            
            {result.xpEarned && (
              <div className="mt-6 inline-block bg-blue-50 border border-blue-200 text-blue-700 font-bold px-5 py-2.5 rounded-xl shadow-sm">
                +{result.xpEarned} XP Earned!
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* AI Breakdown */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                  <Brain size={24} />
                </div>
                <h2 className="text-xl font-black text-gray-900">AI Skill Breakdown</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                {result.skillBreakdown}
              </p>

              {result.weakAreas && result.weakAreas.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                    <Target size={16} /> Areas to Improve
                  </h3>
                  <ul className="space-y-3">
                    {result.weakAreas.map((area, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                        <span className="leading-tight">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendedLearning && result.recommendedLearning.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4 flex items-center gap-2">
                    <BookOpen size={16} /> Recommended Learning
                  </h3>
                  <ul className="space-y-3">
                    {result.recommendedLearning.map((topic, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                        <span className="leading-tight">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Improvement Plan */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-xl text-green-600">
                  <BarChart2 size={24} />
                </div>
                <h2 className="text-xl font-black text-gray-900">Action Plan</h2>
              </div>
              <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed text-sm">
                <p>{result.improvementPlan}</p>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wider">Question Review</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  {result.gradedQuestions?.map((q, i) => (
                    <div key={i} className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <p className="font-bold text-gray-900 mb-4 text-sm leading-snug">{q.question}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className={`p-3 rounded-xl border ${q.isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                          <span className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Your Answer:</span>
                          <span className="font-medium">{q.options[q.userAnswer]}</span>
                        </div>
                        {!q.isCorrect && (
                          <div className="p-3 rounded-xl border bg-green-50 border-green-200 text-green-800">
                            <span className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Correct Answer:</span>
                            <span className="font-medium">{q.options[q.correctAnswer]}</span>
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
