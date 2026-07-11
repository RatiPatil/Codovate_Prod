import React from 'react';
import SuperAdminSidebar from './sidebars/SuperAdminSidebar';

const SuperAdminLayout = ({ children }) => {
  return (
    <div className="flex h-[100dvh] bg-[#030308] overflow-hidden">
      {/* Deep space ambient glow - Super Admin uses primary color */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#3B82F6]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#3B82F6]/5 blur-[120px] pointer-events-none" />

      <SuperAdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10 w-full">
        {/* Children fill remaining space */}
        <main className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
