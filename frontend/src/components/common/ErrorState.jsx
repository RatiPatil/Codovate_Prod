import React from 'react';

const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-2xl mb-4 border border-red-500/20">
        ⚠️
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Failed to Load</h3>
      <p className="text-gray-400 text-sm max-w-sm mb-6">{message || "We encountered an error while loading this data."}</p>
      
      {onRetry ? (
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all text-white"
        >
          Try Again
        </button>
      ) : (
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all text-white"
        >
          Refresh Page
        </button>
      )}
    </div>
  );
};

export default ErrorState;
