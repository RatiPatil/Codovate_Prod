import { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

const FAQSection = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openIndex, setOpenIndex] = useState(0);

  const categories = [
    { id: 'general', label: 'General' },
    { id: 'platform', label: 'Platform & AI' },
    { id: 'placements', label: 'Placements & Mentors' },
    { id: 'access', label: 'Access & Free Tier' },
  ];

  const faqs = {
    general: [
      {
        q: 'What makes Codovate different from traditional coding platforms?',
        a: 'Codovate is an integrated career ecosystem. Instead of isolated problem sets, Codovate links your learning roadmaps, coding practice, full-stack projects, and resume building into one AI-driven platform that dynamically adapts to your target goals.',
      },
      {
        q: 'Is Codovate suitable for absolute beginners?',
        a: 'Yes! Codovate provides step-by-step foundational modules starting from C++, Java, and Python basics, gradually scaling up to advanced Data Structures, Algorithms, and System Design.',
      },
      {
        q: 'How does the AI Career Engine work?',
        a: 'Our AI analyzes your code submissions, quiz performances, and assessment speed to identify skill gaps and automatically generate targeted daily recommendations.',
      },
    ],
    platform: [
      {
        q: 'Can I write and execute code inside the browser?',
        a: 'Yes, Codovate includes a full browser-based IDE supporting C++, Java, Python, TypeScript, and Go with automated sandboxed execution and unit test evaluation.',
      },
      {
        q: 'Does Codovate support collaborative team projects?',
        a: 'Yes! The Project Hub allows you to create or join student project teams, manage tasks with Git integrations, and build portfolio-ready applications together.',
      },
    ],
    placements: [
      {
        q: 'How do mentor office hours and referrals work?',
        a: 'Verified mentors from companies like Amazon, Google, and Microsoft host weekly office hours. Top performers in Codovate assessment benchmarks receive direct job referral opportunities.',
      },
      {
        q: 'What is the ATS Resume Builder score?',
        a: 'Our AI resume parser evaluates your resume formatting, keyword density, and project descriptions against top ATS systems (Greenhouse, Lever) to ensure maximum recruiter pass rates.',
      },
    ],
    access: [
      {
        q: 'Is there a free tier available on Codovate?',
        a: 'Yes! All core CS articles, basic coding practice problems, and community features are 100% free forever.',
      },
      {
        q: 'Can colleges or institutions partner with Codovate?',
        a: 'Yes, Codovate offers a dedicated College Administration portal for universities to track student progress, conduct batch assessments, and manage campus placement drives.',
      },
    ],
  };

  const currentFaqs = faqs[activeCategory] || faqs.general;

  const toggleAccordion = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-base">
            Everything you need to know about the Codovate platform, features, and career programs.
          </p>
        </div>

        {/* FAQ Container Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Categories Selector */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCategory(c.id);
                  setOpenIndex(0);
                }}
                className={`w-full text-left px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 shrink-0 ${
                  activeCategory === c.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Right Accordion List */}
          <div className="lg:col-span-8 space-y-4">
            {currentFaqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleAccordion(i)}
                    className="w-full p-5 text-left font-bold text-slate-900 text-sm sm:text-base flex items-center justify-between gap-4 hover:text-indigo-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100/80">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
