import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';

const internshipSchema = [
  { name: 'title', label: 'Internship Title', type: 'text', required: true },
  { name: 'location', label: 'Location', type: 'text', required: true },
  { name: 'stipend', label: 'Stipend', type: 'text' },
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

const CompanyAdminInternships = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      const response = await api.get('/company-admin/opportunities?type=internship');
      // Filter only internships
      setInternships(response.data.filter(op => op.type === 'internship'));
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

  const handleEdit = (internship) => {
    setEditData(internship);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this internship?")) return;
    try {
      await api.delete(`/company-admin/opportunities/${id}`);
      fetchInternships();
    } catch (err) {
      alert("Failed to delete internship");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editData) {
        await api.put(`/company-admin/opportunities/${editData.id}`, formData);
      } else {
        await api.post('/company-admin/opportunities', { ...formData, type: 'internship' });
      }
      setModalOpen(false);
      setEditData(null);
      fetchInternships();
    } catch (err) {
      alert("Failed to save internship");
    }
  };

  const columns = [
    { header: 'Internship Title', accessor: 'title' },
    { header: 'Location', accessor: 'location' },
    { 
      header: 'Stipend', 
      render: (row) => row.stipend || row.salary || 'Unpaid' 
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
        title="Active Internships"
        data={internships}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        searchPlaceholder="Search internships..."
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSubmit={handleSubmit}
        title={editData ? "Edit Internship" : "Add New Internship"}
        schema={internshipSchema}
        initialData={editData}
      />
    </div>
  );
};

export default CompanyAdminInternships;
