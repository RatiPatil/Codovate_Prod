import React, { useState, useEffect } from 'react';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { academicApi } from '../../../api/academicApi';
import { collegesApi } from '../../../api/collegesApi';
import { GenericAcademicTab } from './GenericAcademicTab';
import { BookOpen, Library, GraduationCap, LayoutGrid, Users, BookMarked } from 'lucide-react';

const AcademicStructure = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [metrics, setMetrics] = useState({ data: null, loading: true });
  
  // Lookups for the forms
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const fetchMetrics = async () => {
    try {
      const res = await academicApi.getMetrics();
      setMetrics({ data: res.data.data, loading: false });
    } catch (err) {
      console.error(err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchLookups = async () => {
    try {
      const [colRes, depRes, progRes, yrRes, semRes] = await Promise.all([
        collegesApi.getColleges({ limit: 100 }),
        academicApi.departments.getMany({ limit: 100 }),
        academicApi.programs.getMany({ limit: 100 }),
        academicApi.academicYears.getMany({ limit: 100 }),
        academicApi.semesters.getMany({ limit: 100 })
      ]);
      setColleges(colRes.data.data.map(c => ({ label: c.name, value: c.id })));
      setDepartments(depRes.data.data.map(d => ({ label: d.name, value: d.id })));
      setPrograms(progRes.data.data.map(p => ({ label: p.name, value: p.id })));
      setAcademicYears(yrRes.data.data.map(y => ({ label: y.name, value: y.id })));
      setSemesters(semRes.data.data.map(s => ({ label: `Sem ${s.semesterNumber}`, value: s.id })));
    } catch (err) {
      console.error("Failed to fetch lookups", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchLookups();
  }, []);

  const handleRefresh = () => {
    fetchMetrics();
    fetchLookups(); // Refresh lookups just in case a new dependency was added
  };

  // --- SCHEMAS & COLUMNS ---
  
  const TABS = [
    {
      id: 'departments',
      label: 'Departments',
      icon: Library,
      api: academicApi.departments,
      columns: [
        { header: 'Name', key: 'name', render: (val, row) => <span className="font-semibold">{val} <span className="text-xs text-gray-500">({row.code})</span></span> },
        { header: 'HOD', key: 'hod' },
        { header: 'Email', key: 'email' }
      ],
      schema: [
        { name: 'collegeId', label: 'College', type: 'select', options: colleges, fullWidth: true },
        { name: 'name', label: 'Department Name', placeholder: 'Computer Science' },
        { name: 'code', label: 'Department Code', placeholder: 'CSE' },
        { name: 'hod', label: 'Head of Department', placeholder: 'Dr. Smith' },
        { name: 'email', label: 'Contact Email', type: 'email' },
        { name: 'phone', label: 'Contact Phone' }
      ]
    },
    {
      id: 'programs',
      label: 'Programs',
      icon: GraduationCap,
      api: academicApi.programs,
      columns: [
        { header: 'Program', key: 'name', render: (val, row) => <span className="font-semibold">{val} <span className="text-xs text-gray-500">({row.code})</span></span> },
        { header: 'Level', key: 'level' },
        { header: 'Duration (Years)', key: 'duration' }
      ],
      schema: [
        { name: 'collegeId', label: 'College', type: 'select', options: colleges },
        { name: 'departmentId', label: 'Department', type: 'select', options: departments },
        { name: 'name', label: 'Program Name', placeholder: 'B.Tech Computer Science', fullWidth: true },
        { name: 'code', label: 'Program Code', placeholder: 'BTECH-CSE' },
        { name: 'level', label: 'Level', type: 'select', options: [{label: 'UG', value:'UG'}, {label: 'PG', value:'PG'}, {label: 'PhD', value:'PhD'}] },
        { name: 'duration', label: 'Duration (Years)', type: 'number' },
        { name: 'credits', label: 'Total Credits', type: 'number' }
      ]
    },
    {
      id: 'academicYears',
      label: 'Academic Years',
      icon: BookOpen,
      api: academicApi.academicYears,
      columns: [
        { header: 'Year', key: 'name', render: val => <span className="font-bold">{val}</span> },
      ],
      schema: [
        { name: 'collegeId', label: 'College', type: 'select', options: colleges, fullWidth: true },
        { name: 'name', label: 'Academic Year Name', placeholder: '2026-27', fullWidth: true },
      ]
    },
    {
      id: 'semesters',
      label: 'Semesters',
      icon: LayoutGrid,
      api: academicApi.semesters,
      columns: [
        { header: 'Semester', key: 'semesterNumber', render: val => <span className="font-bold">Semester {val}</span> },
        { header: 'Credits', key: 'credits' }
      ],
      schema: [
        { name: 'collegeId', label: 'College', type: 'select', options: colleges },
        { name: 'programId', label: 'Program', type: 'select', options: programs },
        { name: 'academicYearId', label: 'Academic Year', type: 'select', options: academicYears, fullWidth: true },
        { name: 'semesterNumber', label: 'Semester Number', type: 'number' },
        { name: 'credits', label: 'Total Credits', type: 'number' }
      ]
    },
    {
      id: 'divisions',
      label: 'Divisions',
      icon: Users,
      api: academicApi.divisions,
      columns: [
        { header: 'Division', key: 'name', render: val => <span className="font-bold">{val}</span> },
        { header: 'Capacity', key: 'capacity' },
        { header: 'Room', key: 'room' }
      ],
      schema: [
        { name: 'collegeId', label: 'College', type: 'select', options: colleges },
        { name: 'semesterId', label: 'Semester', type: 'select', options: semesters },
        { name: 'name', label: 'Division Name', placeholder: 'Div A' },
        { name: 'capacity', label: 'Capacity', type: 'number' },
        { name: 'mentor', label: 'Class Mentor', placeholder: 'Prof. Davis' },
        { name: 'room', label: 'Room Number', placeholder: '101' }
      ]
    },
    {
      id: 'courses',
      label: 'Courses',
      icon: BookMarked,
      api: academicApi.courses,
      columns: [
        { header: 'Course', key: 'name', render: (val, row) => <span className="font-semibold">{val} <span className="text-xs text-gray-500">({row.code})</span></span> },
        { header: 'Credits', key: 'credits' }
      ],
      schema: [
        { name: 'collegeId', label: 'College', type: 'select', options: colleges },
        { name: 'departmentId', label: 'Department', type: 'select', options: departments },
        { name: 'semesterId', label: 'Semester', type: 'select', options: semesters, fullWidth: true },
        { name: 'name', label: 'Course Name', placeholder: 'Data Structures' },
        { name: 'code', label: 'Course Code', placeholder: 'CS201' },
        { name: 'credits', label: 'Credits', type: 'number' }
      ]
    }
  ];

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Structure</h1>
        <p className="text-gray-500 dark:text-gray-400">Establish the hierarchical foundation for all college academic entities.</p>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {TABS.map(tab => (
          <StatCard 
            key={tab.id}
            title={tab.label} 
            value={metrics.data?.[tab.id] || 0} 
            icon={tab.icon} 
            isLoading={metrics.loading} 
          />
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto hide-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
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

      {/* Active Tab Content */}
      <div className="pt-2">
        <GenericAcademicTab
          key={activeTabConfig.id} // forces remount on tab change
          title={activeTabConfig.label}
          apiClient={activeTabConfig.api}
          columns={activeTabConfig.columns}
          formSchema={activeTabConfig.schema}
          onRefreshMetrics={handleRefresh}
        />
      </div>

    </div>
  );
};

export default AcademicStructure;
