import React, { useState, useEffect } from 'react';
import { StudentList } from './StudentList';
import { StudentFormModal } from './StudentFormModal';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { Button } from '../../../components/admin/ui/Button';
import { studentsApi } from '../../../api/studentsApi';
import { Users, GraduationCap, Target, Archive, Plus, Download } from 'lucide-react';

const StudentManagement = () => {
  const [metrics, setMetrics] = useState({ data: null, loading: true });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const fetchMetrics = async () => {
    try {
      const res = await studentsApi.getMetrics();
      setMetrics({ data: res.data.data, loading: false });
    } catch (err) {
      console.error(err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleCreate = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    studentsApi.exportStudents({ format: 'csv' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Information System</h1>
          <p className="text-gray-500 dark:text-gray-400">Centralized hub for all student records, academics, and placement readiness.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" leftIcon={Plus} onClick={handleCreate}>
            Onboard Student
          </Button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value={metrics.data?.total} 
          icon={Users} 
          isLoading={metrics.loading} 
        />
        <StatCard 
          title="Placed Students" 
          value={metrics.data?.placed} 
          icon={GraduationCap} 
          isLoading={metrics.loading} 
        />
        <StatCard 
          title="Placement Ready (>80%)" 
          value={metrics.data?.placementReady} 
          icon={Target} 
          isLoading={metrics.loading} 
        />
        <StatCard 
          title="Archived" 
          value={metrics.data?.archived} 
          icon={Archive} 
          isLoading={metrics.loading} 
        />
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <StudentList 
          onEdit={handleEdit} 
          onRefreshMetrics={fetchMetrics} 
        />
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <StudentFormModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editingStudent}
          onSuccess={() => {
            fetchMetrics();
          }}
        />
      )}

    </div>
  );
};

export default StudentManagement;
