import React, { useState, useEffect } from 'react';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { placementsApi } from '../../../api/placementsApi';
import { academicApi } from '../../../api/academicApi';
import { collegesApi } from '../../../api/collegesApi';
import { jobsApi } from '../../../api/jobsApi';
import { companiesApi } from '../../../api/companiesApi';
import { GenericPlacementTab } from './GenericPlacementTab';
import { GenericDriveTab } from './GenericDriveTab';
import { Users, Briefcase, Calendar, CheckCircle, Network } from 'lucide-react';

const PlacementManagement = () => {
  const [activeTab, setActiveTab] = useState('drives');
  const [metrics, setMetrics] = useState({ staff: null, drives: null, loading: true });
  
  // Lookups
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);

  const fetchMetrics = async () => {
    try {
      const res = await placementsApi.getMetrics();
      setMetrics({ 
        staff: res.data.data.staff, 
        drives: res.data.data.drives, 
        loading: false 
      });
    } catch (err) {
      console.error(err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchLookups = async () => {
    try {
      const [colRes, depRes, progRes, yrRes, jobRes, compRes] = await Promise.all([
        collegesApi.getColleges({ limit: 100 }),
        academicApi.departments.getMany({ limit: 100 }),
        academicApi.programs.getMany({ limit: 100 }),
        academicApi.academicYears.getMany({ limit: 100 }),
        jobsApi.getMany({ limit: 200 }),
        companiesApi.getMany({ limit: 200 })
      ]);
      setColleges(colRes.data.data.map(c => ({ label: c.name, value: c.id })));
      setDepartments(depRes.data.data.map(d => ({ label: d.name, value: d.id })));
      setPrograms(progRes.data.data.map(p => ({ label: p.name, value: p.id })));
      setAcademicYears(yrRes.data.data.map(y => ({ label: y.name, value: y.id })));
      setJobs(jobRes.data.data.map(j => ({ label: `${j.title} (${j.jobCode || 'No Code'})`, value: j.id })));
      setCompanies(compRes.data.data.map(c => ({ label: c.name, value: c.id })));
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
      id: 'drives',
      label: 'Placement Drives',
      icon: Briefcase,
      api: placementsApi.drives,
      columns: [
        { header: 'Drive Title', key: 'title', render: val => <span className="font-semibold">{val}</span> },
        { header: 'Min CGPA', key: 'minCgpa' },
        { header: 'Drive Date', key: 'driveDate', render: val => new Date(val).toLocaleDateString() }
      ],
      schema: [
        { name: 'title', label: 'Drive Title', placeholder: 'Tech Corp SDE Intern Drive 2027', fullWidth: true },
        
        // Relational
        { name: 'jobId', label: 'Corporate Job / Internship', type: 'select', options: jobs, fullWidth: true },
        { name: 'companyId', label: 'Corporate Partner (Company)', type: 'select', options: companies },
        { name: 'collegeId', label: 'Target College', type: 'select', options: colleges },
        
        // Drive Details
        { name: 'driveType', label: 'Drive Type', type: 'select', options: [
          {label: 'Campus Drive', value: 'Campus Drive'},
          {label: 'Virtual Drive', value: 'Virtual Drive'},
          {label: 'Walk-In Drive', value: 'Walk-In Drive'}
        ]},
        { name: 'academicYearId', label: 'Target Academic Year', type: 'select', options: academicYears },
        
        // Eligibility Engine Overrides (Job dictates base, Drive dictates specifics)
        { name: 'minCgpa', label: 'Minimum CGPA (Override)', type: 'number', placeholder: '7.5' },
        { name: 'maxBacklogs', label: 'Max Active Backlogs (Override)', type: 'number', placeholder: '0' },
        
        // Schedule
        { name: 'registrationStartDate', label: 'Registration Start', type: 'date' },
        { name: 'registrationEndDate', label: 'Registration End', type: 'date' },
        { name: 'driveDate', label: 'Drive / Assessment Date', type: 'date' },
        { name: 'venue', label: 'Venue / Virtual Link', placeholder: 'Main Auditorium', fullWidth: true }
      ]
    },
    {
      id: 'staff',
      label: 'TPO Staff',
      icon: Users,
      api: placementsApi.staff,
      columns: [
        { header: 'TPO Profile', key: 'name', render: (val, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">{val || row.email}</span>
            <span className="text-xs text-gray-500 font-mono">{row.employeeId || 'NO-ID'}</span>
          </div>
        )},
        { header: 'Role', key: 'placementRole' },
        { header: 'Experience', key: 'experience' }
      ],
      schema: [
        { name: 'name', label: 'Full Name', placeholder: 'Jane Officer', fullWidth: true },
        { name: 'email', label: 'Email (Login)', type: 'email', placeholder: 'jane.tpo@college.edu', fullWidth: true },
        { name: 'placementRole', label: 'Placement Role', type: 'select', options: [
          {label: 'Chief Placement Officer', value: 'Chief TPO'}, 
          {label: 'Placement Coordinator', value: 'Coordinator'}, 
          {label: 'Student Committee', value: 'Student Committee'}
        ]},
        { name: 'collegeId', label: 'College', type: 'select', options: colleges },
        { name: 'departmentId', label: 'Department (If Departmental Coordinator)', type: 'select', options: departments },
        { name: 'employeeId', label: 'Employee ID', placeholder: 'TPO-001' },
        { name: 'officePhone', label: 'Office Phone', placeholder: '+1 234 567 8900' },
        { name: 'experience', label: 'Experience (Years)', type: 'number' },
      ]
    }
  ];

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Placement Office (TPO)</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage placement drives, corporate relations, and TPO staff.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Drives" value={metrics.drives?.total} icon={Briefcase} isLoading={metrics.loading} />
        <StatCard title="Active Drives" value={metrics.drives?.active} icon={CheckCircle} isLoading={metrics.loading} />
        <StatCard title="Upcoming Drives" value={metrics.drives?.upcoming} icon={Calendar} isLoading={metrics.loading} />
        <StatCard title="TPO Staff" value={metrics.staff?.active} icon={Users} isLoading={metrics.loading} />
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
        {activeTab === 'drives' ? (
          <GenericDriveTab
            key={activeTabConfig.id}
            title={activeTabConfig.label}
            apiClient={activeTabConfig.api}
            columns={activeTabConfig.columns}
            formSchema={activeTabConfig.schema}
            onRefreshMetrics={fetchMetrics}
          />
        ) : (
          <GenericPlacementTab
            key={activeTabConfig.id}
            title={activeTabConfig.label}
            apiClient={activeTabConfig.api}
            columns={activeTabConfig.columns}
            formSchema={activeTabConfig.schema}
            onRefreshMetrics={fetchMetrics}
          />
        )}
      </div>

    </div>
  );
};

export default PlacementManagement;
