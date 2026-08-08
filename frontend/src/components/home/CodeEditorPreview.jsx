import { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle, Play, RefreshCw, Copy, Sparkles, Check } from 'lucide-react';

const CodeEditorPreview = () => {
  const [activeTab, setActiveTab] = useState('solution');
  const [copied, setCopied] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const fullCode = `// Codovate AI Engine: Auto-evaluating solution...
class CodovateSolution {
  public static async analyzeUserCode(submission: CodeInput): Promise<Report> {
    const ast = await parseAST(submission.code);
    const complexity = calculateTimeComplexity(ast);
    const testResults = await runSandboxedSuite(submission.testCases);
    
    return {
      status: testResults.allPassed ? 'ACCEPTED' : 'FAILED',
      timeComplexity: complexity.time, // O(N log N)
      spaceComplexity: complexity.space, // O(1)
      aiFeedback: "Optimal solution! Exceeds 94% of submission speeds."
    };
  }
}`;

  useEffect(() => {
    let index = 0;
    setTypedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      if (index < fullCode.length) {
        setTypedText((prev) => prev + fullCode.charAt(index));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 md:py-28 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Integrated Dev Environment</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Write. Evaluate. Optimize.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              In Real Time.
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Codovate's intelligent editor parses code syntax, evaluates time & space complexity, and provides AI suggestions directly inside your workflow.
          </p>
        </div>

        {/* Code Editor Frame */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden font-mono text-xs">
          {/* Header */}
          <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('solution')}
                  className={`px-3 py-1 rounded-lg text-xs font-sans font-semibold transition-colors ${
                    activeTab === 'solution'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Solution.ts
                </button>
                <button
                  onClick={() => setActiveTab('output')}
                  className={`px-3 py-1 rounded-lg text-xs font-sans font-semibold transition-colors ${
                    activeTab === 'output'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Console Output
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-slate-400 hover:text-white px-2.5 py-1 rounded border border-slate-800 hover:border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="font-sans text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold text-xs shadow-sm transition-all">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Code</span>
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="p-6 text-slate-200 min-h-[260px] leading-relaxed relative bg-slate-950/95 overflow-x-auto">
            {activeTab === 'solution' ? (
              <pre className="text-slate-300">
                <code>
                  {typedText}
                  {isTyping && <span className="inline-block w-2 h-4 bg-indigo-500 ml-0.5 animate-pulse" />}
                </code>
              </pre>
            ) : (
              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-bold">Execution Successful</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-slate-300">
                  <p>✓ Test Case 1: [2, 7, 11, 15], Target = 9 → Output: [0, 1] (Passed)</p>
                  <p>✓ Test Case 2: [3, 2, 4], Target = 6 → Output: [1, 2] (Passed)</p>
                  <p>✓ Test Case 3: [3, 3], Target = 6 → Output: [0, 1] (Passed)</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-3 text-indigo-300">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>AI Insight: Your hash map lookup optimized execution time by 94% over nested loop brute force.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CodeEditorPreview;
