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
    <div className="min-h-screen bg-[#FCFDFF] dark:bg-[#080A12] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden transition-colors duration-300">
      {/* Centered Ambient Atmospheric Glow Element */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/25 to-purple-600/30 dark:from-blue-600/25 dark:via-indigo-600/30 dark:to-purple-600/35 blur-3xl transition-opacity duration-700"
      />

      {/* Grid Pattern Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.035] z-0"
        style={{
          backgroundImage: `radial-gradient(#6366F1 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Centered Desktop 2-Column Grid Container (max-width: 1050px) */}
      <div className="w-full max-w-[1050px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-4 sm:py-6">
        {/* LEFT SIDE: Brand, Logo & Coding Visual */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 select-none pr-4">
          {brandPanel}
        </div>

        {/* RIGHT SIDE: Compact Focused Auth Form Surface */}
        <div className="flex flex-col justify-center items-center w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
