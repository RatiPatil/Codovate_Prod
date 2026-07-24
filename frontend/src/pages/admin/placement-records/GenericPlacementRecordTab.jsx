import React, { useRef, useState } from 'react';
import { DataTable } from '../../../../components/admin/ui/DataTable';
import { Modal } from '../../../../components/admin/ui/Modal';
import { GenericForm } from '../../../../components/admin/ui/GenericForm';
import { Badge } from '../../../../components/admin/ui/Badge';
import { Edit, Download, ChevronRight, GraduationCap, XCircle } from 'lucide-react';
import { Button } from '../../../../components/admin/ui/Button';

export const GenericPlacementRecordTab = ({ 
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

  const WORKFLOW_STATES = ['OFFER_ACCEPTED', 'JOINING_PENDING', 'JOINED'];
  
  const handleWorkflowAdvance = async (id, currentStatus) => {
    const currentIndex = WORKFLOW_STATES.indexOf(currentStatus || 'OFFER_ACCEPTED');
    if (currentIndex === -1 || currentIndex >= WORKFLOW_STATES.length - 1) return;
    const nextStatus = WORKFLOW_STATES[currentIndex + 1];
    
    if (!window.confirm(`Update placement status to ${nextStatus}?`)) return;
    try {
      await apiClient.changeStatus(id, nextStatus);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) { alert('Failed to update status'); }
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

  const promoteToAlumni = async (row) => {
    if (!window.confirm(`Promote student ${row.studentId} to Alumni?`)) return;
    try {
      await apiClient.promoteToAlumni({
        studentId: row.studentId,
        currentCompany: row.companyId, // Could use company name if we joined it
        designation: row.designation,
        mentorshipAvailable: true
      });
      alert('Successfully promoted to Alumni Network!');
    } catch (err) {
      alert('Failed to promote to Alumni');
    }
  };

  const internalColumns = [
    ...columns,
    { 
      header: 'Status', 
      key: 'recordStatus', 
      render: (val) => {
        const variants = { 
          OFFER_ACCEPTED: 'default', 
          JOINING_PENDING: 'warning', 
          JOINED: 'success', 
          DEFERRED: 'warning',
          NO_SHOW: 'danger',
          WITHDRAWN: 'danger'
        };
        return <Badge variant={variants[val] || 'default'}>{val || 'OFFER_ACCEPTED'}</Badge>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => {
        const canAdvance = ['OFFER_ACCEPTED', 'JOINING_PENDING'].includes(row.recordStatus);
        const canEdit = !['NO_SHOW', 'WITHDRAWN'].includes(row.recordStatus);
        const isJoined = row.recordStatus === 'JOINED';

        return (
          <div className="flex items-center gap-2">

            {canEdit && (
              <button onClick={() => { setEditingRecord(row); setIsFormOpen(true); }} className="p-1 text-gray-500 hover:text-indigo-600" title="Edit Record">
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            {canAdvance && (
              <button onClick={() => handleWorkflowAdvance(row.id, row.recordStatus)} className="p-1 text-gray-500 hover:text-blue-600 font-semibold" title="Advance Workflow">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {isJoined && (
               <button onClick={() => promoteToAlumni(row)} className="p-1 text-purple-600 hover:text-purple-800" title="Promote to Alumni">
                 <GraduationCap className="w-4 h-4" />
               </button>
            )}

            {canAdvance && (
              <button onClick={() => {
                  if (window.confirm("Mark candidate as NO SHOW?")) apiClient.changeStatus(row.id, 'NO_SHOW').then(() => { tableRef.current?.refresh(); onRefreshMetrics(); });
              }} className="p-1 text-gray-500 hover:text-red-600 font-semibold" title="Mark No Show">
                <XCircle className="w-4 h-4" />
              </button>
            )}
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
            <Button variant="secondary" size="sm" leftIcon={Download} onClick={handleExport}>Export Report</Button>
          )}
          <Button variant="primary" size="sm" onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}>
            Log Placement
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
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingRecord ? `Edit ${title}` : `Log ${title}`}>
          <div className="py-4 h-[70vh] overflow-y-auto px-2">
            {!editingRecord && (
              <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded-lg text-sm">
                <strong>Strict Rule:</strong> You can only generate a placement record from an Offer that is currently in the <code>ACCEPTED</code> state.
              </div>
            )}
            <GenericForm 
              schema={formSchema}
              initialValues={editingRecord || defaultFormValues}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitLabel={editingRecord ? 'Save Changes' : `Generate Record`}
            />
          </div>
        </Modal>
      )}

    </div>
  );
};
