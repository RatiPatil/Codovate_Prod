import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import api from '../../api/axios';

const SuperAdminMentors = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const response = await api.get('/admin/users');
      setMentors(response.data.filter(u => u.role === 'mentor'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await api.put(`/admin/users/${id}/status`, { status });
      setMentors(mentors.map(c => c.id === id ? { ...c, status } : c));
    } catch (err) {
      alert("Failed to update mentor status");
    }
  };

  const columns = [
    { header: 'Mentor Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Company', accessor: 'company_id' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
          row.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
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
          {row.status === 'pending' && (
            <>
              <button onClick={() => handleAction(row.id, 'active')} className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-colors">Approve</button>
              <button onClick={() => handleAction(row.id, 'rejected')} className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors">Reject</button>
            </>
          )}
          {row.status === 'active' && (
            <button onClick={() => handleAction(row.id, 'suspended')} className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg text-xs font-bold transition-colors">Suspend</button>
          )}
          {row.status === 'suspended' && (
            <button onClick={() => handleAction(row.id, 'active')} className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-colors">Restore</button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-8">
      <AdminDataTable title="Manage Mentors" data={mentors} columns={columns} loading={loading} searchPlaceholder="Search mentors..." />
    </div>
  );
};

export default SuperAdminMentors;
