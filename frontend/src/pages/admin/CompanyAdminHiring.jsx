import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import api from '../../api/axios';

const CompanyAdminHiring = () => {
  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHires();
  }, []);

  const fetchHires = async () => {
    try {
      const response = await api.get('/company-admin/applications');
      // Filter for those successfully hired
      setHires(response.data.filter(app => app.status === 'selected'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Applicant ID', accessor: 'user_id' },
    { header: 'Opportunity ID', accessor: 'opportunity_id' },
    { 
      header: 'Hired On', 
      render: (row) => new Date(row.updated_at || row.created_at).toLocaleDateString() 
    },
    { 
      header: 'Status', 
      render: () => (
        <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-emerald-500/20 text-emerald-500">
          HIRED
        </span>
      )
    }
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      <AdminDataTable 
        title="Successful Hires"
        data={hires}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search hires..."
      />
    </div>
  );
};

export default CompanyAdminHiring;
