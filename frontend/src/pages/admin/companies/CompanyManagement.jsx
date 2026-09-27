import React, { useState, useEffect } from 'react';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { companiesApi } from '../../../api/companiesApi';
import { GenericCompanyTab } from './GenericCompanyTab';
import { Building2, Rocket, Briefcase, Users, MapPin } from 'lucide-react';

const CompanyManagement = () => {
  const [activeTab, setActiveTab] = useState('companies');
  const [metrics, setMetrics] = useState({ data: null, loading: true });

  const fetchMetrics = async () => {
    try {
      const res = await companiesApi.getMetrics();
      setMetrics({ data: res.data.data, loading: false });
    } catch (err) {
      console.error(err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const TABS = [
    {
      id: 'companies',
      label: 'Companies',
      icon: Building2,
      api: companiesApi,
      columns: [
        { header: 'Company', key: 'name', render: (val, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">{val}</span>
            <span className="text-xs text-gray-500">{row.industry} - {row.companyType}</span>
          </div>
        )},
        { header: 'Headquarters', key: 'headquarters', render: (val, row) => (
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <MapPin className="w-3 h-3" />
            <span className="text-sm">{row.city || row.country || val}</span>
          </div>
        )},
        { header: 'Founded', key: 'foundedYear' }
      ],
      schema: [
        // Section: Basic Info
        { name: 'name', label: 'Company Name', placeholder: 'Google', fullWidth: true },
        { name: 'legalName', label: 'Legal Entity Name', placeholder: 'Google LLC', fullWidth: true },
        { name: 'companyCode', label: 'Company Code / Ticker', placeholder: 'GOOGL' },
        { name: 'foundedYear', label: 'Founded Year', type: 'number', placeholder: '1998' },
        
        // Section: Industry & Size
        { name: 'industry', label: 'Primary Industry', placeholder: 'Technology' },
        { name: 'subIndustry', label: 'Sub Industry', placeholder: 'Internet Services' },
        { name: 'companyType', label: 'Company Type', type: 'select', options: [
          {label: 'MNC', value: 'MNC'},
          {label: 'Startup', value: 'Startup'},
          {label: 'SME', value: 'SME'},
          {label: 'Government', value: 'Government'},
          {label: 'Consultancy', value: 'Consultancy'}
        ]},
        { name: 'companySize', label: 'Company Size', type: 'select', options: [
          {label: '1-50 Employees', value: '1-50'},
          {label: '51-200 Employees', value: '51-200'},
          {label: '201-1000 Employees', value: '201-1000'},
          {label: '1000+ Employees', value: '1000+'}
        ]},

        // Section: Contact & Location
        { name: 'website', label: 'Website URL', type: 'url', placeholder: 'https://google.com', fullWidth: true },
        { name: 'corporateEmail', label: 'Corporate Contact Email', type: 'email', placeholder: 'hr@google.com' },
        { name: 'corporatePhone', label: 'Corporate Phone', placeholder: '+1 234 567 8900' },
        { name: 'headquarters', label: 'Headquarters Location', placeholder: 'Mountain View, CA' },
        { name: 'city', label: 'City', placeholder: 'Mountain View' },
        { name: 'country', label: 'Country', placeholder: 'USA' },
        { name: 'gst', label: 'GST Number (Optional)', placeholder: '22AAAAA0000A1Z5' },
        { name: 'pan', label: 'PAN Number (Optional)', placeholder: 'ABCDE1234F' }
      ]
    }
  ];

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enterprise Company Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage corporate partners, startups, and enterprise recruiters.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Companies" value={metrics.data?.total} icon={Building2} isLoading={metrics.loading} />
        <StatCard title="Active Partners" value={metrics.data?.active} icon={CheckCircle} isLoading={metrics.loading} />
        <StatCard title="MNCs" value={metrics.data?.mncs} icon={Briefcase} isLoading={metrics.loading} />
        <StatCard title="Startups" value={metrics.data?.startups} icon={Rocket} isLoading={metrics.loading} />
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                isActive 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        <GenericCompanyTab
          key={activeTabConfig.id}
          title={activeTabConfig.label}
          apiClient={activeTabConfig.api}
          columns={activeTabConfig.columns}
          formSchema={activeTabConfig.schema}
          onRefreshMetrics={fetchMetrics}
        />
      </div>

    </div>
  );
};

export default CompanyManagement;
