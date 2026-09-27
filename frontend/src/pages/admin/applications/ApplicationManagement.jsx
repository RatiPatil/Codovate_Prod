import React, { useState, useEffect } from 'react';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { applicationsApi } from '../../../api/applicationsApi';
import { GenericApplicationTab } from './GenericApplicationTab';
import { Filter, Users, UserCheck, Calendar, Briefcase } from 'lucide-react';

const ApplicationManagement = () => {
  const [metrics, setMetrics] = useState({ data: null, loading: true });

  const fetchMetrics = async () => {
    try {
      const res = await applicationsApi.getMetrics();
      setMetrics({ data: res.data.data, loading: false });
    } catch (err) {
      console.error(err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const columns = [
    { header: 'Applicant ID', key: 'studentId', render: val => <span className="font-mono text-xs">{val || 'Unknown'}</span> },
    { header: 'Job ID', key: 'jobId', render: val => <span className="font-mono text-xs text-indigo-600">{val}</span> },
    { header: 'Drive ID', key: 'driveId', render: val => <span className="text-xs text-gray-500">{val || 'Direct Apply'}</span> },
    { header: 'Applied On', key: 'appliedAt', render: val => new Date(val).toLocaleDateString() }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Tracking System (ATS)</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage the complete candidate pipeline from Submission to Offer.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Applications" value={metrics.data?.total} icon={Users} isLoading={metrics.loading} />
        <StatCard title="Under Review" value={metrics.data?.underReview} icon={Filter} isLoading={metrics.loading} />
        <StatCard title="Shortlisted" value={metrics.data?.shortlisted} icon={UserCheck} isLoading={metrics.loading} />
        <StatCard title="Interviews" value={metrics.data?.interviews} icon={Calendar} isLoading={metrics.loading} />
        <StatCard title="Offers" value={metrics.data?.offers} icon={Briefcase} isLoading={metrics.loading} />
      </div>

      <div className="pt-2">
        <GenericApplicationTab
          title="Candidate Pipeline"
          apiClient={applicationsApi}
          columns={columns}
          onRefreshMetrics={fetchMetrics}
        />
      </div>

    </div>
  );
};

export default ApplicationManagement;
