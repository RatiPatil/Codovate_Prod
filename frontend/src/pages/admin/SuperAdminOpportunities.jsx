import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import api from '../../api/axios';

const SuperAdminOpportunities = () => {
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Company', accessor: 'company_id' },
    { header: 'Type', accessor: 'type' },
    { header: 'Location', accessor: 'location' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.status === 'closed' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'
        }`}>
          {row.status || 'open'}
        </span>
      )
    }
  ];

  return (
    <div className="p-8">
      <AdminDataTable title="Platform Opportunities" data={ops} columns={columns} loading={loading} searchPlaceholder="Search jobs & internships..." searchableKeys={['title', 'company_id']} />
    </div>
  );
};

export default SuperAdminOpportunities;
