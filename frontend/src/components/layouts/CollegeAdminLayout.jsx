import React, { useState } from 'react';
import CollegeAdminSidebar from './sidebars/CollegeAdminSidebar';

const CollegeAdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#050510] overflow-hidden">
      {/* College Admin uses an emerald tint to distinguish it visually */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <CollegeAdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="md:hidden flex items-center justify-between px-4 py-3.5 bg-[#050510] border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.5)]">C</div>
            <div>
              <span className="text-white font-black text-sm tracking-tight">CODOVATE</span>
              <span className="text-emerald-500 text-[9px] font-bold uppercase ml-2">College</span>
            </div>
          </div>
          <button onClick={() => setMobileOpen(true)} className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollegeAdminLayout;
