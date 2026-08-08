import { useState, useEffect } from 'react';

const AuthLayout = ({ children, brandPanel }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFDFF] dark:bg-[#080A12] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans overflow-x-hidden relative transition-colors duration-300">
      {/* Background Subtle Ambient Radial Purple/Blue Glows (Accent only) */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-purple-500/8 dark:bg-purple-600/12 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[380px] h-[380px] bg-blue-500/8 dark:bg-indigo-600/12 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Grid Pattern Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.035] z-0"
        style={{
          backgroundImage: `radial-gradient(#6366F1 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* LEFT SIDE: Brand Panel with Logo & Coding Visual (Desktop ~40%) */}
      <div className="hidden lg:flex w-full lg:w-[40%] flex-col justify-between p-8 lg:p-10 relative z-10 select-none border-r border-slate-200/50 dark:border-slate-800/40">
        {brandPanel}
      </div>

      {/* RIGHT SIDE: Compact Focused Auth Form Surface (~60%) */}
      <div className="w-full lg:w-[60%] flex flex-col justify-center items-center p-5 sm:p-8 lg:p-10 relative z-10 my-auto py-8">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
