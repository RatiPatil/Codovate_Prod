import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  "How do I become a backend developer?",
  "What skills should I focus on next?",
  "How can I improve my placement readiness?",
  "Can you review my current career plan?",
  "How do I prepare for technical interviews?",
  "What projects should I build for my portfolio?",
];

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 rounded-2xl rounded-tl-none w-fit">
    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

const ActionWidget = ({ content }) => {
  const navigate = useNavigate();
  const match = content.match(/\[ACTION:([A-Z_]+)(?::([^\]]+))?\]/);
  
  if (!match) return <>{content}</>;
  
  const [fullMatch, action, arg] = match;
  const cleanContent = content.replace(fullMatch, '').trim();

  const handleGenerateRoadmap = async () => {
    try {
      toast.loading("Generating roadmap...", { id: 'rm' });
      await api.post('/roadmap/generate');
      toast.success("Roadmap ready!", { id: 'rm' });
      navigate('/roadmap');
    } catch (err) {
      toast.error("Failed to generate roadmap", { id: 'rm' });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {cleanContent && <p className="whitespace-pre-wrap leading-relaxed">{cleanContent}</p>}
      
      {action === 'BUILD_ROADMAP' && (
        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-xl p-4 mt-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🗺️</span>
            <div>
              <h4 className="font-bold text-white text-base">Custom AI Roadmap</h4>
              <p className="text-xs text-gray-300">Target: {arg || 'Your Goal'}</p>
            </div>
          </div>
          <button onClick={handleGenerateRoadmap} className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Generate Roadmap Now
          </button>
        </div>
      )}

      {action === 'FIND_INTERNSHIPS' && (
        <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/30 rounded-xl p-4 mt-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💼</span>
            <div>
              <h4 className="font-bold text-white text-base">Matched Opportunities</h4>
              <p className="text-xs text-gray-300">Searching for {arg || 'Roles'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/opportunities')} className="w-full mt-2 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium text-sm transition-all">
            View Internships
          </button>
        </div>
      )}

      {action === 'FIND_MENTORS' && (
        <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-xl p-4 mt-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👨‍🏫</span>
            <div>
              <h4 className="font-bold text-white text-base">Recommended Mentors</h4>
              <p className="text-xs text-gray-300">Experts in {arg || 'your field'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/mentors')} className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-all">
            Browse Mentors
          </button>
        </div>
      )}

      {action === 'REVIEW_RESUME' && (
        <div className="bg-gradient-to-br from-red-900/40 to-pink-900/40 border border-red-500/30 rounded-xl p-4 mt-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📄</span>
            <div>
              <h4 className="font-bold text-white text-base">AI Resume Review</h4>
              <p className="text-xs text-gray-300">Get instant ATS scoring</p>
            </div>
          </div>
          <button onClick={() => navigate('/resume-review')} className="w-full mt-2 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium text-sm transition-all">
            Start Review
          </button>
        </div>
      )}

      {action === 'ESTIMATE_READINESS' && (
        <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-xl p-4 mt-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="font-bold text-white text-base">Placement Readiness</h4>
              <p className="text-xs text-gray-300">Evaluate your current standing</p>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="w-full mt-2 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium text-sm transition-all">
            View Analytics
          </button>
        </div>
      )}
    </div>
  );
};

const CareerCoach = () => {
  const [dashboard, setDashboard] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: "Hello! I'm your AI Career Coach, powered by Gemini. I know your skills, roadmap progress, and career goals — so I can give you truly personalized guidance.\n\nWhat would you like to work on today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/ai/career-advisor');
      setDashboard(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const userMessage = text || input.trim();
    if (!userMessage || isTyping) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Build history for multi-turn (exclude the initial welcome message from history)
      const history = messages
        .slice(1) // skip welcome
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.post('/ai/coach', { message: userMessage, history });
      setMessages(prev => [...prev, { role: 'model', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white pt-20 md:pt-28 pb-0 flex flex-col max-w-4xl mx-auto px-4 md:px-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-shrink-0">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(147,51,234,0.4)]">
            🤖
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#050505]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">AI Career Coach</h1>
          <p className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Online · Powered by Gemini
          </p>
        </div>
      </div>

      {/* Readiness Dashboard */}
      {dashboard && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl md:col-span-3 border-l-4 border-l-primary">
            <p className="text-sm text-gray-400 font-semibold mb-1">Career Status</p>
            <h3 className="text-lg font-bold text-white">{dashboard.readiness_statement}</h3>
          </div>
          <div className="glass-panel p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5">
            <h4 className="text-sm font-bold text-green-400 mb-2">Recommended Companies</h4>
            <div className="flex flex-wrap gap-2">
              {dashboard.recommended_companies?.map(c => (
                <span key={c} className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-md border border-green-500/20">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/5 md:col-span-2">
            <h4 className="text-sm font-bold text-red-400 mb-2">Missing Skills to Learn Next</h4>
            <div className="flex flex-wrap gap-2">
              {dashboard.missing_skills?.map(s => (
                <span key={s} className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded-md border border-red-500/20 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      <div className="flex-1 bg-[#0a0a0c] border border-white/10 rounded-3xl flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 220px)', minHeight: 400 }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-sm mr-3 mt-1 flex-shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] px-5 py-3.5 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-none shadow-[0_4px_20px_rgba(32,21,255,0.3)]'
                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                }`}
              >
                {msg.role === 'model' ? <ActionWidget content={msg.content} /> : <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-sm mr-3 mt-1 flex-shrink-0">
                🤖
              </div>
              <TypingIndicator />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4">
            <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest mb-3">Quick Questions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your career coach anything..."
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all custom-scrollbar"
            style={{ minHeight: 48, maxHeight: 120 }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isTyping || !input.trim()}
            className="w-12 h-12 flex-shrink-0 bg-primary hover:bg-primary/80 disabled:bg-white/5 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(32,21,255,0.3)] disabled:shadow-none"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-[10px] text-gray-700 text-center py-3">
        AI Career Coach uses your profile data to personalize responses. Powered by Google Gemini.
      </p>
    </div>
  );
};

export default CareerCoach;
