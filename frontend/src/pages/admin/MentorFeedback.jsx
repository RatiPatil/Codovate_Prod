import React from 'react';
import MentorLayout from '../../components/layouts/MentorLayout';

const MentorFeedback = () => {
  return (
    <MentorLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Student Feedback</h1>
          <p className="text-gray-500 font-medium">Review ratings and comments from your previous sessions.</p>
        </header>

        <div className="bg-[#080812] border border-white/5 rounded-2xl p-12 text-center">
          <span className="text-4xl block mb-4">⭐</span>
          <h3 className="text-white font-bold text-xl mb-2">Feedback System is Syncing</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            The structured feedback database is currently being rolled out. In the meantime, you can see a summary of your recent top ratings on your Dashboard overview!
          </p>
        </div>
      </div>
    </MentorLayout>
  );
};

export default MentorFeedback;
