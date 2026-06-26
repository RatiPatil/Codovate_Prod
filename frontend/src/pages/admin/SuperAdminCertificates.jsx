import React from 'react';

const SuperAdminCertificates = () => {
  return (
    <div className="p-8">
      <div className="bg-[#080812] border border-white/5 rounded-3xl p-12 text-center max-w-2xl mx-auto mt-12">
        <div className="text-6xl mb-6">📜</div>
        <h2 className="text-3xl font-black text-white mb-4">Certificate Authority</h2>
        <p className="text-gray-400">
          The certificate verification engine is currently being upgraded to support blockchain-based issuance. 
          Check back later for the new certificate dashboard.
        </p>
      </div>
    </div>
  );
};

export default SuperAdminCertificates;
