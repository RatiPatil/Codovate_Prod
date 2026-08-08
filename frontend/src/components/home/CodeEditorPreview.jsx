import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Terminal, Sparkles, CheckCircle2, Play, Code2, Copy, Check } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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
  const [copied, setCopied] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const activeSequence = CODE_SEQUENCES[sequenceIndex];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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

    const typeNextChar = () => {
      if (charIndex < targetCode.length) {
        const currentChar = targetCode.charAt(charIndex);
        setDisplayedCode(targetCode.slice(0, charIndex + 1));
        charIndex++;

        let delay = Math.floor(Math.random() * 30) + 35;
        if (currentChar === '\n') delay = 180;
        else if (currentChar === '{' || currentChar === '}' || currentChar === '[') delay = 120;
        else if (currentChar === ',') delay = 90;

        timeoutId = setTimeout(typeNextChar, delay);
      } else {
        setIsTypingState(false);

        timeoutId = setTimeout(() => {
          let deleteIndex = targetCode.length;
          const deleteNextChar = () => {
            if (deleteIndex > 0) {
              deleteIndex -= 2;
              if (deleteIndex < 0) deleteIndex = 0;
              setDisplayedCode(targetCode.slice(0, deleteIndex));
              timeoutId = setTimeout(deleteNextChar, 18);
            } else {
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        editorCardRef.current,
        { y: 25, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
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
    <section ref={containerRef} id="practice" className="py-14 sm:py-16 md:py-20 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold">
            <Terminal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Interactive IDE Engine</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Learn by Building.
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed text-balance">
            Turn concepts into real projects, practice your skills, and build a portfolio that proves what you can do.
          </p>
        </div>

        {/* Editor Container */}
        <div className="relative max-w-4xl mx-auto">
          {!prefersReducedMotion && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[780px] h-[450px] rounded-full blur-[110px] opacity-80 dark:opacity-50 animate-pulse"
                style={{
                  background:
                    'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(129, 140, 248, 0.14) 45%, rgba(99, 102, 241, 0.05) 75%, transparent 90%)',
                  animationDuration: '9s',
                }}
              />
            </div>
          )}

          {/* CODE EDITOR CARD SURFACE */}
          <div
            ref={editorCardRef}
            className="relative z-10 rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#111522]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(79,70,229,0.09)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_24px_70px_rgba(79,70,229,0.14)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            {/* Editor Window Bar */}
            <div className="bg-slate-50/90 dark:bg-[#0B0D17]/90 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400/90" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/90" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/90" />
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/90 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold shadow-2xs">
                  <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{activeSequence.fileName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-300/40 dark:border-slate-700">
                  {activeSequence.badge}
                </span>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
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
            <div className="p-6 sm:p-8 bg-[#FAFBFD] dark:bg-[#0B0D17] font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed min-h-[220px] flex flex-col justify-between">
              <pre className="whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200 font-mono font-medium">
                <code>
                  {displayedCode}
                  {!prefersReducedMotion && (
                    <span
                      className={`inline-block w-2 h-4 sm:h-4.5 bg-indigo-600 dark:bg-indigo-400 ml-0.5 align-middle ${
                        isTypingState ? 'opacity-100' : 'animate-pulse'
                      }`}
                    />
                  )}
                </code>
              </pre>

              {/* Output Status Footer Bar */}
              <div className="mt-6 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs font-sans">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{activeSequence.output}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] font-semibold">
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
