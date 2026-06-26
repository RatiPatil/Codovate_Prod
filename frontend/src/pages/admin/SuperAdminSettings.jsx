import React from 'react';

const SuperAdminSettings = () => {
  return (
    <div className="p-8">
      <div className="bg-[#080812] border border-white/5 rounded-3xl p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-black text-white mb-8 border-b border-white/5 pb-4">Platform Settings</h2>
        
        <div className="space-y-6 text-gray-400">
          <p>Global platform configuration is restricted to production environment variables.</p>
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-sm font-medium">
            Contact infrastructure team for environment variable updates.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
