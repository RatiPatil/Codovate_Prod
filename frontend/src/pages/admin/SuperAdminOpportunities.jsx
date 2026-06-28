import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';

const oppSchema = [
  { name: 'title', label: 'Opportunity Title', type: 'text', required: true },
  { name: 'company', label: 'Company Name', type: 'text', required: true },
  { 
    name: 'type', 
    label: 'Type', 
    type: 'select', 
    required: true,
    options: [
      { label: 'Internship', value: 'Internship' },
      { label: 'Hackathon', value: 'Hackathon' },
      { label: 'Competition', value: 'Competition' },
      { label: 'Job', value: 'Job' }
    ]
  },
  { name: 'mode', label: 'Mode (Remote/In-person)', type: 'text', required: false },
  { name: 'location', label: 'Location', type: 'text', required: false },
  { name: 'deadline', label: 'Deadline Date (YYYY-MM-DD)', type: 'text', required: false },
  { name: 'description', label: 'Description', type: 'textarea', required: false },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]
  }
];

const SuperAdminOpportunities = () => {
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);

  useEffect(() => {
    fetchOps();
  }, []);

  const fetchOps = async () => {
    try {
      const response = await api.get('/admin/opportunities');
      setOps(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingOpp(null);
    setModalOpen(true);
  };

  const handleEdit = (opp) => {
    // Transform is_active to status for the modal
    const dataForModal = { ...opp, status: opp.is_active ? 'active' : 'inactive' };
    setEditingOpp(dataForModal);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to suspend this opportunity?")) return;
    try {
      await api.delete(`/admin/opportunities/${id}`);
      fetchOps();
    } catch (err) {
      alert("Failed to delete opportunity");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingOpp) {
      await api.put(`/admin/opportunities/${editingOpp.id}`, formData);
    } else {
      await api.post('/admin/opportunities', formData);
    }
    fetchOps();
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Company', accessor: 'company' },
    { header: 'Type', accessor: 'type' },
    { header: 'Location', accessor: 'location' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          !row.is_active ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'
        }`}>
          {row.is_active ? 'active' : 'inactive'}
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
          {row.is_active && (
            <button 
              onClick={() => handleDelete(row.id)}
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
      <AdminDataTable 
        title="Manage Opportunities"
        data={ops}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        searchPlaceholder="Search jobs & internships..."
        searchableKeys={['title', 'company', 'type']}
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingOpp ? "Edit Opportunity" : "Add New Opportunity"}
        schema={oppSchema}
        initialData={editingOpp}
      />
    </div>
  );
};

export default SuperAdminOpportunities;
