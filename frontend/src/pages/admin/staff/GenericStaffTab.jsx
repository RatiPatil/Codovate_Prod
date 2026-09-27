import React, { useRef, useState } from 'react';
import { DataTable } from '../../../components/admin/ui/DataTable';
import { Modal } from '../../../components/admin/ui/Modal';
import { GenericForm } from '../../../components/admin/ui/GenericForm';
import { Badge } from '../../../components/admin/ui/Badge';
import { Edit, Archive, CheckCircle, Trash, Plus, Download } from 'lucide-react';
import { Button } from '../../../components/admin/ui/Button';

export const GenericStaffTab = ({ 
  title, 
  apiClient, 
  columns, 
  formSchema, 
  onRefreshMetrics,
  defaultFormValues = {}
}) => {
  const tableRef = useRef(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async ({ limit, cursor, search }) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    if (search) params.search = search;
    const res = await apiClient.getMany(params);
    return {
      data: res.data.data,
      pagination: { nextCursor: res.data.pagination?.nextCursor }
    };
  };

  const handleLifecycle = async (id, status) => {
    if (!window.confirm(`Change status to ${status}?`)) return;
    try {
      await apiClient.changeLifecycle(id, status);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) { alert('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record? (Soft Delete)')) return;
    try {
      await apiClient.delete(id);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) { alert('Failed to delete record'); }
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (editingRecord?.id) {
        await apiClient.update(editingRecord.id, values);
      } else {
        await apiClient.create(values);
      }
      setIsFormOpen(false);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    apiClient.export({ format: 'csv' });
  };

  const internalColumns = [
    ...columns,
    { 
      header: 'Status', 
      key: 'recordStatus', 
      render: (val) => {
        const variants = { ACTIVE: 'success', ARCHIVED: 'warning', SUSPENDED: 'danger' };
        return <Badge variant={variants[val] || 'default'}>{val || 'ACTIVE'}</Badge>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditingRecord(row); setIsFormOpen(true); }} className="p-1 text-gray-500 hover:text-indigo-600">
            <Edit className="w-4 h-4" />
          </button>
          
          {(!row.recordStatus || row.recordStatus === 'ACTIVE') ? (
            <button onClick={() => handleLifecycle(row.id, 'ARCHIVED')} className="p-1 text-gray-500 hover:text-yellow-600">
              <Archive className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => handleLifecycle(row.id, 'ACTIVE')} className="p-1 text-gray-500 hover:text-green-600">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          <button onClick={() => handleDelete(row.id)} className="p-1 text-gray-500 hover:text-red-600">
            <Trash className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title} Directory</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={Download} onClick={handleExport}>Export</Button>
          <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}>
            Onboard {title}
          </Button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-[500px]">
        <DataTable 
          ref={tableRef}
          columns={internalColumns}
          fetchData={fetchData}
          enableSelection={true}
          enableSearch={true}
        />
      </div>
      {isFormOpen && (
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingRecord ? `Edit ${title}` : `Onboard ${title}`}>
          <div className="py-4 h-[60vh] overflow-y-auto px-2">
            <GenericForm 
              schema={formSchema}
              initialValues={editingRecord || defaultFormValues}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitLabel={editingRecord ? 'Save Changes' : `Create ${title}`}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
