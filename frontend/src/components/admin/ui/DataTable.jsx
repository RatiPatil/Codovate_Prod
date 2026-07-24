import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft, 
  Search, Filter, Download, MoreHorizontal, Loader2
} from 'lucide-react';
import { Button } from './Button';

/**
 * Enterprise DataTable
 * Handles generic data mapping, cursor-based pagination, sorting, and row selection.
 * 
 * @param {Array} columns - [{ key: 'id', header: 'ID', render: (val, row) => <jsx> }]
 * @param {Function} fetchData - async (params) => { data, nextCursor, total }
 * @param {Object} defaultFilters - Initial filters
 * @param {Function} onRowClick - Optional row click handler
 */
export const DataTable = ({
  columns = [],
  fetchData,
  defaultFilters = {},
  onRowClick,
  title = "Data",
  enableExport = true,
  enableSelection = false
}) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [cursors, setCursors] = useState([]); // Stack of previous cursors for 'Prev' button
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const limit = 20;

  // Sorting & Filtering
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  const loadData = async (cursorToFetch = null) => {
    setIsLoading(true);
    try {
      const response = await fetchData({
        limit,
        cursor: cursorToFetch,
        sort: sortConfig.key,
        order: sortConfig.direction,
        search: searchQuery,
        ...defaultFilters
      });
      
      setData(response.data || []);
      setNextCursor(response.pagination?.nextCursor || null);
      setCurrentCursor(cursorToFetch);
    } catch (err) {
      console.error('[DataTable] Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset pagination when sort or search changes
    setCursors([]);
    loadData(null);
  }, [sortConfig, searchQuery]); // add defaultFilters deep compare if needed

  const handleNextPage = () => {
    if (nextCursor) {
      setCursors([...cursors, currentCursor]);
      loadData(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (cursors.length > 0) {
      const previousCursors = [...cursors];
      const prevCursor = previousCursors.pop();
      setCursors(previousCursors);
      loadData(prevCursor);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.size === data.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(data.map(row => row.id)));
    }
  };

  const toggleSelectRow = (id) => {
    const newSet = new Set(selectedRowIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRowIds(newSet);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col h-full">
      
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50 dark:bg-gray-800/50">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white hidden sm:block">{title}</h2>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button variant="secondary" leftIcon={Filter} className="hidden sm:flex">Filters</Button>
          {enableExport && <Button variant="ghost" leftIcon={Download} className="hidden sm:flex">Export</Button>}
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              {enableSelection && (
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={data.length > 0 && selectedRowIds.size === data.length}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className={`p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr 
                  key={row.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={(e) => {
                    // Prevent triggering row click if they clicked the checkbox
                    if (e.target.type !== 'checkbox' && onRowClick) onRowClick(row);
                  }}
                >
                  {enableSelection && (
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedRowIds.has(row.id)}
                        onChange={() => toggleSelectRow(row.id)}
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} className="p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {selectedRowIds.size > 0 ? (
            <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedRowIds.size} selected</span>
          ) : (
            <span>Showing limit: {limit}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            disabled={cursors.length === 0 || isLoading}
            onClick={handlePrevPage}
            leftIcon={ChevronLeft}
          >
            Prev
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            disabled={!nextCursor || isLoading}
            onClick={handleNextPage}
            rightIcon={ChevronRight}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
