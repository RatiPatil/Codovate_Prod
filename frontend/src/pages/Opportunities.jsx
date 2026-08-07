import React from 'react';

const Opportunities = () => {
  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 bg-[#f8fafc] min-h-screen font-sans text-gray-900">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Browse internships, full-time roles, and technical projects.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
          💼
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Opportunities Canvas Ready</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          This module's internal layout has been reset to a clean canvas. Ready to connect to the new database architecture.
        </p>
      </div>
    </div>
  );
};

export default Opportunities;