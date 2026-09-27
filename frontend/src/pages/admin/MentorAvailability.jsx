import React from 'react';
import MentorLayout from '../../components/layouts/MentorLayout';

const MentorAvailability = () => {
  return (
    <MentorLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Availability Settings</h1>
          <p className="text-gray-500 font-medium">Manage your online status and working hours.</p>
        </header>

        <div className="bg-[#080812] border border-white/5 rounded-2xl p-12 text-center">
          <span className="text-4xl block mb-4">🕒</span>
          <h3 className="text-white font-bold text-xl mb-2">Coming Soon</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            The ability to set custom working hours and automated out-of-office replies is currently under development. 
            For now, you are marked as "Available" to receive automated query assignments.
          </p>
        </div>
      </div>
    </MentorLayout>
  );
};

export default MentorAvailability;
