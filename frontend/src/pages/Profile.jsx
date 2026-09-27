import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const userName = user?.name || user?.email || 'Student';

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 bg-[#f8fafc] min-h-screen font-sans text-gray-900">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Profile</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Manage your personal information, skills, and account details.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
          👤
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Canvas Ready</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Logged in as <span className="font-semibold text-gray-700">{userName}</span>. This module's internal layout has been reset to a clean canvas. Ready to connect to the new database architecture.
        </p>
      </div>
    </div>
  );
};

export default Profile;
