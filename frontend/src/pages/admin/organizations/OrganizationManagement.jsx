import React, { useState, useEffect } from 'react';
import { OrganizationList } from './OrganizationList';
import { OrganizationFormModal } from './OrganizationFormModal';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { Button } from '../../../components/admin/ui/Button';
import { organizationsApi } from '../../../api/organizationsApi';
import { Building, GraduationCap, Briefcase, Archive, Plus, Download } from 'lucide-react';

const OrganizationManagement = () => {
  const [metrics, setMetrics] = useState({ data: null, loading: true });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  const fetchMetrics = async () => {
    try {
      const res = await organizationsApi.getMetrics();
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
    setEditingOrg(null);
    setIsFormOpen(true);
  };

  const handleEdit = (org) => {
    setEditingOrg(org);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    organizationsApi.exportOrganizations({ format: 'csv' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage colleges, companies, and training institutes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" leftIcon={Plus} onClick={handleCreate}>
            New Organization
          </Button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Organizations" 
          value={metrics.data?.total} 
          icon={Building} 
          isLoading={metrics.loading} 
        />
        <StatCard 
          title="Colleges" 
          value={metrics.data?.colleges} 
          icon={GraduationCap} 
          isLoading={metrics.loading} 
        />
        <StatCard 
          title="Companies" 
          value={metrics.data?.companies} 
          icon={Briefcase} 
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
        <OrganizationList 
          onEdit={handleEdit} 
          onRefreshMetrics={fetchMetrics} 
        />
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <OrganizationFormModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editingOrg}
          onSuccess={() => {
            fetchMetrics();
          }}
        />
      )}

    </div>
  );
};

export default OrganizationManagement;
