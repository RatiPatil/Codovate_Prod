import React, { useState, useEffect } from 'react';
import { CollegeList } from './CollegeList';
import { CollegeFormModal } from './CollegeFormModal';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { Button } from '../../../components/admin/ui/Button';
import { collegesApi } from '../../../api/collegesApi';
import { GraduationCap, Award, Building, Archive, Plus, Download } from 'lucide-react';

const CollegeManagement = () => {
  const [metrics, setMetrics] = useState({ data: null, loading: true });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);

  const fetchMetrics = async () => {
    try {
      const res = await collegesApi.getMetrics();
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
    setEditingCollege(null);
    setIsFormOpen(true);
  };

  const handleEdit = (college) => {
    setEditingCollege(college);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    collegesApi.exportColleges({ format: 'csv' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">College Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage all registered colleges, accreditations, and autonomous statuses.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" leftIcon={Plus} onClick={handleCreate}>
            Register College
          </Button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Colleges" 
          value={metrics.data?.total} 
          icon={GraduationCap} 
          isLoading={metrics.loading} 
        />
        <StatCard 
          title="Active Institutions" 
          value={metrics.data?.active} 
          icon={Building} 
          isLoading={metrics.loading} 
        />
        <StatCard 
          title="Autonomous" 
          value={metrics.data?.autonomous} 
          icon={Award} 
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
        <CollegeList 
          onEdit={handleEdit} 
          onRefreshMetrics={fetchMetrics} 
        />
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <CollegeFormModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editingCollege}
          onSuccess={() => {
            fetchMetrics();
          }}
        />
      )}

    </div>
  );
};

export default CollegeManagement;
