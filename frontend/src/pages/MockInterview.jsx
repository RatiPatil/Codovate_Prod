import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mic, MicOff, Play, Square, Loader, CheckCircle, Video, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MockInterview = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('setup'); // setup, active, result
  const [type, setType] = useState('Behavioral'); // HR, Technical, Behavioral
  const [role, setRole] = useState('Software Engineer');
  
  // Interview state
  const [sessionId, setSessionId] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const transcriptEndRef = useRef(null);
  
  // Web Speech APIs
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    // Scroll to bottom of transcript
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  useEffect(() => {
    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          handleUserReply(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
          toast.error("Microphone error. Please try again.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [sessionId]);

  const speak = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); // cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a good English voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Samantha')));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post('/interviews/start', { type, role });
      setSessionId(res.data.sessionId);
      setTranscript([{ role: 'interviewer', text: res.data.question }]);
      setView('active');
      speak(res.data.question);
    } catch (err) {
      toast.error('Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const isProcessingRef = useRef(false);

  const handleUserReply = async (text) => {
    if (!text.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    // Stop listening immediately to prevent overlap
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    
    // Add user text immediately via functional update
    setTranscript(prev => [...prev, { role: 'candidate', text }]);
    
    try {
      setLoading(true);
      const res = await api.post('/interviews/reply', { sessionId, answer: text });
      setTranscript(prev => [...prev, { role: 'interviewer', text: res.data.response }]);
      speak(res.data.response);
    } catch (err) {
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      // Stop AI speaking if we interrupt
      synthRef.current?.cancel();
      setIsSpeaking(false);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        // Handle case where it's already started
        console.error(e);
      }
    }
  };

  const endInterview = async () => {
    setLoading(true);
    if (recognitionRef.current) recognitionRef.current.stop();
    if (synthRef.current) synthRef.current.cancel();
    
    try {
      // Estimate WPM based on character count and duration (mock logic for now)
      const userText = transcript.filter(t => t.role === 'candidate').map(t => t.text).join(' ');
      const wpm = userText.split(' ').length > 10 ? 120 : 0; 
      
      const res = await api.post('/interviews/end', { sessionId, wpm });
      setReport(res.data);
      setView('result');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-[#050510] text-white p-6 md:p-12 font-sans relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <button onClick={() => navigate('/placement')} className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
            <ChevronLeft size={20} /> Back to Placement Hub
          </button>

          <header className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">AI Mock Interview</h1>
            <p className="text-gray-400 text-lg">Practice real-time verbal interviews with our advanced AI recruiter.</p>
          </header>

          <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl">
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Target Role</label>
              <input 
                type="text" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Interview Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['HR', 'Technical', 'Behavioral'].map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`py-3 rounded-xl border font-bold transition-all ${
                      type === t ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={startInterview}
              disabled={loading}
              className="w-full py-4 rounded-xl font-black bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin" /> : <Play />} Start Interview
            </button>
            <p className="text-center text-xs text-gray-500 mt-4 flex justify-center items-center gap-1">
              <Mic size={14}/> Requires microphone access
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'active') {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/10 bg-[#0a0a16] px-6 flex items-center justify-between shrink-0">
          <div className="font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            {type} Interview: <span className="text-gray-400 font-normal">{role}</span>
          </div>
          <button 
            onClick={endInterview}
            className="px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold transition-colors"
          >
            End Interview
          </button>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row relative">
          {/* Video / Avatar Area */}
          <div className="flex-1 bg-[#050510] flex flex-col items-center justify-center relative p-8">
            <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 ${isSpeaking ? 'border-blue-500 shadow-[0_0_50px_rgba(37,99,235,0.5)]' : 'border-white/10'} transition-all duration-500 flex items-center justify-center bg-[#0a0a16] overflow-hidden`}>
              <Video className={`text-white/5 absolute w-full h-full p-10`} />
              <Volume2 className={`text-white/20 absolute w-1/2 h-1/2 ${isSpeaking ? 'animate-pulse text-blue-400' : ''}`} />
            </div>
            <div className="mt-8 text-center">
              <h2 className="text-xl font-bold">AI Recruiter</h2>
              <p className="text-gray-400">{isSpeaking ? 'Speaking...' : 'Listening...'}</p>
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-[#0a0a16] p-3 rounded-full border border-white/10">
              <button 
                onClick={toggleListen}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isListening ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                }`}
              >
                {isListening ? <Mic size={24} /> : <MicOff size={24} />}
              </button>
              <div className="text-sm font-bold text-gray-400 px-4">
                {isListening ? 'Listening... Speak now' : 'Mic Off. Click to speak.'}
              </div>
            </div>
          </div>

          {/* Transcript Area */}
          <div className="w-full md:w-1/3 bg-[#0a0a16] border-l border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10 font-bold bg-white/5 text-sm uppercase tracking-wider text-gray-400">
              Live Transcript
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {transcript.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'candidate' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-500 font-bold uppercase mb-1 px-1">
                    {msg.role === 'candidate' ? 'You' : 'AI'}
                  </span>
                  <div className={`p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                    msg.role === 'candidate' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start">
                  <div className="bg-white/5 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'result' && report) {
    return (
      <div className="min-h-screen bg-[#050510] text-white p-6 md:p-12 font-sans relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10 animate-slideUp">
          <button onClick={() => navigate('/placement')} className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
            <ChevronLeft size={20} /> Back to Placement Hub
          </button>

          <header className="mb-10">
            <h1 className="text-4xl font-black mb-2">Interview Report</h1>
            <p className="text-gray-400">Detailed AI analysis of your {type} interview.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-6 text-center">
              <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Confidence</div>
              <div className="text-5xl font-black text-emerald-400 mb-2">{report.confidenceScore}%</div>
              <p className="text-xs text-gray-500">Based on delivery & pauses</p>
            </div>
            <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-6 text-center">
              <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Communication</div>
              <div className="text-5xl font-black text-blue-400 mb-2">{report.communicationScore}%</div>
              <p className="text-xs text-gray-500">Clarity & structure</p>
            </div>
            <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-6 text-center">
              <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Technical</div>
              <div className="text-5xl font-black text-orange-400 mb-2">{report.technicalAccuracy}%</div>
              <p className="text-xs text-gray-500">Accuracy & depth</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8">
                <h3 className="text-2xl font-black mb-4">AI Feedback</h3>
                <p className="text-gray-300 leading-relaxed text-lg bg-white/5 p-6 rounded-2xl border border-white/5">
                  {report.feedback}
                </p>
              </div>

              <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-black mb-6 border-b border-white/10 pb-4">Full Transcript</h3>
                <div className="space-y-6">
                  {report.transcript.map((msg, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                        msg.role === 'candidate' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {msg.role === 'candidate' ? 'You' : 'AI'}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`leading-relaxed ${msg.role === 'candidate' ? 'text-gray-200' : 'text-gray-400'}`}>
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-6 sticky top-24">
                <h3 className="font-black mb-4 text-gray-300">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-500 text-sm font-bold">Interview Type</span>
                    <span className="text-white font-medium">{report.type}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-500 text-sm font-bold">Target Role</span>
                    <span className="text-white font-medium">{report.role}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-500 text-sm font-bold">Questions Asked</span>
                    <span className="text-white font-medium">
                      {report.transcript.filter(t => t.role === 'interviewer').length}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setView('setup')}
                  className="w-full mt-8 py-3 rounded-xl border border-white/20 hover:bg-white/10 font-bold transition-all"
                >
                  Start New Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MockInterview;
