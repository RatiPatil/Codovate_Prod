import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import api from '../../api/axios';

const SuperAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      // Filter for standard students
      setUsers(response.data.filter(u => u.role === 'student'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await api.put(`/admin/users/${id}/status`, { status });
      // Optimistically update
      setUsers(users.map(u => u.id === id ? { ...u, status } : u));
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'College ID', accessor: 'college_id' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.status === 'banned' ? 'bg-red-500/20 text-red-500' :
          row.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
          'bg-emerald-500/20 text-emerald-500'
        }`}>
          {row.status || 'active'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.status !== 'banned' ? (
            <button 
              onClick={() => handleAction(row.id, 'banned')}
              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
            >
              Ban
            </button>
          ) : (
            <button 
              onClick={() => handleAction(row.id, 'active')}
              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-colors"
            >
              Unban
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-8">
      <AdminDataTable 
        title="Manage Students"
        data={users}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search students by name or email..."
      />
    </div>
  );
};

export default SuperAdminUsers;
