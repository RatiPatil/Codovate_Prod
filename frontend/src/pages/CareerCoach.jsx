import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import api from '../api/axios';

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

const CareerCoach = () => {
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
  }, []);

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
                className={`max-w-[80%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-none shadow-[0_4px_20px_rgba(32,21,255,0.3)]'
                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                }`}
              >
                {msg.content}
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
