import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const collegeSchema = [
  { name: 'name', label: 'Institution Name', type: 'text', required: true },
  { name: 'domain', label: 'Email Domain (e.g., mit.edu)', type: 'text', required: true },
  { name: 'admin_email', label: 'Admin Contact Email', type: 'email', required: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
      { label: 'Suspended', value: 'suspended' }
    ]
  }
];

const SuperAdminColleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await api.get('/admin/colleges');
      setColleges(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCollege(null);
    setModalOpen(true);
  };

  const handleEdit = (college) => {
    setEditingCollege(college);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!await showConfirm("Are you sure you want to suspend this college?")) return;
    try {
      await api.delete(`/admin/colleges/${id}`);
      fetchColleges();
    } catch (err) {
      showAlert("Failed to delete college");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingCollege) {
      await api.put(`/admin/colleges/${editingCollege.id}`, formData);
    } else {
      await api.post('/admin/colleges', formData);
    }
    fetchColleges();
  };

  const columns = [
    { 
      header: 'College Name', 
      render: (row) => (
        <div>
          <p className="font-bold text-white">{row.name}</p>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5" title="Copy this ID to assign to a user">
            ID: {row.id}
          </p>
        </div>
      )
    },
    { header: 'Domain', accessor: 'domain' },
    { header: 'Admin Email', accessor: 'admin_email' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
          row.status === 'suspended' ? 'bg-red-500/20 text-red-500' :
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
          {row.status !== 'suspended' ? (
            <button 
              onClick={() => handleDelete(row.id)}
              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
            >
              Suspend
            </button>
          ) : (
            <button 
              onClick={async () => {
                if (!await showConfirm("Are you sure you want to unsuspend this college?")) return;
                try {
                  await api.put(`/admin/colleges/${row.id}`, { status: 'active' });
                  fetchColleges();
                } catch (err) {
                  showAlert("Failed to unsuspend college");
                }
              }}
              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-colors"
            >
              Unsuspend
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      <AdminDataTable 
        title="Manage Colleges"
        data={colleges}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        searchPlaceholder="Search colleges by name or domain..."
        searchableKeys={['name', 'domain', 'admin_email']}
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingCollege ? "Edit College" : "Add New College"}
        schema={collegeSchema}
        initialData={editingCollege}
      />
    </div>
  );
};

export default SuperAdminColleges;
