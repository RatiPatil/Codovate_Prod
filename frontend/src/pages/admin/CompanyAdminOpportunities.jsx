import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const opSchema = [
  { name: 'title', label: 'Post Title', type: 'text', required: true },
  { 
    name: 'type', 
    label: 'Post Type', 
    type: 'select',
    options: [
      { label: 'Job', value: 'job' },
      { label: 'Internship', value: 'internship' },
      { label: 'Hiring Challenge', value: 'challenge' }
    ],
    required: true
  },
  { name: 'role', label: 'Role', type: 'text' },
  { name: 'skills', label: 'Required Skills (comma separated)', type: 'text' },
  { name: 'salary', label: 'Salary/Stipend', type: 'text' },
  { name: 'experience', label: 'Experience Level', type: 'text' },
  { name: 'location', label: 'Location', type: 'text', required: true },
  { name: 'deadline', label: 'Application Deadline', type: 'date' },
  { name: 'hiring_process', label: 'Hiring Process', type: 'textarea' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Closed', value: 'closed' }
    ]
  },
  { name: 'link', label: 'Application Link (Optional)', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' }
];

const CompanyAdminOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await api.get('/company-admin/opportunities'); // No type query = gets all
      setOpportunities(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleEdit = (job) => {
    setEditData(job);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!await showConfirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/company-admin/opportunities/${id}`);
      fetchOpportunities();
    } catch (err) {
      showAlert("Failed to delete job");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      // Convert comma-separated skills back to an array
      const payload = { ...formData };
      if (typeof payload.skills === 'string') {
        payload.skills = payload.skills.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (editData) {
        await api.put(`/company-admin/opportunities/${editData.id}`, payload);
      } else {
        await api.post('/company-admin/opportunities', payload);
      }
      setModalOpen(false);
      setEditData(null);
      fetchOpportunities();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save job";
      showAlert(msg);
      throw err;
    }
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { 
      header: 'Type', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
          row.type === 'Job' ? 'bg-blue-500/20 text-blue-400' :
          row.type === 'Internship' ? 'bg-purple-500/20 text-purple-400' :
          'bg-pink-500/20 text-pink-400'
        }`}>
          {row.type}
        </span>
      )
    },
    { header: 'Role', render: (row) => row.role || '—' },
    { header: 'Location', accessor: 'location' },
    { 
      header: 'Salary/Stipend', 
      render: (row) => row.salary || row.stipend || 'Unpaid' 
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${row.status === 'open' ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-500/20 text-gray-400'}`}>
          {row.status || 'open'}
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
          <button 
            onClick={() => handleDelete(row.id)}
            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Job & Internship Management</h1>
          <p className="text-gray-400 text-sm mt-1">Manage jobs, internships, and hiring challenges</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-xl transition-colors"
        >
          + Create Post
        </button>
      </div>

      {loading ? (
        <div className="text-white">Loading opportunities...</div>
      ) : (
        <AdminDataTable 
          data={opportunities} 
          columns={columns} 
          emptyMessage="No posts found. Create your first job or internship!"
        />
      )}

      {modalOpen && (
        <AdminCrudModal
          title={editData ? "Edit Post" : "Create Post"}
          schema={opSchema}
          initialData={editData ? {
            ...editData,
            skills: Array.isArray(editData.skills) ? editData.skills.join(', ') : editData.skills
          } : {}}
          onSubmit={handleSubmit}
          onClose={() => {
            setModalOpen(false);
            setEditData(null);
          }}
        />
      )}
    </div>
  );
};

export default CompanyAdminOpportunities;
