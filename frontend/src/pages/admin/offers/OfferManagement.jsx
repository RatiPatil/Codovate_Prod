import React, { useState, useEffect } from 'react';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { offersApi } from '../../../api/offersApi';
import { applicationsApi } from '../../../api/applicationsApi';
import { GenericOfferTab } from './GenericOfferTab';
import { FileText, CheckCircle, XCircle, DollarSign } from 'lucide-react';

const OfferManagement = () => {
  const [metrics, setMetrics] = useState({ data: null, loading: true });
  const [eligibleApplications, setEligibleApplications] = useState([]);

  const fetchMetrics = async () => {
    try {
      const res = await offersApi.getMetrics();
      setMetrics({ data: res.data.data, loading: false });
    } catch (err) {
      console.error(err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchLookups = async () => {
    try {
      // In a real scenario, we'd query for applications that are strictly PASSED in the interview phase.
      // Assuming 'HIRED' or 'OFFER_RELEASED' maps down to offers being created, but here we look for 'INTERVIEW_SCHEDULED' or 'PASSED' logic if it existed in ATS,
      // For ATS stage we used 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_RELEASED', 'HIRED'
      // We will allow generating offers for 'INTERVIEW_SCHEDULED' or 'SHORTLISTED' for now.
      const appRes = await applicationsApi.getMany({ limit: 100 }); 
      setEligibleApplications(appRes.data.data.map(a => ({ label: `App ID: ${a.id} (Student: ${a.studentId})`, value: a.id })));
    } catch (err) {
      console.error("Failed to fetch lookups", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchLookups();
  }, []);

  const columns = [
    { header: 'App ID', key: 'applicationId', render: val => <span className="font-mono text-xs">{val}</span> },
    { header: 'Designation', key: 'designation' },
    { header: 'CTC', key: 'ctc', render: val => <span className="font-medium text-green-600">${val?.toLocaleString()}</span> },
    { header: 'Joining Date', key: 'joiningDate', render: val => new Date(val).toLocaleDateString() }
  ];

  const schema = [
    { name: 'applicationId', label: 'Target Application', type: 'select', options: eligibleApplications, fullWidth: true },
    { name: 'designation', label: 'Designation / Title', placeholder: 'Software Engineer', fullWidth: true },
    { name: 'department', label: 'Department', placeholder: 'Engineering' },
    { name: 'location', label: 'Location', placeholder: 'New York, NY' },
    { name: 'ctc', label: 'Total CTC (Annual)', type: 'number', placeholder: '120000', fullWidth: true },
    { name: 'fixedPay', label: 'Fixed Pay', type: 'number', placeholder: '100000' },
    { name: 'variablePay', label: 'Variable Pay / Bonus', type: 'number', placeholder: '20000' },
    { name: 'joiningBonus', label: 'Joining Bonus (One Time)', type: 'number', placeholder: '5000' },
    { name: 'stipend', label: 'Stipend (Monthly, if Intern)', type: 'number', placeholder: '0' },
    { name: 'joiningDate', label: 'Joining Date', type: 'date' },
    { name: 'offerExpiryDate', label: 'Offer Expiry Date', type: 'date' },
    { name: 'offerLetterUrl', label: 'Offer Letter URL (PDF)', placeholder: 'https://storage.example.com/offer.pdf', fullWidth: true },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Offer & Placement Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Generate, track, and manage official employment offers.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Offers" value={metrics.data?.total} icon={FileText} isLoading={metrics.loading} />
        <StatCard title="Offers Released" value={metrics.data?.released} icon={DollarSign} isLoading={metrics.loading} />
        <StatCard title="Offers Accepted" value={metrics.data?.accepted} icon={CheckCircle} isLoading={metrics.loading} />
        <StatCard title="Offers Rejected" value={metrics.data?.rejected} icon={XCircle} isLoading={metrics.loading} />
      </div>

      <div className="pt-2">
        <GenericOfferTab
          title="Offers"
          apiClient={offersApi}
          columns={columns}
          formSchema={schema}
          onRefreshMetrics={fetchMetrics}
        />
      </div>

    </div>
  );
};

export default OfferManagement;
