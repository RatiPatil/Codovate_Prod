import React, { useState, useEffect } from 'react';
import { UserList } from './UserList';
import { UserFormModal } from './UserFormModal';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { Button } from '../../../components/admin/ui/Button';
import { usersApi } from '../../../api/usersApi';
import { Users, UserCheck, UserMinus, UserX, Plus, Download } from 'lucide-react';

const UserManagement = () => {
  const [metrics, setMetrics] = useState({ data: null, loading: true });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchMetrics = async () => {
    try {
      const res = await usersApi.getMetrics();
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
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    usersApi.exportUsers({ format: 'csv' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage all users, roles, and lifecycles across the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" leftIcon={Plus} onClick={handleCreate}>
            New User
          </Button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={metrics.data?.total} 
          icon={Users} 
          isLoading={metrics.loading} 
        />
        <StatCard 
          title="Active Users" 
          value={metrics.data?.active} 
          icon={UserCheck} 
          isLoading={metrics.loading} 
        />
        <StatCard 
          title="Suspended" 
          value={metrics.data?.suspended} 
          icon={UserX} 
          isLoading={metrics.loading} 
        />
        <StatCard 
          title="Inactive" 
          value={metrics.data?.inactive} 
          icon={UserMinus} 
          isLoading={metrics.loading} 
        />
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <UserList 
          onEdit={handleEdit} 
          onRefreshMetrics={fetchMetrics} 
        />
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <UserFormModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editingUser}
          onSuccess={() => {
            // Because UserList is managing its own state via refs, it handles its own refresh.
            // But we should refresh metrics.
            fetchMetrics();
            // In a real implementation we would also trigger a table refresh via Context or ref.
          }}
        />
      )}

    </div>
  );
};

export default UserManagement;
