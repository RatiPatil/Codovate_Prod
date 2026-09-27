import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

const FAQSection = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openIndex, setOpenIndex] = useState(0);

  const categories = [
    { id: 'general', label: 'General' },
    { id: 'curriculum', label: 'Learning & DSA' },
    { id: 'projects', label: 'Projects & Hub' },
    { id: 'career', label: 'Career & Placements' },
  ];

  const faqs = {
    general: [
      {
        q: 'What is Codovate?',
        a: 'Codovate is an integrated student career platform that combines AI career roadmaps, structured computer science learning, production project building, and placement preparation into one system.',
      },
      {
        q: 'Is Codovate suitable for beginners?',
        a: 'Yes! Our structured learning paths start from foundational programming concepts and progress step-by-step to advanced system design and AI engineering.',
      },
      {
        q: 'How does Codovate differ from generic video platforms?',
        a: 'Codovate provides an interactive, auto-evaluated coding environment, real team workspaces, AI career diagnostics, and live progress synchronization.',
      },
    ],
    curriculum: [
      {
        q: 'How are the DSA problems structured?',
        a: 'Problems are grouped by core algorithmic patterns (Sliding Window, Two Pointers, Dynamic Programming, Graphs) with automated time/space complexity evaluation.',
      },
      {
        q: 'Does Codovate cover core computer science subjects?',
        a: 'Yes, Codovate includes curated modules for Operating Systems, DBMS, Computer Networks, and System Design fundamentals.',
      },
    ],
    projects: [
      {
        q: 'What type of projects will I build?',
        a: 'You will construct production-ready applications including AI document search agents, real-time collaborative whiteboards, full-stack portals, and FastAPI data pipelines.',
      },
      {
        q: 'Can I collaborate with other students?',
        a: 'Yes! Project Hub provides team workspace tools where you can build together with peers.',
      },
    ],
    career: [
      {
        q: 'How does the ATS Resume Review work?',
        a: 'Our AI engine analyzes your resume content, layout, and keywords against top tech role descriptions to provide actionable optimization suggestions.',
      },
      {
        q: 'Are the Mock AI Interviews interactive?',
        a: 'Yes! You can practice technical and behavioral interview scenarios with real-time feedback on your code and explanations.',
      },
    ],
  };

  const currentFaqs = faqs[activeCategory] || faqs.general;

  return (
    <section id="faq" className="py-14 sm:py-16 md:py-20 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Frequently Asked Questions.
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base">
            Everything you need to know about the Codovate platform and learning experience.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-center flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveCategory(c.id);
                setOpenIndex(0);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === c.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Accordion Items */}
        <div className="space-y-3">
          {currentFaqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl bg-white/90 dark:bg-[#111522]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white text-sm sm:text-base hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
