import React from 'react';

const SuperAdminSystem = () => {
  return (
    <div className="p-8">
      <div className="bg-[#080812] border border-white/5 rounded-3xl p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-black text-white mb-8 border-b border-white/5 pb-4">System Health</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">API Server</h3>
              <p className="text-sm text-gray-500">Node.js Express</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 font-bold text-sm">Operational</span>
            </div>
          </div>

          <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">Database</h3>
              <p className="text-sm text-gray-500">Firebase Firestore</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 font-bold text-sm">Operational</span>
            </div>
          </div>

          <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">Real-time Socket</h3>
              <p className="text-sm text-gray-500">Socket.io</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 font-bold text-sm">Operational</span>
            </div>
          </div>

          <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">Storage</h3>
              <p className="text-sm text-gray-500">Firebase Storage</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 font-bold text-sm">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSystem;
