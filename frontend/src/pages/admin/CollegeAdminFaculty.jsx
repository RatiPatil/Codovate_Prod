import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';

const facultySchema = [
  { name: 'name', label: 'Faculty Name', type: 'text', required: true },
  { name: 'email', label: 'Email Address', type: 'email', required: true },
  { name: 'department', label: 'Department', type: 'text', required: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Suspended', value: 'suspended' }
    ]
  }
];

const CollegeAdminFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await api.get('/college-admin/faculty');
      setFaculty(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingFaculty(null);
    setModalOpen(true);
  };

  const handleEdit = (fac) => {
    setEditingFaculty(fac);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to suspend this faculty member?")) return;
    try {
      await api.delete(`/college-admin/faculty/${id}`);
      fetchFaculty();
    } catch (err) {
      alert("Failed to suspend faculty");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingFaculty) {
      await api.put(`/college-admin/faculty/${editingFaculty.id}`, formData);
    } else {
      await api.post('/college-admin/faculty', formData);
    }
    fetchFaculty();
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Department', accessor: 'department' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.status === 'suspended' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
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
          {row.status !== 'suspended' && (
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
        title="Faculty Management" 
        data={faculty} 
        columns={columns} 
        loading={loading} 
        onAdd={handleAdd}
        searchPlaceholder="Search faculty..." 
        searchableKeys={['name', 'email', 'department']} 
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingFaculty ? "Edit Faculty" : "Add New Faculty"}
        schema={facultySchema}
        initialData={editingFaculty}
      />
    </div>
  );
};

export default CollegeAdminFaculty;
