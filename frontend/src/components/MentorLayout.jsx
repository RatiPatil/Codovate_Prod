import React from 'react';
import MentorSidebar from './MentorSidebar';

const MentorLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#050510] font-sans">
      <MentorSidebar />
      <main className="flex-1 flex flex-col relative max-h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default MentorLayout;
