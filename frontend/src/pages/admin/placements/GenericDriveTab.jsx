import React, { useRef, useState } from 'react';
import { DataTable } from '../../../components/admin/ui/DataTable';
import { Modal } from '../../../components/admin/ui/Modal';
import { GenericForm } from '../../../components/admin/ui/GenericForm';
import { Badge } from '../../../components/admin/ui/Badge';
import { Edit, Archive, PlayCircle, StopCircle, Trash, Plus, Download, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/admin/ui/Button';

export const GenericDriveTab = ({ 
  title, 
  apiClient, 
  columns, 
  formSchema, 
  onRefreshMetrics,
  defaultFormValues = {},
  baseFilter = {}
}) => {
  const tableRef = useRef(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async ({ limit, cursor, search }) => {
    const params = { limit, ...baseFilter };
    if (cursor) params.cursor = cursor;
    if (search) params.search = search;
    const res = await apiClient.getMany(params);
    return {
      data: res.data.data,
      pagination: { nextCursor: res.data.pagination?.nextCursor }
    };
  };

  const WORKFLOW_STATES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'SHORTLISTING', 'INTERVIEW', 'OFFERS', 'COMPLETED'];
  
  const handleWorkflowAdvance = async (id, currentStatus) => {
    const currentIndex = WORKFLOW_STATES.indexOf(currentStatus || 'DRAFT');
    if (currentIndex === -1 || currentIndex >= WORKFLOW_STATES.length - 1) return;
    const nextStatus = WORKFLOW_STATES[currentIndex + 1];
    if (!window.confirm(`Advance drive to ${nextStatus}?`)) return;
    try {
      await apiClient.changeWorkflow(id, nextStatus);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) { alert('Failed to advance workflow'); }
  };

  const handleAction = async (action, id) => {
    try {
      if (action === 'ARCHIVE') {
        if (!window.confirm('Archive this record?')) return;
        await apiClient.changeLifecycle(id, 'ARCHIVED');
      } else if (action === 'DELETE') {
        if (!window.confirm('Delete this record?')) return;
        await apiClient.delete(id);
      }
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) { alert('Failed to perform action'); }
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const payload = { ...values, ...baseFilter };
      if (editingRecord?.id) {
        await apiClient.update(editingRecord.id, payload);
      } else {
        await apiClient.create(payload);
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
    if (apiClient.export) {
      apiClient.export({ format: 'csv', ...baseFilter });
    }
  };

  const internalColumns = [
    ...columns,
    { 
      header: 'Workflow Status', 
      key: 'recordStatus', 
      render: (val) => {
        const variants = { 
          DRAFT: 'default', 
          REGISTRATION_OPEN: 'success', 
          COMPLETED: 'success', 
          REGISTRATION_CLOSED: 'warning', 
          ARCHIVED: 'danger' 
        };
        return <Badge variant={variants[val] || 'primary'}>{val || 'DRAFT'}</Badge>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => {
        const canAdvance = row.recordStatus !== 'COMPLETED' && row.recordStatus !== 'ARCHIVED';
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditingRecord(row); setIsFormOpen(true); }} className="p-1 text-gray-500 hover:text-indigo-600">
              <Edit className="w-4 h-4" />
            </button>
            
            {canAdvance && (
              <button onClick={() => handleWorkflowAdvance(row.id, row.recordStatus)} className="p-1 text-gray-500 hover:text-blue-600 font-semibold flex items-center" title="Advance Workflow">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {row.recordStatus !== 'ARCHIVED' && (
              <button onClick={() => handleAction('ARCHIVE', row.id)} className="p-1 text-gray-500 hover:text-yellow-600" title="Archive">
                <Archive className="w-4 h-4" />
              </button>
            )}

            <button onClick={() => handleAction('DELETE', row.id)} className="p-1 text-gray-500 hover:text-red-600">
              <Trash className="w-4 h-4" />
            </button>
          </div>
        )
      }
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title} Directory</h2>
        <div className="flex gap-2">
          {apiClient.export && (
            <Button variant="secondary" size="sm" leftIcon={Download} onClick={handleExport}>Export</Button>
          )}
          <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}>
            Create {title}
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
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingRecord ? `Edit ${title}` : `Create ${title}`}>
          <div className="py-4 h-[70vh] overflow-y-auto px-2">
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
