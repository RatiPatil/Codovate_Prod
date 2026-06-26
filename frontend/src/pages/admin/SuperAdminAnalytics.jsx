import React from 'react';

const SuperAdminAnalytics = () => {
  return (
    <div className="p-8">
      <div className="bg-[#080812] border border-white/5 rounded-3xl p-12 text-center max-w-2xl mx-auto mt-12">
        <div className="text-6xl mb-6">📈</div>
        <h2 className="text-3xl font-black text-white mb-4">Advanced Analytics</h2>
        <p className="text-gray-400">
          We are currently integrating a new OLAP pipeline to handle deep-dive platform analytics. 
          For now, please refer to the main Dashboard for real-time KPIs.
        </p>
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;
