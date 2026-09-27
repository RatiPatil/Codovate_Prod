import React, { useRef } from 'react';
import { DataTable } from '../../../components/admin/ui/DataTable';
import { organizationsApi } from '../../../api/organizationsApi';
import { Badge } from '../../../components/admin/ui/Badge';
import { Edit, Archive, CheckCircle, Trash } from 'lucide-react';

export const OrganizationList = ({ onEdit, onRefreshMetrics }) => {
  const tableRef = useRef(null);

  const fetchOrganizations = async ({ limit, cursor, search }) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    if (search) params.search = search;
    
    const res = await organizationsApi.getOrganizations(params);
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
      await organizationsApi.changeLifecycle(id, status);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to DELETE this organization? (Soft Delete)')) return;
    try {
      await organizationsApi.deleteOrganization(id);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) {
      alert('Failed to delete organization');
    }
  };

  const columns = [
    { 
      header: 'Organization', 
      key: 'name', 
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">{val}</span>
          {row.code && <span className="text-xs text-gray-500 font-mono">{row.code}</span>}
        </div>
      )
    },
    { 
      header: 'Type', 
      key: 'type', 
      render: (val) => <span className="capitalize">{val?.replace('_', ' ')}</span>
    },
    { 
      header: 'Location', 
      key: 'city', 
      render: (val, row) => <span className="text-sm text-gray-600 dark:text-gray-400">{val ? `${val}, ${row.country || ''}` : '-'}</span>
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
        title="Organizations Directory"
        columns={columns}
        fetchData={fetchOrganizations}
        enableSelection={true}
        enableSearch={true}
      />
    </div>
  );
};
