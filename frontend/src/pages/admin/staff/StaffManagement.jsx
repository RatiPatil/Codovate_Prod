import React, { useState, useEffect } from 'react';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { staffApi } from '../../../api/staffApi';
import { academicApi } from '../../../api/academicApi';
import { collegesApi } from '../../../api/collegesApi';
import { GenericStaffTab } from './GenericStaffTab';
import { Users, GraduationCap, Briefcase, BookOpen } from 'lucide-react';

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState('faculty');
  const [metrics, setMetrics] = useState({ faculty: null, mentors: null, loading: true });
  
  // Lookups
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);

  const fetchMetrics = async () => {
    try {
      const [facRes, menRes] = await Promise.all([
        staffApi.faculty.getMetrics(),
        staffApi.mentors.getMetrics()
      ]);
      setMetrics({ faculty: facRes.data.data, mentors: menRes.data.data, loading: false });
    } catch (err) {
      console.error(err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchLookups = async () => {
    try {
      const [colRes, depRes] = await Promise.all([
        collegesApi.getColleges({ limit: 100 }),
        academicApi.departments.getMany({ limit: 100 })
      ]);
      setColleges(colRes.data.data.map(c => ({ label: c.name, value: c.id })));
      setDepartments(depRes.data.data.map(d => ({ label: d.name, value: d.id })));
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
      id: 'faculty',
      label: 'Faculty',
      icon: GraduationCap,
      api: staffApi.faculty,
      columns: [
        { header: 'Faculty Profile', key: 'name', render: (val, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">{val || row.email}</span>
            <span className="text-xs text-gray-500 font-mono">{row.employeeId || 'NO-ID'}</span>
          </div>
        )},
        { header: 'Designation', key: 'designation' },
        { header: 'Specialization', key: 'specialization' }
      ],
      schema: [
        { name: 'name', label: 'Full Name', placeholder: 'Dr. John Doe', fullWidth: true },
        { name: 'email', label: 'Email (Login)', type: 'email', placeholder: 'john@college.edu', fullWidth: true },
        { name: 'collegeId', label: 'College', type: 'select', options: colleges },
        { name: 'departmentId', label: 'Department', type: 'select', options: departments },
        { name: 'employeeId', label: 'Employee ID', placeholder: 'EMP-001' },
        { name: 'designation', label: 'Designation', placeholder: 'Professor' },
        { name: 'qualification', label: 'Qualification', placeholder: 'Ph.D.' },
        { name: 'experience', label: 'Experience (Years)', type: 'number' },
        { name: 'specialization', label: 'Specialization', fullWidth: true }
      ]
    },
    {
      id: 'mentors',
      label: 'Mentors',
      icon: Briefcase,
      api: staffApi.mentors,
      columns: [
        { header: 'Mentor Profile', key: 'name', render: (val, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">{val || row.email}</span>
            <span className="text-xs text-gray-500">{row.company || 'External'}</span>
          </div>
        )},
        { header: 'Type', key: 'mentorType' },
        { header: 'Domain', key: 'domain' }
      ],
      schema: [
        { name: 'name', label: 'Full Name', placeholder: 'Jane Smith', fullWidth: true },
        { name: 'email', label: 'Email (Login)', type: 'email', placeholder: 'jane@company.com', fullWidth: true },
        { name: 'mentorType', label: 'Mentor Type', type: 'select', options: [
          {label: 'Internal', value: 'Internal'}, 
          {label: 'External', value: 'External'}, 
          {label: 'Industry', value: 'Industry'}
        ]},
        { name: 'collegeId', label: 'College (If Internal)', type: 'select', options: colleges },
        { name: 'company', label: 'Company Name', placeholder: 'Tech Corp' },
        { name: 'domain', label: 'Domain / Expertise', placeholder: 'Software Engineering' },
        { name: 'experience', label: 'Experience (Years)', type: 'number' },
        { name: 'maxStudents', label: 'Max Student Capacity', type: 'number', placeholder: '10' }
      ]
    }
  ];

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff & Mentor Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Administer all teaching faculty and industry mentors.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Faculty" value={metrics.faculty?.total} icon={GraduationCap} isLoading={metrics.loading} />
        <StatCard title="Active Faculty" value={metrics.faculty?.active} icon={Users} isLoading={metrics.loading} />
        <StatCard title="Total Mentors" value={metrics.mentors?.total} icon={Briefcase} isLoading={metrics.loading} />
        <StatCard title="Industry Mentors" value={metrics.mentors?.industry} icon={BookOpen} isLoading={metrics.loading} />
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
        <GenericStaffTab
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

export default StaffManagement;
