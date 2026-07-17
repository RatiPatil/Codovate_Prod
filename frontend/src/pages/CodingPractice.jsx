import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Editor } from '@monaco-editor/react';
import { Play, CheckCircle, XCircle, FileCode2, ChevronLeft, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CodingPractice = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const res = await api.get('/coding/problems');
      setProblems(res.data);
    } catch (err) {
      toast.error('Failed to load problems');
    }
  };

  const handleSelectProblem = (prob) => {
    setActiveProblem(prob);
    setCode(prob.starterCode[language] || '');
    setResult(null);
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    if (activeProblem && activeProblem.starterCode[lang]) {
      // Prompt user before replacing code?
      setCode(activeProblem.starterCode[lang]);
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
        toast.success('All Test Cases Passed!');
      } else {
        toast.error('Tests Failed');
      }
    } catch (err) {
      toast.error('Evaluation Failed');
    } finally {
      setEvaluating(false);
    }
  };

  if (!activeProblem) {
    return (
      <div className="min-h-screen bg-[#050510] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate('/placement')} className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ChevronLeft size={20} /> Back to Placement Hub
          </button>
          
          <h1 className="text-3xl font-black mb-2">Coding Practice</h1>
          <p className="text-gray-400 mb-8">Select a problem to start practicing.</p>

          <div className="bg-[#0a0a16] border border-white/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 font-bold text-gray-500 text-sm uppercase tracking-wider">
              <div className="col-span-1">Status</div>
              <div className="col-span-6">Title</div>
              <div className="col-span-2">Difficulty</div>
              <div className="col-span-3">Tags</div>
            </div>
            {problems.map(prob => (
              <div 
                key={prob.id} 
                onClick={() => handleSelectProblem(prob)}
                className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors items-center"
              >
                <div className="col-span-1 pl-2">
                  <div className="w-4 h-4 rounded-full border border-gray-600"></div>
                </div>
                <div className="col-span-6 font-bold text-white group-hover:text-blue-400">{prob.title}</div>
                <div className="col-span-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    prob.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' :
                    prob.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {prob.difficulty}
                  </span>
                </div>
                <div className="col-span-3 flex flex-wrap gap-1">
                  {prob.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded">{tag}</span>
                  ))}
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
      <div className="h-14 border-b border-white/10 bg-[#0a0a16] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveProblem(null)} className="text-gray-400 hover:text-white flex items-center">
            <ChevronLeft size={20} /> <span className="text-sm font-bold ml-1">Problems</span>
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <h2 className="font-bold">{activeProblem.title}</h2>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
            activeProblem.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
            activeProblem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
            'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {activeProblem.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={language}
            onChange={handleLanguageChange}
            className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-300 outline-none"
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
            <option value="java">Java</option>
          </select>
          <button 
            onClick={handleSubmit} 
            disabled={evaluating}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-4 py-1.5 rounded-lg font-black text-sm transition-all disabled:opacity-50"
          >
            {evaluating ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
            {evaluating ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Problem Description & Results */}
        <div className="w-[45%] flex flex-col border-r border-white/10 bg-[#0a0a16]">
          {/* Problem Details */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <h3 className="text-xl font-black mb-4">Description</h3>
            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
              {activeProblem.description.split('\n').map((para, i) => (
                <p key={i} className="mb-4 leading-relaxed">{para}</p>
              ))}
              
              <h4 className="text-white font-bold mt-8 mb-4">Examples</h4>
              <div className="space-y-4">
                {activeProblem.examples.map((ex, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <p className="font-mono text-sm mb-2"><span className="text-gray-500 select-none">Input: </span><span className="text-blue-300">{ex.input}</span></p>
                    <p className="font-mono text-sm"><span className="text-gray-500 select-none">Output: </span><span className="text-green-300">{ex.output}</span></p>
                    {ex.explanation && (
                      <p className="text-sm text-gray-400 mt-2 mt-2 pt-2 border-t border-white/5"><span className="font-bold text-gray-300">Explanation:</span> {ex.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          {result && (
            <div className={`h-[35%] border-t border-white/10 bg-[#050510] flex flex-col p-4 animate-slideUp`}>
              <div className="flex items-center gap-2 mb-4">
                {result.passed ? (
                  <><CheckCircle size={20} className="text-green-500" /><h3 className="text-green-500 font-black text-lg">Accepted</h3></>
                ) : (
                  <><XCircle size={20} className="text-red-500" /><h3 className="text-red-500 font-black text-lg">Failed</h3></>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {result.syntaxError && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Syntax Error</p>
                    <p className="text-sm font-mono text-red-200">{result.syntaxError}</p>
                  </div>
                )}
                <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Feedback</p>
                  <p className="text-sm text-gray-200">{result.feedback}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-white/5 border border-white/10 p-3 rounded-lg">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Time Complexity</p>
                    <p className="text-sm font-mono text-blue-300">{result.timeComplexity}</p>
                  </div>
                  <div className="flex-1 bg-white/5 border border-white/10 p-3 rounded-lg">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Space Complexity</p>
                    <p className="text-sm font-mono text-blue-300">{result.spaceComplexity}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Code Editor */}
        <div className="w-[55%] flex flex-col bg-[#1e1e1e]">
          <div className="flex-1 pt-2">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(val) => setCode(val)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 24,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPractice;
