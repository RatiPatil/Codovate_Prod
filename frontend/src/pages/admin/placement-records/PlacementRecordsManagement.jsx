import React, { useState, useEffect } from 'react';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { placementRecordsApi } from '../../../api/placementRecordsApi';
import { offersApi } from '../../../api/offersApi';
import { GenericPlacementRecordTab } from './GenericPlacementRecordTab';
import { Award, Briefcase, DollarSign, Users } from 'lucide-react';

const PlacementRecordsManagement = () => {
  const [metrics, setMetrics] = useState({ data: null, loading: true });
  const [eligibleOffers, setEligibleOffers] = useState([]);

  const fetchMetrics = async () => {
    try {
      const res = await placementRecordsApi.getMetrics();
      setMetrics({ data: res.data.data, loading: false });
    } catch (err) {
      console.error(err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchLookups = async () => {
    try {
      // In a real scenario, we strictly enforce pulling ONLY 'ACCEPTED' offers
      const offRes = await offersApi.getMany({ limit: 100, recordStatus: 'ACCEPTED' }); 
      setEligibleOffers(offRes.data.data.map(o => ({ 
        label: `Offer ID: ${o.id} | Student: ${o.studentId} | CTC: $${o.ctc}`, 
        value: o.id 
      })));
    } catch (err) {
      console.error("Failed to fetch lookups", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchLookups();
  }, []);

  const columns = [
    { header: 'Offer ID', key: 'offerId', render: val => <span className="font-mono text-xs">{val}</span> },
    { header: 'Student ID', key: 'studentId' },
    { header: 'Designation', key: 'designation' },
    { header: 'CTC', key: 'ctc', render: val => <span className="font-medium text-green-600">${val?.toLocaleString()}</span> }
  ];

  const schema = [
    { name: 'offerId', label: 'Select Accepted Offer', type: 'select', options: eligibleOffers, fullWidth: true },
    { name: 'studentId', label: 'Student User ID (Manual verify)', placeholder: 'uid_xxx' },
    { name: 'companyId', label: 'Company ID', placeholder: 'comp_xxx' },
    { name: 'joiningDate', label: 'Confirmed Joining Date', type: 'date', fullWidth: true }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Placement Records & Alumni</h1>
        <p className="text-gray-500 dark:text-gray-400">Track final hires, manage joining status, and promote to the Alumni network.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Placements" value={metrics.data?.total} icon={Award} isLoading={metrics.loading} />
        <StatCard title="Candidates Joined" value={metrics.data?.joined} icon={Users} isLoading={metrics.loading} />
        <StatCard title="Highest CTC" value={`$${metrics.data?.highestCtc?.toLocaleString() || 0}`} icon={Briefcase} isLoading={metrics.loading} />
        <StatCard title="Average CTC" value={`$${Math.round(metrics.data?.averageCtc || 0).toLocaleString()}`} icon={DollarSign} isLoading={metrics.loading} />
      </div>

      <div className="pt-2">
        <GenericPlacementRecordTab
          title="Placement Records"
          apiClient={placementRecordsApi}
          columns={columns}
          formSchema={schema}
          onRefreshMetrics={fetchMetrics}
        />
      </div>

    </div>
  );
};

export default PlacementRecordsManagement;
