import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';

const jobSchema = [
  { name: 'title', label: 'Job Title', type: 'text', required: true },
  { name: 'location', label: 'Location', type: 'text', required: true },
  { name: 'salary', label: 'Salary', type: 'text' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Closed', value: 'closed' }
    ]
  },
  { name: 'link', label: 'Application Link (Optional)', type: 'text' }
];

const CompanyAdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/company-admin/opportunities?type=job');
      // Backend already filters by type in the query
      setJobs(response.data);
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
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await api.delete(`/company-admin/opportunities/${id}`);
      fetchJobs();
    } catch (err) {
      alert("Failed to delete job");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editData) {
        await api.put(`/company-admin/opportunities/${editData.id}`, formData);
      } else {
        await api.post('/company-admin/opportunities', { ...formData, type: 'job' });
      }
      setModalOpen(false);
      setEditData(null);
      fetchJobs();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save job";
      alert(msg);
      throw err;
    }
  };

  const columns = [
    { header: 'Job Title', accessor: 'title' },
    { header: 'Location', accessor: 'location' },
    { 
      header: 'Stipend/Salary', 
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
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      <AdminDataTable 
        title="Active Jobs"
        data={jobs}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        searchPlaceholder="Search jobs..."
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSubmit={handleSubmit}
        title={editData ? "Edit Job" : "Add New Job"}
        schema={jobSchema}
        initialData={editData}
      />
    </div>
  );
};

export default CompanyAdminJobs;
