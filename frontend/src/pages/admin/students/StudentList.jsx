import React, { useRef } from 'react';
import { DataTable } from '../../../components/admin/ui/DataTable';
import { studentsApi } from '../../../api/studentsApi';
import { Badge } from '../../../components/admin/ui/Badge';
import { Edit, Archive, CheckCircle, Trash, ExternalLink } from 'lucide-react';

export const StudentList = ({ onEdit, onRefreshMetrics }) => {
  const tableRef = useRef(null);

  const fetchStudents = async ({ limit, cursor, search }) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    if (search) params.search = search;
    
    const res = await studentsApi.getStudents(params);
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
      await studentsApi.changeLifecycle(id, status);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to DELETE this student? (Soft Delete)')) return;
    try {
      await studentsApi.deleteStudent(id);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  const columns = [
    { 
      header: 'Student Profile', 
      key: 'name', 
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">{val || row.email}</span>
          <span className="text-xs text-gray-500 font-mono">
            {row.prn || 'NO-PRN'}
          </span>
        </div>
      )
    },
    { 
      header: 'Readiness', 
      key: 'placementReadiness', 
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 max-w-[80px]">
            <div className={`h-2 rounded-full ${val >= 80 ? 'bg-green-500' : val >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${val || 0}%` }}></div>
          </div>
          <span className="text-xs text-gray-600">{val || 0}%</span>
        </div>
      )
    },
    { 
      header: 'CGPA', 
      key: 'cgpa', 
      render: (val) => <span className="font-mono text-sm">{val ? parseFloat(val).toFixed(2) : '-'}</span>
    },
    { 
      header: 'Status', 
      key: 'recordStatus', 
      render: (val) => {
        const variants = {
          ACTIVE: 'success',
          PLACED: 'indigo',
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
          <button onClick={() => onEdit(row)} className="p-1 text-gray-500 hover:text-indigo-600 transition-colors" title="Edit Profile">
            <Edit className="w-4 h-4" />
          </button>
          
          <button className="p-1 text-gray-500 hover:text-blue-600 transition-colors" title="View Dashboard (Mock)">
            <ExternalLink className="w-4 h-4" />
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
        title="Student Directory"
        columns={columns}
        fetchData={fetchStudents}
        enableSelection={true}
        enableSearch={true}
      />
    </div>
  );
};
