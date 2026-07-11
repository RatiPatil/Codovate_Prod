import { formatDate, formatTime, formatDateTime, parseDate, getISODate } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const certSchema = [
  { name: 'title', label: 'Certificate Title', type: 'text', required: true },
  { name: 'student_id', label: 'Student ID', type: 'text', required: true },
  { name: 'issue_date', label: 'Issue Date', type: 'date', required: true },
  { name: 'credential_url', label: 'Credential URL', type: 'text' }
];

const CollegeAdminCertificates = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);

  useEffect(() => {
    fetchCerts();
  }, []);

  const fetchCerts = async () => {
    try {
      const response = await api.get('/college-admin/certificates');
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
      await api.delete(`/college-admin/certificates/${id}`);
      fetchCerts();
    } catch (err) {
      showAlert("Failed to revoke certificate");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingCert) {
      await api.put(`/college-admin/certificates/${editingCert.id}`, formData);
    } else {
      await api.post('/college-admin/certificates', formData);
    }
    fetchCerts();
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Student ID', accessor: 'student_id' },
    { header: 'Date', render: (row) => formatDate(row.issue_date) },
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
        title="Student Certificates" 
        data={certs} 
        columns={columns} 
        loading={loading} 
        onAdd={handleAdd}
        searchPlaceholder="Search certificates..." 
        searchableKeys={['title', 'student_id']} 
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingCert ? "Edit Certificate" : "Issue Certificate"}
        schema={certSchema}
        initialData={editingCert}
      />
    </div>
  );
};

export default CollegeAdminCertificates;
