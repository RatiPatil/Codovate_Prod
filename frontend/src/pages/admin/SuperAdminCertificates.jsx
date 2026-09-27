import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const certSchema = [
  { name: 'title', label: 'Certificate Title', type: 'text', required: true },
  { name: 'student_id', label: 'Student ID', type: 'text', required: true },
  { name: 'issue_date', label: 'Issue Date (YYYY-MM-DD)', type: 'text', required: true },
  { name: 'issuer', label: 'Issuer', type: 'text', required: false, placeholder: 'e.g., Codovate' },
  { name: 'credential_url', label: 'Credential URL', type: 'text', required: false },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { label: 'Valid', value: 'valid' },
      { label: 'Revoked', value: 'revoked' }
    ]
  }
];

const SuperAdminCertificates = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);

  useEffect(() => {
    fetchCerts();
  }, []);

  const fetchCerts = async () => {
    try {
      const response = await api.get('/admin/certificates');
      setCerts(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCert(null);
    setModalOpen(true);
  };

  const handleEdit = (cert) => {
    setEditingCert(cert);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!await showConfirm("Are you sure you want to revoke this certificate?")) return;
    try {
      await api.delete(`/admin/certificates/${id}`);
      fetchCerts();
    } catch (err) {
      showAlert("Failed to revoke certificate");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingCert) {
      await api.put(`/admin/certificates/${editingCert.id}`, formData);
    } else {
      await api.post('/admin/certificates', formData);
    }
    fetchCerts();
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Student ID', accessor: 'student_id' },
    { header: 'Credential ID', accessor: 'credential_id' },
    { header: 'Issue Date', accessor: 'issue_date' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.status === 'revoked' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'
        }`}>
          {row.status || 'valid'}
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
          {row.status !== 'revoked' && (
            <button 
              onClick={() => handleDelete(row.id)}
              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
            >
              Revoke
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      <AdminDataTable 
        title="Manage Certificates" 
        data={certs} 
        columns={columns} 
        loading={loading} 
        onAdd={handleAdd}
        searchPlaceholder="Search certificates by title or student ID..." 
        searchableKeys={['title', 'student_id', 'credential_id']} 
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingCert ? "Edit Certificate" : "Issue New Certificate"}
        schema={certSchema}
        initialData={editingCert}
      />
    </div>
  );
};

export default SuperAdminCertificates;
