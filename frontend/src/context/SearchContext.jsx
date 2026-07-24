import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => {
    setIsSearchOpen(false);
    setGlobalSearchQuery('');
  };

  return (
    <SearchContext.Provider value={{
      isSearchOpen,
      openSearch,
      closeSearch,
      globalSearchQuery,
      setGlobalSearchQuery
    }}>
      {children}
    </SearchContext.Provider>
  );
};
