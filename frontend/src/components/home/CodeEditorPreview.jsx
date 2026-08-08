import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Terminal, Sparkles, CheckCircle2, Play, Code2, Copy, Check } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// CODOVATE CODE SEQUENCES FOR CONTINUOUS PRODUCT DEMO
const CODE_SEQUENCES = [
  {
    fileName: 'Source - roadmap.ts',
    language: 'typescript',
    badge: 'AI Roadmap',
    code: `const roadmap = {
  goal: "Full-Stack AI Engineer",
  skills: ["React", "Node.js", "AI"],
  projects: 4,
  interviewReady: true
};`,
    output: '✓ AI Career Path Generated: 100% Tailored for Industry Hiring',
  },
  {
    fileName: 'Source - project.ts',
    language: 'typescript',
    badge: 'Project Build',
    code: `const project = {
  title: "AI Document Assistant",
  stack: ["React", "Node.js", "RAG"],
  status: "Building"
};`,
    output: '✓ Repository Initialized: Real-Time Vector RAG Pipeline Active',
  },
  {
    fileName: 'Source - progress.ts',
    language: 'typescript',
    badge: 'Learning Engine',
    code: `const learner = {
  completed: 68,
  streak: 14,
  projects: 4,
  readiness: 82
};`,
    output: '✓ Skill Assessment Passed: Top 5% Student Readiness Score',
  },
  {
    fileName: 'Source - career.ts',
    language: 'typescript',
    badge: 'Career Journey',
    code: `const journey = [
  "Learn",
  "Build",
  "Practice",
  "Apply",
  "Interview",
  "Get Hired"
];`,
    output: '✓ Pipeline Status: 9 Career Placements Recommended Today',
  },
];

const CodeEditorPreview = () => {
  const containerRef = useRef(null);
  const editorCardRef = useRef(null);

  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [displayedCode, setDisplayedCode] = useState('');
  const [isTypingState, setIsTypingState] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const activeSequence = CODE_SEQUENCES[sequenceIndex];

  // 1. Accessibility Check
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 2. Character-by-character Typing Engine Loop
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedCode(activeSequence.code);
      return;
    }

    let timeoutId;
    let charIndex = 0;
    const targetCode = activeSequence.code;
    setDisplayedCode('');
    setIsTypingState(true);
    setIsPaused(false);

    const typeNextChar = () => {
      if (charIndex < targetCode.length) {
        const currentChar = targetCode.charAt(charIndex);
        setDisplayedCode(targetCode.slice(0, charIndex + 1));
        charIndex++;

        // Natural typing speed variation (35ms to 65ms per char)
        let delay = Math.floor(Math.random() * 30) + 35;
        if (currentChar === '\n') delay = 180;
        else if (currentChar === '{' || currentChar === '}' || currentChar === '[') delay = 120;
        else if (currentChar === ',') delay = 90;

        timeoutId = setTimeout(typeNextChar, delay);
      } else {
        // Typing complete -> Pause phase (2.8 seconds)
        setIsTypingState(false);
        setIsPaused(true);

        timeoutId = setTimeout(() => {
          // Reset phase -> Fast character deletion back to empty
          let deleteIndex = targetCode.length;
          const deleteNextChar = () => {
            if (deleteIndex > 0) {
              deleteIndex -= 2;
              if (deleteIndex < 0) deleteIndex = 0;
              setDisplayedCode(targetCode.slice(0, deleteIndex));
              timeoutId = setTimeout(deleteNextChar, 18);
            } else {
              // Move to next sequence
              setSequenceIndex((prevIndex) => (prevIndex + 1) % CODE_SEQUENCES.length);
            }
          };
          deleteNextChar();
        }, 2800);
      }
    };

    timeoutId = setTimeout(typeNextChar, 400);

    return () => clearTimeout(timeoutId);
  }, [sequenceIndex, prefersReducedMotion]);

  // 3. Scroll & Entrance Motion
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        editorCardRef.current,
        { y: 35, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSequence.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section ref={containerRef} className="py-24 md:py-32 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading & Subtitle specified by prompt */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
            <Terminal className="w-3.5 h-3.5 text-purple-600" />
            <span>Interactive IDE Engine</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Learn by Building.
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed text-balance">
            Turn concepts into real projects, practice your skills, and build a portfolio that proves what you can do.
          </p>
        </div>

        {/* Editor Container with Soft Animated Purple Atmosphere behind it */}
        <div className="relative max-w-4xl mx-auto">
          {/* 🔮 MULTI-LAYERED INDEPENDENT ANIMATED PURPLE ATMOSPHERE BEHIND EDITOR */}
          {!prefersReducedMotion && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[780px] h-[450px] rounded-full blur-[110px] opacity-80 animate-pulse"
                style={{
                  background:
                    'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(129, 140, 248, 0.14) 45%, rgba(99, 102, 241, 0.05) 75%, transparent 90%)',
                  animationDuration: '9s',
                }}
              />
              <div
                className="absolute top-1/3 left-1/3 w-[550px] h-[350px] rounded-full blur-[95px] opacity-70"
                style={{
                  background:
                    'radial-gradient(circle, rgba(147, 51, 234, 0.18) 0%, rgba(192, 132, 252, 0.1) 60%, transparent 80%)',
                }}
              />
            </div>
          )}

          {/* 💻 CODE EDITOR CARD SURFACE */}
          <div
            ref={editorCardRef}
            className="relative z-10 rounded-[28px] border border-slate-200/90 bg-white/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(79,70,229,0.09)] hover:shadow-[0_24px_70px_rgba(79,70,229,0.14)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            {/* Editor Window Bar */}
            <div className="bg-slate-50/90 px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
              {/* Window Controls + Purple Source Label */}
              <div className="flex items-center gap-3.5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400/90" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/90" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/90" />
                </div>

                {/* Small Purple Source Pill specified by prompt */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/90 text-purple-700 font-mono text-xs font-bold shadow-2xs">
                  <Code2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>{activeSequence.fileName}</span>
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-[11px] font-bold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full border border-slate-300/40">
                  {activeSequence.badge}
                </span>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all">
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run</span>
                </button>
              </div>
            </div>

            {/* Code Typing Display Body */}
            <div className="p-6 sm:p-8 bg-[#FAFBFD] font-mono text-xs sm:text-sm text-slate-800 leading-relaxed min-h-[220px] flex flex-col justify-between">
              <pre className="whitespace-pre-wrap break-words text-slate-800 font-mono font-medium">
                <code>
                  {displayedCode}
                  {/* Real Monospace Blinking Cursor */}
                  {!prefersReducedMotion && (
                    <span
                      className={`inline-block w-2 h-4 sm:h-4.5 bg-indigo-600 ml-0.5 align-middle ${
                        isTypingState ? 'opacity-100' : 'animate-pulse'
                      }`}
                    />
                  )}
                </code>
              </pre>

              {/* Output Status Footer Bar */}
              <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between gap-3 text-xs font-sans">
                <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{activeSequence.output}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>Live Codovate Engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CodeEditorPreview;
