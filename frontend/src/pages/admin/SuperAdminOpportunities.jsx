import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import ImportJsonModal from '../../components/modals/ImportJsonModal';
import ImportHistoryModal from '../../components/modals/ImportHistoryModal';
import { History, FileJson } from 'lucide-react';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const oppSchema = [
  { name: 'title', label: 'Opportunity Title', type: 'text', required: true },
  { name: 'company', label: 'Company Name', type: 'text', required: true },
  { name: 'logo', label: 'Company Logo URL', type: 'text', required: false },
  { 
    name: 'type', 
    label: 'Type', 
    type: 'select', 
    required: true,
    options: [
      { label: 'Internship', value: 'Internship' },
      { label: 'Hackathon', value: 'Hackathon' },
      { label: 'Competition', value: 'Competition' },
      { label: 'Job', value: 'Job' },
      { label: 'Research Programs', value: 'Research Programs' },
      { label: 'Fellowships', value: 'Fellowships' },
      { label: 'Open Source Programs', value: 'Open Source Programs' },
      { label: 'Scholarships', value: 'Scholarships' },
      { label: 'Certifications', value: 'Certifications' }
    ]
  },
  { 
    name: 'mode', 
    label: 'Mode', 
    type: 'select', 
    required: false,
    options: [
      { label: 'Remote', value: 'Remote' },
      { label: 'Hybrid', value: 'Hybrid' },
      { label: 'On-site', value: 'On-site' }
    ]
  },
  { name: 'location', label: 'Location', type: 'text', required: false },
  { name: 'salary', label: 'Salary / Stipend', type: 'text', required: false },
  { name: 'experience', label: 'Experience Required', type: 'text', required: false },
  { name: 'deadline', label: 'Deadline Date (YYYY-MM-DD)', type: 'text', required: false },
  { name: 'applyUrl', label: 'Official Apply Link', type: 'text', required: false },
  { name: 'description', label: 'Description', type: 'textarea', required: false },
  { name: 'eligibility', label: 'Eligibility', type: 'textarea', required: false },
  { name: 'required_skills', label: 'Required Skills (comma separated)', type: 'text', required: false },
  { name: 'selection_process', label: 'Selection Process', type: 'textarea', required: false },
  { name: 'benefits', label: 'Benefits', type: 'textarea', required: false },
  { name: 'tags', label: 'Tags (comma separated)', type: 'text', required: false },
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
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
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
    if (!await showConfirm("Are you sure you want to suspend this opportunity?")) return;
    try {
      await api.delete(`/admin/opportunities/${id}`);
      fetchOps();
    } catch (err) {
      showAlert("Failed to delete opportunity");
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
          {row.is_active ? (
            <button 
              onClick={() => handleDelete(row.id)}
              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
            >
              Suspend
            </button>
          ) : (
            <>
              <button 
                onClick={async () => {
                  if (!await showConfirm("Are you sure you want to reactivate this opportunity?")) return;
                  try {
                    await api.put(`/admin/opportunities/${row.id}`, { status: 'active' });
                    fetchOps();
                  } catch (err) {
                    showAlert("Failed to reactivate opportunity");
                  }
                }}
                className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-colors"
              >
                Reactivate
              </button>
              <button 
                onClick={async () => {
                  if (!await showConfirm("Are you sure you want to permanently delete this outdated opportunity? This cannot be undone.")) return;
                  try {
                    await api.delete(`/admin/opportunities/${row.id}/hard`);
                    fetchOps();
                  } catch (err) {
                    showAlert("Failed to permanently delete opportunity");
                  }
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-lg"
              >
                Delete
              </button>
            </>
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
        customActions={
          <div className="flex gap-2">
            <button 
              onClick={() => setHistoryModalOpen(true)}
              className="px-4 py-3 bg-[#2a2a35] hover:bg-[#353542] text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              <History className="w-4 h-4" /> History
            </button>
            <button 
              onClick={() => setImportModalOpen(true)}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg flex items-center gap-2"
            >
              <FileJson className="w-4 h-4" /> Import JSON
            </button>
          </div>
        }
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
      <ImportJsonModal 
        isOpen={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        onSuccess={fetchOps} 
      />
      <ImportHistoryModal 
        isOpen={historyModalOpen} 
        onClose={() => setHistoryModalOpen(false)} 
      />
    </div>
  );
};

export default SuperAdminOpportunities;
