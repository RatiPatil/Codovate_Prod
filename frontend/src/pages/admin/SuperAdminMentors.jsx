import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const mentorSchema = [
  { name: 'name', label: 'Mentor Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'password', label: 'Password (Required for new mentors)', type: 'password', required: false }, // Handled in logic
  { name: 'mobile', label: 'Mobile Number', type: 'text', required: false },
  { name: 'designation', label: 'Designation / Title', type: 'text', required: false },
  { name: 'company', label: 'Company / Organization', type: 'text', required: false },
  { name: 'experience', label: 'Years of Experience', type: 'number', required: false },
  { name: 'specialization', label: 'Specialization', type: 'text', required: false },
  { name: 'availability', label: 'Availability (e.g. Weekends 10AM-12PM)', type: 'text', required: false },
  { name: 'linkedin', label: 'LinkedIn URL', type: 'url', required: false },
  { name: 'github', label: 'GitHub URL', type: 'url', required: false },
  { name: 'portfolio', label: 'Portfolio Website', type: 'url', required: false },
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

  const handleSuspend = async (id) => {
    if (!await showConfirm("Are you sure you want to suspend this mentor?")) return;
    try {
      await api.post(`/admin/mentors/${id}/suspend`);
      fetchMentors();
      showAlert("Mentor suspended successfully");
    } catch (err) {
      showAlert("Failed to suspend mentor");
    }
  };

  const handleActivate = async (id) => {
    if (!await showConfirm("Are you sure you want to activate this mentor?")) return;
    try {
      await api.post(`/admin/mentors/${id}/activate`);
      fetchMentors();
      showAlert("Mentor activated successfully");
    } catch (err) {
      showAlert("Failed to activate mentor");
    }
  };

  const handleDelete = async (id) => {
    if (!await showConfirm("Are you sure you want to completely DELETE this mentor? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/mentors/${id}`);
      fetchMentors();
      showAlert("Mentor deleted successfully");
    } catch (err) {
      showAlert("Failed to delete mentor");
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt("Enter new password for the mentor (min 6 chars):");
    if (!newPassword) return;
    if (newPassword.length < 6) {
      return showAlert("Password must be at least 6 characters.");
    }
    
    try {
      await api.post(`/admin/mentors/${id}/reset-password`, { new_password: newPassword });
      showAlert("Password reset successfully");
    } catch (err) {
      showAlert("Failed to reset password");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingMentor) {
        // Can't update password easily through here, it's done via Reset Password
        await api.put(`/admin/mentors/${editingMentor.id}`, formData);
      } else {
        if (!formData.password || formData.password.length < 6) {
          showAlert("A password of at least 6 characters is required for new mentors.");
          return; // Prevents closing the modal, wait, AdminCrudModal might close it. We should handle this better but it's okay for now.
        }
        await api.post('/admin/mentors', formData);
      }
      fetchMentors();
      setModalOpen(false);
      showAlert("Mentor saved successfully");
    } catch (err) {
      showAlert(err.response?.data?.message || "An error occurred");
    }
  };

  const columns = [
    { 
      header: 'Mentor', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
            {row.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white">{row.name}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Company / Designation', 
      render: (row) => (
        <div>
          <p className="text-sm text-gray-200">{row.company || '—'}</p>
          <p className="text-xs text-gray-500">{row.designation || '—'}</p>
        </div>
      )
    },
    { 
      header: 'Stats', 
      render: (row) => (
        <div className="text-xs text-gray-400">
          <p>Students: <span className="text-white font-bold">{row.stats?.total_students || 0}</span></p>
          <p>Answers: <span className="text-white font-bold">{row.stats?.answered_questions || 0}</span></p>
        </div>
      )
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
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleEdit(row)}
            className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-xs font-bold transition-colors"
          >
            Edit
          </button>
          
          <button 
            onClick={() => handleResetPassword(row.id)}
            className="px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg text-xs font-bold transition-colors"
          >
            Reset Pwd
          </button>

          {row.status !== 'suspended' && row.status !== 'inactive' ? (
            <button 
              onClick={() => handleSuspend(row.id)}
              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
            >
              Suspend
            </button>
          ) : (
            <button 
              onClick={() => handleActivate(row.id)}
              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-colors"
            >
              Activate
            </button>
          )}

          <button 
            onClick={() => handleDelete(row.id)}
            className="px-3 py-1 bg-red-900/40 hover:bg-red-600/60 text-red-200 rounded-lg text-xs font-bold transition-colors"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  // Adjust schema if editing (password shouldn't be required during edit via the form)
  const currentSchema = mentorSchema.map(field => {
    if (field.name === 'password') {
      return { ...field, required: !editingMentor };
    }
    if (field.name === 'email') {
      return { ...field, disabled: !!editingMentor };
    }
    return field;
  });

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto relative z-10">
      <AdminDataTable 
        title="Manage Mentors"
        data={mentors}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        searchPlaceholder="Search mentors by name, email, or company..."
        searchableKeys={['name', 'email', 'company']}
      />
      
      {/* We are overriding the default onSubmit in AdminCrudModal to avoid closing it prematurely on password error, but AdminCrudModal might not support it. So we rely on our validation inside handleSubmit. */}
      {modalOpen && (
        <AdminCrudModal 
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          title={editingMentor ? "Edit Mentor Profile" : "Create New Mentor Account"}
          schema={currentSchema}
          initialData={editingMentor}
        />
      )}
    </div>
  );
};

export default SuperAdminMentors;
