import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import api from '../../api/axios';

const SuperAdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const columns = [
    { header: 'Project Name', accessor: 'title' },
    { header: 'Author ID', accessor: 'user_id' },
    { 
      header: 'Links', 
      render: (row) => (
        <div className="flex gap-2 text-sm text-[#2015FF]">
          {row.github_url && <a href={row.github_url} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>}
          {row.demo_url && <a href={row.demo_url} target="_blank" rel="noreferrer" className="hover:underline">Live Demo</a>}
        </div>
      )
    },
    { 
      header: 'Featured', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${row.featured ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-500/20 text-gray-400'}`}>
          {row.featured ? 'Featured' : 'Standard'}
        </span>
      )
    }
  ];

  return (
    <div className="p-8">
      <AdminDataTable title="Platform Projects" data={projects} columns={columns} loading={loading} searchPlaceholder="Search projects..." searchableKeys={['title']} />
    </div>
  );
};

export default SuperAdminProjects;
