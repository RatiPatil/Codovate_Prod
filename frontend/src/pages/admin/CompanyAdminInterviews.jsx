import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';

const interviewSchema = [
  { name: 'candidate_name', label: 'Candidate Name', type: 'text', required: true },
  { name: 'role', label: 'Role / Job Title', type: 'text', required: true },
  { name: 'date', label: 'Interview Date & Time', type: 'text', required: true },
  { name: 'link', label: 'Meeting Link', type: 'text' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Scheduled', value: 'scheduled' },
      { label: 'Completed', value: 'completed' },
      { label: 'Cancelled', value: 'cancelled' }
    ]
  }
];

const CompanyAdminInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await api.get('/company-admin/interviews');
      setInterviews(response.data);
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

  const handleEdit = (interview) => {
    setEditData(interview);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview?")) return;
    try {
      await api.delete(`/company-admin/interviews/${id}`);
      fetchInterviews();
    } catch (err) {
      alert("Failed to delete interview");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editData) {
        await api.put(`/company-admin/interviews/${editData.id}`, formData);
      } else {
        await api.post('/company-admin/interviews', formData);
      }
      setModalOpen(false);
      setEditData(null);
      fetchInterviews();
    } catch (err) {
      alert("Failed to save interview");
    }
  };

  const columns = [
    { header: 'Candidate Name', accessor: 'candidate_name' },
    { header: 'Role', accessor: 'role' },
    { header: 'Date', accessor: 'date' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.status === 'scheduled' ? 'bg-amber-500/20 text-amber-500' : 
          row.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
        }`}>
          {row.status || 'scheduled'}
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
        title="Interviews"
        data={interviews}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        searchPlaceholder="Search interviews..."
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSubmit={handleSubmit}
        title={editData ? "Edit Interview" : "Schedule Interview"}
        schema={interviewSchema}
        initialData={editData}
      />
    </div>
  );
};

export default CompanyAdminInterviews;
