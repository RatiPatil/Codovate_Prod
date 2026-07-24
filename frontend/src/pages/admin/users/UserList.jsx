import React, { useRef, useState } from 'react';
import { DataTable } from '../../../components/admin/ui/DataTable';
import { usersApi } from '../../../api/usersApi';
import { Badge } from '../../../components/admin/ui/Badge';
import { Button } from '../../../components/admin/ui/Button';
import { Edit, Ban, CheckCircle, Trash } from 'lucide-react';

export const UserList = ({ onEdit, onRefreshMetrics }) => {
  const tableRef = useRef(null);

  const fetchUsers = async ({ limit, cursor, search, sortBy, sortDesc }) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    if (search) params.search = search;
    
    // Sort implementation handled by backend if params passed
    
    const res = await usersApi.getUsers(params);
    return {
      data: res.data.data,
      pagination: {
        nextCursor: res.data.pagination?.nextCursor
      }
    };
  };

  const handleLifecycle = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this user?`)) return;
    try {
      await usersApi.changeLifecycle(id, status);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to DELETE this user? (Soft Delete)')) return;
    try {
      await usersApi.deleteUser(id);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const columns = [
    { 
      header: 'Name', 
      key: 'name', 
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">{val || 'Unnamed User'}</span>
          <span className="text-xs text-gray-500">{row.email}</span>
        </div>
      )
    },
    { 
      header: 'Role', 
      key: 'role', 
      render: (val) => <Badge variant="primary">{val}</Badge>
    },
    { 
      header: 'Organization', 
      key: 'orgId', 
      render: (val) => val ? <span className="text-sm font-mono">{val}</span> : <span className="text-gray-400">-</span>
    },
    { 
      header: 'Status', 
      key: 'recordStatus', 
      render: (val) => {
        const variants = {
          ACTIVE: 'success',
          SUSPENDED: 'warning',
          LOCKED: 'danger',
          DISABLED: 'danger',
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
            <button onClick={() => handleLifecycle(row.id, 'SUSPENDED')} className="p-1 text-gray-500 hover:text-yellow-600 transition-colors" title="Suspend">
              <Ban className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => handleLifecycle(row.id, 'ACTIVE')} className="p-1 text-gray-500 hover:text-green-600 transition-colors" title="Restore/Activate">
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
        title="Enterprise Users"
        columns={columns}
        fetchData={fetchUsers}
        enableSelection={true}
        enableSearch={true}
      />
    </div>
  );
};
