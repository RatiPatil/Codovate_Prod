import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';

const userSchema = [
  { name: 'name', label: 'Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email Address', type: 'email', required: true },
  { 
    name: 'role', 
    label: 'Role', 
    type: 'select', 
    required: true,
    options: [
      { label: 'Student', value: 'student' },
      { label: 'Mentor', value: 'mentor' },
      { label: 'College Admin', value: 'college_admin' },
      { label: 'Company Admin', value: 'company_admin' },
      { label: 'Super Admin', value: 'super_admin' },
    ]
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
      { label: 'Banned', value: 'banned' },
      { label: 'Inactive', value: 'inactive' }
    ]
  },
  { name: 'college_id', label: 'College ID (Optional)', type: 'text', required: false }
];

const SuperAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingUser) {
      await api.put(`/admin/users/${editingUser.id}`, formData);
    } else {
      await api.post('/admin/users', formData);
    }
    fetchUsers();
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Role', 
      render: (row) => (
        <span className="capitalize text-gray-300 font-medium">
          {row.role.replace('_', ' ')}
        </span>
      )
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.status === 'banned' ? 'bg-red-500/20 text-red-500' :
          row.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
          row.status === 'inactive' ? 'bg-gray-500/20 text-gray-500' :
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
          <button 
            onClick={() => handleEdit(row)}
            className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-xs font-bold transition-colors"
          >
            Edit
          </button>
          {row.status !== 'inactive' && (
            <button 
              onClick={() => handleDelete(row.id)}
              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      <AdminDataTable 
        title="Manage Users"
        data={users}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        searchPlaceholder="Search users by name or email..."
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingUser ? "Edit User" : "Add New User"}
        schema={userSchema}
        initialData={editingUser}
      />
    </div>
  );
};

export default SuperAdminUsers;
