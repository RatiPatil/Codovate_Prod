import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const AuthLayout = ({ children, brandPanel }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark'
      );
    }
    return false;
  });

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    if (nextIsDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFDFF] dark:bg-[#080A12] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans overflow-x-hidden relative transition-colors duration-300">
      {/* Background Ambient Radial Purple/Blue Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-blue-500/10 dark:bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Grid Pattern Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.04] z-0"
        style={{
          backgroundImage: `radial-gradient(#6366F1 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Right Floating Theme Toggle */}
      <div className="absolute top-5 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white/80 dark:bg-[#111522]/80 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs backdrop-blur-md transition-all duration-200 hover:scale-105"
          aria-label="Toggle theme"
          title="Toggle Light / Dark Mode"
        >
          {isDark ? (
            <Sun className="w-4.5 h-4.5 text-amber-400" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-slate-600" />
          )}
        </button>
      </div>

      {/* LEFT SIDE: Brand & Value Prop Panel (Desktop 45%) */}
      <div className="hidden lg:flex w-full lg:w-[45%] flex-col justify-between p-10 lg:p-12 relative z-10 select-none border-r border-slate-200/50 dark:border-slate-800/40">
        {brandPanel}
      </div>

      {/* RIGHT SIDE: Auth Card Form Panel (Desktop 55%) */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-5 sm:p-8 lg:p-12 relative z-10 my-auto py-8">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
