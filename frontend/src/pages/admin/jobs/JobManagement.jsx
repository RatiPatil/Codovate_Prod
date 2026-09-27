import React, { useState, useEffect } from 'react';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { jobsApi } from '../../../api/jobsApi';
import { companiesApi } from '../../../api/companiesApi';
import { recruitersApi } from '../../../api/recruitersApi';
import { GenericJobTab } from './GenericJobTab';
import { Briefcase, GraduationCap, CheckCircle, Target } from 'lucide-react';

const JobManagement = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [metrics, setMetrics] = useState({ data: null, loading: true });
  
  // Lookups
  const [companies, setCompanies] = useState([]);
  const [hiringTeams, setHiringTeams] = useState([]);
  const [recruiters, setRecruiters] = useState([]);

  const fetchMetrics = async () => {
    try {
      const res = await jobsApi.getMetrics();
      setMetrics({ data: res.data.data, loading: false });
    } catch (err) {
      console.error(err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchLookups = async () => {
    try {
      const [compRes, teamRes, recRes] = await Promise.all([
        companiesApi.getMany({ limit: 200 }),
        recruitersApi.teams.getMany({ limit: 200 }),
        recruitersApi.profiles.getMany({ limit: 200 })
      ]);
      setCompanies(compRes.data.data.map(c => ({ label: c.name, value: c.id })));
      setHiringTeams(teamRes.data.data.map(t => ({ label: t.name, value: t.id })));
      setRecruiters(recRes.data.data.map(r => ({ label: r.name || r.email, value: r.userId })));
    } catch (err) {
      console.error("Failed to fetch lookups", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchLookups();
  }, []);

  const buildSchema = (isInternship) => [
    { name: 'title', label: 'Title', placeholder: isInternship ? 'Software Engineering Intern' : 'Senior Software Engineer', fullWidth: true },
    { name: 'jobCode', label: 'Job/Req Code', placeholder: 'REQ-1002' },
    
    // Relational
    { name: 'companyId', label: 'Company', type: 'select', options: companies },
    { name: 'hiringTeamId', label: 'Hiring Team', type: 'select', options: hiringTeams },
    { name: 'recruiterId', label: 'Primary Recruiter', type: 'select', options: recruiters },
    
    // Core
    { name: 'workMode', label: 'Work Mode', type: 'select', options: [{label:'Remote',value:'Remote'},{label:'Hybrid',value:'Hybrid'},{label:'Onsite',value:'Onsite'}] },
    { name: 'department', label: 'Department', placeholder: 'Engineering' },
    { name: 'location', label: 'Location', placeholder: 'Bangalore, India' },
    
    // Compensation
    isInternship 
      ? { name: 'stipend', label: 'Monthly Stipend', placeholder: '50,000 INR' }
      : { name: 'salary', label: 'Salary/CTC', placeholder: '24,00,000 INR' },
    
    // Logistics
    { name: 'openPositions', label: 'Open Positions', type: 'number', placeholder: '5' },
    { name: 'joiningDate', label: 'Expected Joining Date', type: 'date' },
    { name: 'deadline', label: 'Application Deadline', type: 'date', fullWidth: true },
    
    // Eligibility Engine (Flattened for basic GenericForm)
    { name: 'minCgpa', label: 'Minimum CGPA (Eligibility)', type: 'number', placeholder: '7.5' },
    { name: 'maxBacklogs', label: 'Max Active Backlogs', type: 'number', placeholder: '0' },
    { name: 'allowedBranches', label: 'Allowed Branches (Comma separated)', placeholder: 'CSE, ISE, ECE', fullWidth: true },
    
    // Content
    { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
    { name: 'responsibilities', label: 'Responsibilities', type: 'textarea', fullWidth: true },
  ];

  const TABS = [
    {
      id: 'jobs',
      label: 'Full Time Jobs',
      icon: Briefcase,
      filter: { employmentType: 'Full Time' },
      columns: [
        { header: 'Job Title', key: 'title', render: (val, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">{val}</span>
            <span className="text-xs text-gray-500 font-mono">{row.jobCode || 'N/A'}</span>
          </div>
        )},
        { header: 'Location', key: 'location', render: (val, row) => `${val} (${row.workMode})` },
        { header: 'Positions', key: 'openPositions' }
      ],
      schema: buildSchema(false)
    },
    {
      id: 'internships',
      label: 'Internships',
      icon: GraduationCap,
      filter: { employmentType: 'Internship' },
      columns: [
        { header: 'Internship Title', key: 'title', render: (val, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">{val}</span>
            <span className="text-xs text-gray-500 font-mono">{row.jobCode || 'N/A'}</span>
          </div>
        )},
        { header: 'Location', key: 'location', render: (val, row) => `${val} (${row.workMode})` },
        { header: 'Positions', key: 'openPositions' }
      ],
      schema: buildSchema(true)
    }
  ];

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job & Internship Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage the corporate hiring pipeline, eligibility rules, and workflow states.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Opportunities" value={metrics.data?.total} icon={Target} isLoading={metrics.loading} />
        <StatCard title="Live (Published)" value={metrics.data?.active} icon={CheckCircle} isLoading={metrics.loading} />
        <StatCard title="Full Time Jobs" value={metrics.data?.jobs} icon={Briefcase} isLoading={metrics.loading} />
        <StatCard title="Internships" value={metrics.data?.internships} icon={GraduationCap} isLoading={metrics.loading} />
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
        <GenericJobTab
          key={activeTabConfig.id}
          title={activeTabConfig.label}
          apiClient={jobsApi}
          baseFilter={activeTabConfig.filter}
          columns={activeTabConfig.columns}
          formSchema={activeTabConfig.schema}
          onRefreshMetrics={fetchMetrics}
        />
      </div>

    </div>
  );
};

export default JobManagement;
