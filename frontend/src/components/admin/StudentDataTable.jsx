import React, { useState, useMemo } from 'react';
import { Search, Filter, MoreVertical, Shield, ShieldOff, Ban, RotateCcw, Download, CheckSquare, Square, Trash2, Mail } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

const StudentDataTable = ({ 
  data, 
  loading,
  onView,
  onVerify,
  onSuspend,
  onDelete,
  onRestore,
  onNotify,
  onBulkAction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  
  // Basic Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');

  const itemsPerPage = 15;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedData.map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const executeBulkAction = (action) => {
    if (selectedIds.size === 0) return;
    onBulkAction(Array.from(selectedIds), action);
    setSelectedIds(new Set());
  };

  // Filter & Sort Logic
  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.email.toLowerCase().includes(q) || 
        item.phone.includes(q) ||
        item.college.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Verification Filter
    if (verificationFilter !== 'all') {
      const isVerified = verificationFilter === 'verified';
      result = result.filter(item => item.is_verified === isVerified);
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'created_at' || sortConfig.key === 'last_login') {
          aVal = new Date(aVal || 0).getTime();
          bVal = new Date(bVal || 0).getTime();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, statusFilter, verificationFilter, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const StatusBadge = ({ status, isVerified }) => {
    if (status === 'suspended') return <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-bold uppercase">Suspended</span>;
    if (status === 'deleted') return <span className="px-2 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded text-[10px] font-bold uppercase">Deleted</span>;
    if (isVerified) return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase">Verified</span>;
    return <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold uppercase">Active</span>;
  };

  if (loading) {
    return (
      <div className="bg-[#0A0A10] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#2015FF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Loading Students...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A10] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search students by name, email, college..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#12121A] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#2015FF] transition-colors"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-[#12121A] border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-[#2015FF]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
          <select 
            value={verificationFilter}
            onChange={e => { setVerificationFilter(e.target.value); setCurrentPage(1); }}
            className="bg-[#12121A] border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-[#2015FF]"
          >
            <option value="all">All Verifications</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 animate-[fade-in_0.2s_ease-out]">
            <span className="text-sm font-bold text-[#2015FF] mr-2">{selectedIds.size} Selected</span>
            <button onClick={() => executeBulkAction('verify')} className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors tooltip" title="Bulk Verify"><Shield className="w-4 h-4" /></button>
            <button onClick={() => executeBulkAction('suspend')} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors tooltip" title="Bulk Suspend"><Ban className="w-4 h-4" /></button>
            <button onClick={() => executeBulkAction('delete')} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors tooltip" title="Bulk Delete"><Trash2 className="w-4 h-4" /></button>
            <button onClick={() => executeBulkAction('restore')} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors tooltip" title="Bulk Restore"><RotateCcw className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                  onChange={handleSelectAll}
                  className="accent-[#2015FF] w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white" onClick={() => requestSort('name')}>Student</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white" onClick={() => requestSort('college')}>Education</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white text-center" onClick={() => requestSort('profile_completion')}>Profile %</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white text-center" onClick={() => requestSort('applications_count')}>Apps</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white" onClick={() => requestSort('created_at')}>Joined</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500 font-medium">No students found matching your filters.</td>
              </tr>
            ) : (
              paginatedData.map(student => (
                <tr key={student.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${selectedIds.has(student.id) ? 'bg-[#2015FF]/5' : ''}`}>
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(student.id)}
                      onChange={() => handleSelectOne(student.id)}
                      className="accent-[#2015FF] w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2015FF]/20 to-purple-500/20 flex items-center justify-center border border-white/10 shrink-0">
                        <span className="font-black text-white text-sm">{student.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white hover:text-[#2015FF] cursor-pointer transition-colors" onClick={() => onView(student.id)}>{student.name}</div>
                        <div className="text-xs text-gray-500 font-medium">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-300 font-medium">{student.college || 'Not Specified'}</div>
                    <div className="text-xs text-gray-500">{student.course || 'No Course'} • {student.year || 'No Year'}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2015FF] rounded-full" style={{ width: `${student.profile_completion}%` }} />
                      </div>
                      <span className="text-xs font-bold text-white w-8">{student.profile_completion}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-sm font-black text-white bg-white/10 px-2.5 py-1 rounded-lg">{student.applications_count}</span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={student.status} isVerified={student.is_verified} />
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-300">{student.created_at ? formatDate(student.created_at, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}</div>
                    <div className="text-xs text-gray-500">Last login: {student.last_login ? formatDate(student.last_login, { month: 'short', day: 'numeric' }) : 'Never'}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onView(student.id)} className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
                        View
                      </button>
                      <button onClick={() => onNotify(student.id)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors" title="Send Notification">
                        <Mail className="w-4 h-4" />
                      </button>
                      
                      <div className="relative group inline-block">
                        <button className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-40 bg-[#12121A] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col overflow-hidden py-1">
                          {!student.is_verified && <button onClick={() => onVerify(student.id)} className="text-left px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10">Verify Student</button>}
                          {student.status === 'active' && <button onClick={() => onSuspend(student.id)} className="text-left px-4 py-2 text-xs font-bold text-yellow-500 hover:bg-yellow-500/10">Suspend</button>}
                          {student.status === 'suspended' && <button onClick={() => onRestore(student.id)} className="text-left px-4 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/10">Reactivate</button>}
                          {student.status !== 'deleted' && <button onClick={() => onDelete(student.id)} className="text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10">Delete</button>}
                          {student.status === 'deleted' && <button onClick={() => onRestore(student.id)} className="text-left px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10">Restore</button>}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} students</p>
          <div className="flex gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-1.5 bg-white/5 disabled:opacity-50 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors"
            >
              Prev
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1.5 bg-white/5 disabled:opacity-50 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDataTable;
