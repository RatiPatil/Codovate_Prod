import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Editor } from '@monaco-editor/react';
import { Play, CheckCircle, XCircle, FileCode2, ChevronLeft, Loader, Flame, Coins, Zap, Trophy, Lightbulb, LockOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CodingPractice = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  
  // Editor State
  const [showHint, setShowHint] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionData, setSolutionData] = useState('');
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, probRes] = await Promise.all([
        api.get('/coding/dashboard'),
        api.get('/coding/problems')
      ]);
      setDashboard(dashRes.data);
      setProblems(probRes.data);
    } catch (err) {
      toast.error('Failed to load coding data');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleSelectProblem = (prob) => {
    setActiveProblem(prob);
    
    // Set default language based on topic
    let defaultLang = 'javascript';
    if (prob.topic === 'SQL') defaultLang = 'sql';
    if (prob.topic === 'Aptitude') defaultLang = 'text';
    
    setLanguage(defaultLang);
    setCode(prob.starterCode[defaultLang] || '');
    setResult(null);
    setShowHint(0);
    setShowSolution(false);
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    if (activeProblem && activeProblem.starterCode[lang]) {
      setCode(activeProblem.starterCode[lang]);
    }
  };

  const unlockSolution = async () => {
    try {
      const res = await api.get(`/coding/problems/${activeProblem.id}/solution`);
      setSolutionData(res.data.solution);
      setShowSolution(true);
    } catch (err) {
      toast.error("Failed to load solution");
    }
  };

  const handleSubmit = async () => {
    if (!activeProblem) return;
    setEvaluating(true);
    setResult(null);
    try {
      const res = await api.post('/coding/submit', {
        problemId: activeProblem.id,
        code,
        language
      });
      setResult(res.data);
      if (res.data.passed) {
        if (res.data.xpEarned > 0) {
          toast.success(`Correct! +${res.data.xpEarned} XP, +${res.data.coinsEarned} Coins 🪙`);
          // Update local dashboard stats
          setDashboard(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              xp: prev.stats.xp + res.data.xpEarned,
              coins: prev.stats.coins + res.data.coinsEarned,
              streak: res.data.newStreak
            }
          }));
        } else {
          toast.success('All Test Cases Passed!');
        }
      } else {
        toast.error('Tests Failed');
      }
    } catch (err) {
      toast.error('Evaluation Failed');
    } finally {
      setEvaluating(false);
    }
  };

  if (loadingDashboard) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!activeProblem) {
    return (
      <div className="min-h-screen bg-[#050510] text-white p-6 md:p-8 relative overflow-hidden font-sans pb-24">
        {/* Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <button onClick={() => navigate('/placement')} className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors">
                <ChevronLeft size={20} /> Back to Placement Hub
              </button>
              <h1 className="text-4xl md:text-5xl font-black mb-2">Coding Practice</h1>
              <p className="text-gray-400 text-lg">Master DSA, SQL, and Aptitude. Earn XP and build your streak.</p>
            </div>

            {/* Stats Bar */}
            <div className="flex gap-4 bg-[#0a0a16] border border-white/10 p-3 rounded-2xl">
              <div className="flex items-center gap-2 px-3">
                <Flame className="text-orange-500 fill-orange-500/20" size={24} />
                <div>
                  <div className="text-xl font-black">{dashboard?.stats?.streak || 0}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Day Streak</div>
                </div>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="flex items-center gap-2 px-3">
                <Zap className="text-yellow-400 fill-yellow-400/20" size={24} />
                <div>
                  <div className="text-xl font-black">{dashboard?.stats?.xp || 0}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Total XP</div>
                </div>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="flex items-center gap-2 px-3">
                <Coins className="text-yellow-500 fill-yellow-500/20" size={24} />
                <div>
                  <div className="text-xl font-black">{dashboard?.stats?.coins || 0}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Coins</div>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Daily Challenge */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a16] border border-blue-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider mb-2">
                  <Flame size={16} /> Daily Challenge
                </div>
                <h3 className="text-2xl font-black mb-2">{dashboard?.dailyChallenge?.title || 'No challenge today'}</h3>
                <p className="text-gray-400 mb-6 max-w-md line-clamp-2">{dashboard?.dailyChallenge?.description}</p>
                
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                    +{dashboard?.dailyChallenge?.xp || 10} XP
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    +{dashboard?.dailyChallenge?.coins || 5} Coins
                  </span>
                </div>
              </div>
              {dashboard?.dailyChallenge && (
                <div className="flex items-end md:items-center relative z-10">
                  <button 
                    onClick={() => handleSelectProblem(dashboard.dailyChallenge)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] whitespace-nowrap"
                  >
                    Solve Now
                  </button>
                </div>
              )}
            </div>

            {/* Weekly Challenge */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0a0a16] border border-purple-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden group flex flex-col">
              <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm uppercase tracking-wider mb-2">
                  <Trophy size={16} /> Weekly Contest
                </div>
                <h3 className="text-2xl font-black mb-2">{dashboard?.weeklyChallenge?.title || 'No weekly challenge'}</h3>
                
                <div className="flex items-center gap-4 mt-6">
                  <span className="text-xs font-bold px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    +{dashboard?.weeklyChallenge?.xp || 50} XP
                  </span>
                </div>
              </div>
              {dashboard?.weeklyChallenge && (
                <button 
                  onClick={() => handleSelectProblem(dashboard.weeklyChallenge)}
                  className="mt-6 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all relative z-10"
                >
                  Compete
                </button>
              )}
            </div>
          </div>

          <h2 className="text-2xl font-black mb-6">Problem Set</h2>
          <div className="bg-[#0a0a16] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 font-bold text-gray-500 text-xs md:text-sm uppercase tracking-wider bg-white/[0.02]">
              <div className="col-span-2 md:col-span-1 text-center">Status</div>
              <div className="col-span-10 md:col-span-4">Title</div>
              <div className="col-span-2 hidden md:block">Topic</div>
              <div className="col-span-2 hidden md:block">Difficulty</div>
              <div className="col-span-3 hidden lg:block">Companies</div>
            </div>
            
            {problems.map(prob => (
              <div 
                key={prob.id} 
                onClick={() => handleSelectProblem(prob)}
                className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors items-center group"
              >
                <div className="col-span-2 md:col-span-1 flex justify-center">
                  {prob.solved ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600 group-hover:border-blue-400 transition-colors"></div>
                  )}
                </div>
                <div className="col-span-10 md:col-span-4 font-bold text-white group-hover:text-blue-400 truncate flex flex-col sm:flex-row sm:items-center gap-2">
                  {prob.title}
                  <div className="flex md:hidden gap-2">
                    <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded">{prob.topic}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      prob.difficulty === 'Easy' ? 'text-green-400' :
                      prob.difficulty === 'Medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {prob.difficulty}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="text-xs font-bold text-gray-400 bg-white/5 px-2 py-1 rounded">{prob.topic}</span>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded ${
                    prob.difficulty === 'Easy' ? 'text-green-400' :
                    prob.difficulty === 'Medium' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {prob.difficulty}
                  </span>
                </div>
                <div className="col-span-3 hidden lg:flex flex-wrap gap-1">
                  {prob.companies?.slice(0,2).map(c => (
                    <span key={c} className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded mr-1">{c}</span>
                  ))}
                  {prob.companies?.length > 2 && <span className="text-[10px] text-gray-500">+{prob.companies.length - 2}</span>}
                </div>
              </div>
            ))}
            {problems.length === 0 && (
              <div className="p-8 text-center text-gray-500">Loading problems...</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-[#050510] text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <div className="h-14 border-b border-white/10 bg-[#0a0a16] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveProblem(null)} className="text-gray-400 hover:text-white flex items-center bg-white/5 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-colors">
            <ChevronLeft size={18} /> <span className="text-sm font-bold ml-1 hidden sm:block">Back</span>
          </button>
          <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
          <h2 className="font-black truncate max-w-[200px] sm:max-w-md">{activeProblem.title}</h2>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider hidden sm:block ${
            activeProblem.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
            activeProblem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
            'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {activeProblem.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={language}
            onChange={handleLanguageChange}
            className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-300 outline-none hover:border-white/20 transition-colors"
          >
            {activeProblem.topic === 'SQL' ? (
              <option value="sql">SQL (MySQL)</option>
            ) : activeProblem.topic === 'Aptitude' ? (
              <option value="text">Text (Logic)</option>
            ) : (
              <>
                <option value="javascript">JavaScript (Node)</option>
                <option value="python">Python 3</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </>
            )}
          </select>
          <button 
            onClick={handleSubmit} 
            disabled={evaluating}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-4 py-1.5 rounded-lg font-black text-sm transition-all disabled:opacity-50"
          >
            {evaluating ? <Loader size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
            <span className="hidden sm:inline">{evaluating ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Problem Description & Results */}
        <div className="w-1/2 flex flex-col border-r border-white/10 bg-[#0a0a16] relative">
          
          <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            
            {/* Nav Tabs for Left Panel (Description vs Solution) */}
            <div className="flex gap-6 border-b border-white/10 mb-6">
              <button 
                className={`pb-3 font-bold text-sm transition-colors ${!showSolution ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setShowSolution(false)}
              >
                Description
              </button>
              <button 
                className={`pb-3 font-bold text-sm flex items-center gap-2 transition-colors ${showSolution ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={solutionData ? () => setShowSolution(true) : unlockSolution}
              >
                <LockOpen size={14} /> Solution
              </button>
            </div>

            {!showSolution ? (
              <>
                <div className="prose prose-invert max-w-none text-gray-300 font-sans">
                  {activeProblem.description.split('\n').map((para, i) => (
                    <p key={i} className="mb-4 leading-relaxed">{para}</p>
                  ))}
                  
                  {activeProblem.examples?.length > 0 && (
                    <>
                      <h4 className="text-white font-bold mt-8 mb-4 text-lg">Examples</h4>
                      <div className="space-y-4">
                        {activeProblem.examples.map((ex, i) => (
                          <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-xl font-mono text-sm leading-relaxed">
                            <p className="mb-2"><span className="text-gray-500 select-none">Input: </span><span className="text-blue-300">{ex.input}</span></p>
                            <p><span className="text-gray-500 select-none">Output: </span><span className="text-green-300">{ex.output}</span></p>
                            {ex.explanation && (
                              <p className="text-gray-400 mt-3 pt-3 border-t border-white/5"><span className="text-gray-500 select-none">Explanation:</span> {ex.explanation}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Hints Section */}
                {activeProblem.hints?.length > 0 && (
                  <div className="mt-8 space-y-3">
                    {activeProblem.hints.map((hint, i) => (
                      <div key={i}>
                        {showHint > i ? (
                          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-yellow-100 text-sm animate-fadeIn">
                            <Lightbulb size={18} className="text-yellow-400 shrink-0" />
                            <p>{hint}</p>
                          </div>
                        ) : (
                          showHint === i && (
                            <button 
                              onClick={() => setShowHint(showHint + 1)}
                              className="text-sm font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <Lightbulb size={16} /> Show Hint {i + 1}
                            </button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="prose prose-invert max-w-none font-sans text-gray-300">
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-6">
                  <p className="text-blue-200 text-sm m-0 flex items-center gap-2 font-bold">
                    <CheckCircle size={16} className="text-blue-400" /> Solution Unlocked
                  </p>
                </div>
                <div className="whitespace-pre-wrap font-mono text-sm">{solutionData || <Loader className="animate-spin text-blue-500" />}</div>
              </div>
            )}
          </div>

          {/* Results Panel Overlay (Appears from bottom) */}
          {result && (
            <div className={`absolute bottom-0 left-0 right-0 max-h-[50%] overflow-y-auto border-t border-white/10 bg-[#050510] flex flex-col p-6 animate-slideUp shadow-2xl z-20`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {result.passed ? (
                    <><CheckCircle size={24} className="text-green-500" /><h3 className="text-green-500 font-black text-xl">Accepted</h3></>
                  ) : (
                    <><XCircle size={24} className="text-red-500" /><h3 className="text-red-500 font-black text-xl">Failed</h3></>
                  )}
                </div>
                <button onClick={() => setResult(null)} className="text-gray-500 hover:text-white"><XCircle size={20}/></button>
              </div>
              
              <div className="space-y-4">
                {result.syntaxError && result.syntaxError !== "null" && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Syntax Error</p>
                    <p className="text-sm font-mono text-red-200">{result.syntaxError}</p>
                  </div>
                )}
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Feedback</p>
                  <p className="text-sm text-gray-200 leading-relaxed">{result.feedback}</p>
                </div>
                
                {result.timeComplexity && result.timeComplexity !== "N/A" && (
                  <div className="flex gap-4">
                    <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Time Complexity</p>
                      <p className="text-sm font-mono text-blue-300">{result.timeComplexity}</p>
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Space Complexity</p>
                      <p className="text-sm font-mono text-blue-300">{result.spaceComplexity}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Code Editor */}
        <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
          <div className="flex-1 pt-4">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(val) => setCode(val)}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 26,
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true,
                renderLineHighlight: 'all',
                suggestSelection: 'first',
                wordWrap: 'on'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPractice;
