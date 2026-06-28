import React, { useState, useMemo } from 'react';

const AdminDataTable = ({ 
  title, 
  data, 
  columns, 
  loading, 
  onAction,
  onAdd,
  searchPlaceholder = "Search...",
  searchableKeys = ['name', 'email']
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => 
      searchableKeys.some(key => 
        String(item[key]).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, searchableKeys]);

  // Paginate Data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  if (loading) {
    return (
      <div className="bg-[#080812] border border-white/5 rounded-3xl p-8 w-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#2015FF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Loading {title}...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#080812] border border-white/5 rounded-3xl p-6 md:p-8 w-full">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Total Records: {filteredData.length}
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
              className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#2015FF] transition-colors"
            />
          </div>
          {onAdd && (
            <button
              onClick={onAdd}
              className="px-5 py-3 bg-[#2015FF] hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-[#2015FF]/20 flex items-center gap-2 whitespace-nowrap"
            >
              + Add New
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map((col, idx) => (
                <th key={idx} className="pb-4 text-xs font-black text-gray-500 uppercase tracking-wider px-4 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-500 font-medium">
                  No records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="py-4 px-4 text-sm text-gray-300">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm font-bold disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            Previous
          </button>
          
          <div className="text-sm font-bold text-gray-500">
            Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
          </div>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm font-bold disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDataTable;
