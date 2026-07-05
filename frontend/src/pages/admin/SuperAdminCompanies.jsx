import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';

const companySchema = [
  { name: 'name', label: 'Company Name', type: 'text', required: true },
  { name: 'industry', label: 'Industry', type: 'text', required: true },
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

const SuperAdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/admin/companies');
      setCompanies(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCompany(null);
    setModalOpen(true);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to suspend this company?")) return;
    try {
      await api.delete(`/admin/companies/${id}`);
      fetchCompanies();
    } catch (err) {
      alert("Failed to delete company");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingCompany) {
      await api.put(`/admin/companies/${editingCompany.id}`, formData);
    } else {
      await api.post('/admin/companies', formData);
    }
    fetchCompanies();
  };

  const columns = [
    { 
      header: 'Company Name', 
      render: (row) => (
        <div>
          <p className="font-bold text-white">{row.name}</p>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5" title="Copy this ID to assign to a user">
            ID: {row.id}
          </p>
        </div>
      )
    },
    { header: 'Industry', accessor: 'industry' },
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
        title="Manage Companies"
        data={companies}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        searchPlaceholder="Search companies by name or industry..."
        searchableKeys={['name', 'industry', 'admin_email']}
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingCompany ? "Edit Company" : "Add New Company"}
        schema={companySchema}
        initialData={editingCompany}
      />
    </div>
  );
};

export default SuperAdminCompanies;
