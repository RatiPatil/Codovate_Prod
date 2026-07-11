import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const studentSchema = [
  { name: 'name', label: 'Student Name', type: 'text', required: true },
  { name: 'email', label: 'Email Address', type: 'email', required: true },
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

const CollegeAdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/college-admin/students');
      setStudents(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await api.put(`/college-admin/students/${id}/status`, { status });
      setStudents(students.map(s => s.id === id ? { ...s, status } : s));
    } catch (err) {
      showAlert("Failed to update student status");
    }
  };

  const handleAdd = () => {
    setModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      await api.post('/college-admin/students', formData);
      fetchStudents();
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to add student");
    }
  };

  const columns = [
    { header: 'Student Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.status === 'suspended' ? 'bg-amber-500/20 text-amber-500' :
          row.status === 'banned' ? 'bg-red-500/20 text-red-500' :
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
          {row.status !== 'suspended' && row.status !== 'banned' ? (
            <button 
              onClick={() => handleAction(row.id, 'suspended')}
              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg text-xs font-bold transition-colors"
            >
              Suspend
            </button>
          ) : (
            <button 
              onClick={() => handleAction(row.id, 'active')}
              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-colors"
            >
              Restore
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      <AdminDataTable 
        title="College Students"
        data={students}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        searchPlaceholder="Search students by name or email..."
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title="Add New Student"
        schema={studentSchema}
      />
    </div>
  );
};

export default CollegeAdminStudents;
