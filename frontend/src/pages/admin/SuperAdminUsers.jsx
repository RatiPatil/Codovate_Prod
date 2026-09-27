import React, { useState, useEffect, useMemo } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

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
      { label: 'Suspended', value: 'suspended' },
      { label: 'Inactive', value: 'inactive' }
    ]
  },
  { name: 'college_id', label: 'College ID (Optional)', type: 'text', required: false },
  { name: 'company_id', label: 'Company ID (Optional)', type: 'text', required: false }
];

const SuperAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterTab, setFilterTab] = useState('all');

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

  const handleSuspend = async (id) => {
    const confirmed = await showConfirm(
      "Are you sure you want to suspend this user? They will not be able to log in or use the application until you reactivate their account."
    );
    if (!confirmed) return;

    try {
      await api.put(`/admin/users/${id}/suspend`);
      fetchUsers();
    } catch (err) {
      showAlert("Failed to suspend user");
    }
  };

  const handleUnsuspend = async (id) => {
    const confirmed = await showConfirm(
      "Are you sure you want to unsuspend this user? They will regain full access."
    );
    if (!confirmed) return;

    try {
      await api.put(`/admin/users/${id}/unsuspend`);
      fetchUsers();
    } catch (err) {
      showAlert("Failed to unsuspend user");
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

  const filteredUsers = useMemo(() => {
    if (filterTab === 'active') {
      return users.filter(u => u.status === 'active');
    }
    if (filterTab === 'suspended') {
      return users.filter(u => u.status === 'suspended');
    }
    return users;
  }, [users, filterTab]);

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
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1.5 w-fit ${
          row.status === 'suspended' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
          row.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          row.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
          'bg-gray-500/10 text-gray-400 border border-gray-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            row.status === 'suspended' ? 'bg-red-400' :
            row.status === 'active' ? 'bg-emerald-400' :
            row.status === 'pending' ? 'bg-yellow-400' :
            'bg-gray-400'
          }`} />
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
          
          {row.status === 'suspended' ? (
            <button 
              onClick={() => handleUnsuspend(row.id)}
              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-colors"
            >
              Unsuspend
            </button>
          ) : (
            <button 
              onClick={() => handleSuspend(row.id)}
              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
            >
              Suspend
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'all' ? 'bg-[#2015FF] text-white shadow-lg shadow-[#2015FF]/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          All Users
        </button>
        <button
          onClick={() => setFilterTab('active')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          Active
        </button>
        <button
          onClick={() => setFilterTab('suspended')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTab === 'suspended' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          Suspended
        </button>
      </div>

      <AdminDataTable 
        title="Manage Users"
        data={filteredUsers}
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
