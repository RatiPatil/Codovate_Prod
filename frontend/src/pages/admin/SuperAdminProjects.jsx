import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';

const projectSchema = [
  { name: 'title', label: 'Project Title', type: 'text', required: true },
  { name: 'author_id', label: 'Author ID', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea', required: false },
  { name: 'github_url', label: 'GitHub URL', type: 'text', required: false },
  { name: 'live_url', label: 'Live Demo URL', type: 'text', required: false },
  { name: 'tags', label: 'Tags (comma separated)', type: 'text', required: false },
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

const SuperAdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/admin/projects');
      setProjects(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleEdit = (project) => {
    const dataForModal = { ...project };
    if (Array.isArray(dataForModal.tags)) {
      dataForModal.tags = dataForModal.tags.join(', ');
    }
    setEditingProject(dataForModal);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to suspend this project?")) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert("Failed to suspend project");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingProject) {
      await api.put(`/admin/projects/${editingProject.id}`, formData);
    } else {
      await api.post('/admin/projects', formData);
    }
    fetchProjects();
  };

  const columns = [
    { header: 'Project Name', accessor: 'title' },
    { header: 'Author ID', accessor: 'author_id' },
    { 
      header: 'Links', 
      render: (row) => (
        <div className="flex gap-2 text-sm text-[#2015FF]">
          {row.github_url && <a href={row.github_url} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>}
          {row.live_url && <a href={row.live_url} target="_blank" rel="noreferrer" className="hover:underline">Live Demo</a>}
        </div>
      )
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.status === 'suspended' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'
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
        title="Platform Projects" 
        data={projects} 
        columns={columns} 
        loading={loading} 
        onAdd={handleAdd}
        searchPlaceholder="Search projects by title..." 
        searchableKeys={['title']} 
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingProject ? "Edit Project" : "Add New Project"}
        schema={projectSchema}
        initialData={editingProject}
      />
    </div>
  );
};

export default SuperAdminProjects;
