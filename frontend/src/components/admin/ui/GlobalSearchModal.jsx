import React, { useEffect, useRef } from 'react';
import { useSearch } from "../../../context/SearchContext";
import { Search, X } from 'lucide-react';

const GlobalSearchModal = () => {
  const { closeSearch, globalSearchQuery, setGlobalSearchQuery } = useSearch();
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();

    // Close on Escape
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSearch]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-gray-900/50 backdrop-blur-sm">
      {/* Click away overlay */}
      <div className="absolute inset-0" onClick={closeSearch} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Input Area */}
        <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-4 py-4 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 text-lg"
            placeholder="Search users, roles, organizations..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
          />
          <button 
            onClick={closeSearch}
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area (Placeholder) */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {globalSearchQuery.length > 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Searching for "{globalSearchQuery}"...</p>
              <p className="text-sm mt-2">Global Search Engine integration pending.</p>
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p className="font-medium mb-2 uppercase tracking-wider text-xs">Recent Searches</p>
              <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md cursor-pointer">
                <Search className="w-4 h-4" />
                <span>Super Admin Role</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GlobalSearchModal;
