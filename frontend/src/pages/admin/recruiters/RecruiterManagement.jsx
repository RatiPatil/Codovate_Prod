import React, { useState, useEffect } from 'react';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { recruitersApi } from '../../../api/recruitersApi';
import { companiesApi } from '../../../api/companiesApi';
import { GenericRecruiterTab } from './GenericRecruiterTab';
import { Users, Briefcase, Network, Building } from 'lucide-react';

const RecruiterManagement = () => {
  const [activeTab, setActiveTab] = useState('profiles');
  const [metrics, setMetrics] = useState({ recruiters: null, teams: null, loading: true });
  
  // Lookups
  const [companies, setCompanies] = useState([]);

  const fetchMetrics = async () => {
    try {
      const res = await recruitersApi.getMetrics();
      setMetrics({ 
        recruiters: res.data.data.recruiters, 
        teams: res.data.data.teams, 
        loading: false 
      });
    } catch (err) {
      console.error(err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchLookups = async () => {
    try {
      const colRes = await companiesApi.getMany({ limit: 100 });
      setCompanies(colRes.data.data.map(c => ({ label: c.name, value: c.id })));
    } catch (err) {
      console.error("Failed to fetch lookups", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchLookups();
  }, []);

  const TABS = [
    {
      id: 'profiles',
      label: 'Recruiter Profiles',
      icon: Users,
      api: recruitersApi.profiles,
      columns: [
        { header: 'Recruiter', key: 'name', render: (val, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">{val || row.email}</span>
            <span className="text-xs text-gray-500 font-mono">{row.employeeId || 'NO-ID'}</span>
          </div>
        )},
        { header: 'Role', key: 'role' },
        { header: 'Designation', key: 'designation' },
        { header: 'Location', key: 'location' }
      ],
      schema: [
        { name: 'name', label: 'Full Name', placeholder: 'John Recruiter', fullWidth: true },
        { name: 'email', label: 'Corporate Email (Login)', type: 'email', placeholder: 'john@company.com', fullWidth: true },
        { name: 'companyId', label: 'Company', type: 'select', options: companies, fullWidth: true },
        { name: 'role', label: 'Hiring Role', type: 'select', options: [
          {label: 'Recruiter', value: 'Recruiter'}, 
          {label: 'Hiring Manager', value: 'Hiring Manager'}, 
          {label: 'Technical Interviewer', value: 'Technical Interviewer'},
          {label: 'HR Manager', value: 'HR Manager'}
        ]},
        { name: 'department', label: 'Department', placeholder: 'Engineering' },
        { name: 'designation', label: 'Designation', placeholder: 'Senior Talent Acquisition' },
        { name: 'employeeId', label: 'Employee ID', placeholder: 'EMP-9001' },
        { name: 'corporatePhone', label: 'Corporate Phone', placeholder: '+1 234 567 8900' },
        { name: 'location', label: 'Location', placeholder: 'San Francisco, CA' },
        { name: 'experience', label: 'Experience (Years)', type: 'number' },
        { name: 'hiringDomains', label: 'Hiring Domains (Comma Separated)', placeholder: 'Software Engineering, DevOps', fullWidth: true }
      ]
    },
    {
      id: 'teams',
      label: 'Hiring Teams',
      icon: Network,
      api: recruitersApi.teams,
      columns: [
        { header: 'Team Name', key: 'name', render: val => <span className="font-semibold">{val}</span> },
        { header: 'Hiring Focus', key: 'hiringFocus' }
      ],
      schema: [
        { name: 'name', label: 'Team Name', placeholder: '2027 Campus Engineering Team', fullWidth: true },
        { name: 'companyId', label: 'Company', type: 'select', options: companies },
        { name: 'hiringFocus', label: 'Hiring Focus', type: 'select', options: [
          {label: 'Campus Hiring', value: 'Campus Hiring'}, 
          {label: 'Lateral Hiring', value: 'Lateral Hiring'}, 
          {label: 'Executive Search', value: 'Executive Search'}
        ]},
      ]
    }
  ];

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recruiters & Hiring Teams</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage corporate hiring staff, recruiters, and panel members.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Recruiters" value={metrics.recruiters?.total} icon={Briefcase} isLoading={metrics.loading} />
        <StatCard title="Active Recruiters" value={metrics.recruiters?.active} icon={Users} isLoading={metrics.loading} />
        <StatCard title="Total Teams" value={metrics.teams?.total} icon={Network} isLoading={metrics.loading} />
        <StatCard title="Active Teams" value={metrics.teams?.active} icon={Building} isLoading={metrics.loading} />
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
        <GenericRecruiterTab
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

export default RecruiterManagement;
