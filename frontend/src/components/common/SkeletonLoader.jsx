import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 3 }) => {
  const renderSkeletons = () => {
    return Array(count).fill(0).map((_, idx) => (
      <div key={idx} className={`glass-panel p-6 rounded-2xl animate-pulse ${type === 'list' ? 'flex items-center gap-4' : ''}`}>
        {type === 'card' && (
          <div className="space-y-4">
            <div className="h-6 bg-white/10 rounded w-2/3"></div>
            <div className="h-4 bg-white/5 rounded w-1/2"></div>
            <div className="h-4 bg-white/5 rounded w-full"></div>
            <div className="h-4 bg-white/5 rounded w-full"></div>
            <div className="pt-4 flex gap-2">
              <div className="h-8 bg-white/10 rounded w-24"></div>
              <div className="h-8 bg-white/10 rounded w-24"></div>
            </div>
          </div>
        )}
        
        {type === 'list' && (
          <>
            <div className="w-12 h-12 bg-white/10 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="h-3 bg-white/5 rounded w-1/4"></div>
            </div>
            <div className="w-20 h-8 bg-white/10 rounded"></div>
          </>
        )}
      </div>
    ));
  };

  return (
    <div className={`grid gap-4 w-full ${type === 'card' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {renderSkeletons()}
    </div>
  );
};

export default SkeletonLoader;
