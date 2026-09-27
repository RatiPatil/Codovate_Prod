import React, { useRef } from 'react';
import { DataTable } from '../../../components/admin/ui/DataTable';
import { collegesApi } from '../../../api/collegesApi';
import { Badge } from '../../../components/admin/ui/Badge';
import { Edit, Archive, CheckCircle, Trash } from 'lucide-react';

export const CollegeList = ({ onEdit, onRefreshMetrics }) => {
  const tableRef = useRef(null);

  const fetchColleges = async ({ limit, cursor, search }) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    if (search) params.search = search;
    
    const res = await collegesApi.getColleges(params);
    return {
      data: res.data.data,
      pagination: {
        nextCursor: res.data.pagination?.nextCursor
      }
    };
  };

  const handleLifecycle = async (id, status) => {
    if (!window.confirm(`Are you sure you want to change status to ${status}?`)) return;
    try {
      await collegesApi.changeLifecycle(id, status);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to DELETE this college? (Soft Delete)')) return;
    try {
      await collegesApi.deleteCollege(id);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) {
      alert('Failed to delete college');
    }
  };

  const columns = [
    { 
      header: 'College Details', 
      key: 'name', 
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">{val}</span>
          <span className="text-xs text-gray-500 font-mono">
            {row.collegeCode || 'NO-CODE'} {row.aicteCode ? `| ${row.aicteCode}` : ''}
          </span>
        </div>
      )
    },
    { 
      header: 'University', 
      key: 'university', 
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-sm">{val || '-'}</span>
          {row.autonomousStatus && <span className="text-xs text-indigo-600 font-medium">Autonomous</span>}
        </div>
      )
    },
    { 
      header: 'Location', 
      key: 'city', 
      render: (val, row) => <span className="text-sm text-gray-600 dark:text-gray-400">{val ? `${val}, ${row.state || ''}` : '-'}</span>
    },
    { 
      header: 'Status', 
      key: 'recordStatus', 
      render: (val) => {
        const variants = {
          ACTIVE: 'success',
          ARCHIVED: 'warning',
          SUSPENDED: 'danger',
          DELETED: 'default'
        };
        return <Badge variant={variants[val] || 'default'}>{val || 'ACTIVE'}</Badge>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(row)} className="p-1 text-gray-500 hover:text-indigo-600 transition-colors" title="Edit">
            <Edit className="w-4 h-4" />
          </button>
          
          {(!row.recordStatus || row.recordStatus === 'ACTIVE') ? (
            <button onClick={() => handleLifecycle(row.id, 'ARCHIVED')} className="p-1 text-gray-500 hover:text-yellow-600 transition-colors" title="Archive">
              <Archive className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => handleLifecycle(row.id, 'ACTIVE')} className="p-1 text-gray-500 hover:text-green-600 transition-colors" title="Restore">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          <button onClick={() => handleDelete(row.id)} className="p-1 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
            <Trash className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="h-[600px] w-full">
      <DataTable 
        ref={tableRef}
        title="College Directory"
        columns={columns}
        fetchData={fetchColleges}
        enableSelection={true}
        enableSearch={true}
      />
    </div>
  );
};
