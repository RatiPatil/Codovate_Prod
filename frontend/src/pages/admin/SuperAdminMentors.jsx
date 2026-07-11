import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const mentorSchema = [
  { name: 'name', label: 'Mentor Full Name', type: 'text', required: true },
  { name: 'email', label: 'User Email (must be an existing user)', type: 'email', required: true },
  { name: 'hourly_rate', label: 'Hourly Rate (₹)', type: 'number', required: true },
  { name: 'bio', label: 'Bio', type: 'textarea', required: false },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Suspended', value: 'suspended' }
    ]
  }
];

const SuperAdminMentors = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const response = await api.get('/admin/mentors');
      setMentors(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMentor(null);
    setModalOpen(true);
  };

  const handleEdit = (mentor) => {
    setEditingMentor(mentor);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!await showConfirm("Are you sure you want to suspend this mentor?")) return;
    try {
      await api.delete(`/admin/mentors/${id}`);
      fetchMentors();
    } catch (err) {
      showAlert("Failed to delete mentor");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingMentor) {
      await api.put(`/admin/mentors/${editingMentor.id}`, formData);
    } else {
      await api.post('/admin/mentors', formData);
    }
    fetchMentors();
  };

  const columns = [
    { header: 'Mentor Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Hourly Rate', 
      render: (row) => `₹${row.hourly_rate}`
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.status === 'inactive' ? 'bg-yellow-500/20 text-yellow-500' :
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
                if (!await showConfirm("Are you sure you want to unsuspend this mentor?")) return;
                try {
                  await api.put(`/admin/mentors/${row.id}`, { status: 'active' });
                  fetchMentors();
                } catch (err) {
                  showAlert("Failed to unsuspend mentor");
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
        title="Manage Mentors"
        data={mentors}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        searchPlaceholder="Search mentors by name or email..."
        searchableKeys={['name', 'email']}
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingMentor ? "Edit Mentor" : "Add New Mentor"}
        schema={mentorSchema}
        initialData={editingMentor}
      />
    </div>
  );
};

export default SuperAdminMentors;
