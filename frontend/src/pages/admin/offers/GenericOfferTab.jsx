import React, { useRef, useState } from 'react';
import { DataTable } from '../../../components/admin/ui/DataTable';
import { Modal } from '../../../components/admin/ui/Modal';
import { GenericForm } from '../../../components/admin/ui/GenericForm';
import { Badge } from '../../../components/admin/ui/Badge';
import { Edit, Download, ChevronRight, FileText, XCircle } from 'lucide-react';
import { Button } from '../../../components/admin/ui/Button';

export const GenericOfferTab = ({ 
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
  
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [activeTimeline, setActiveTimeline] = useState([]);
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

  const WORKFLOW_STATES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RELEASED'];
  
  const handleWorkflowAdvance = async (id, currentStatus) => {
    const currentIndex = WORKFLOW_STATES.indexOf(currentStatus || 'DRAFT');
    if (currentIndex === -1 || currentIndex >= WORKFLOW_STATES.length - 1) return;
    const nextStatus = WORKFLOW_STATES[currentIndex + 1];
    
    if (!window.confirm(`Update offer status to ${nextStatus}?`)) return;
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

  const viewTimeline = (timeline) => {
    setActiveTimeline(timeline || []);
    setIsTimelineOpen(true);
  };

  const internalColumns = [
    ...columns,
    { 
      header: 'Status', 
      key: 'recordStatus', 
      render: (val) => {
        const variants = { 
          DRAFT: 'default', 
          PENDING_APPROVAL: 'warning', 
          APPROVED: 'primary', 
          RELEASED: 'primary', 
          VIEWED: 'primary',
          ACCEPTED: 'success',
          REJECTED: 'danger',
          EXPIRED: 'danger',
          WITHDRAWN: 'danger'
        };
        return <Badge variant={variants[val] || 'default'}>{val || 'DRAFT'}</Badge>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => {
        const canAdvance = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(row.recordStatus);
        const canEdit = !['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(row.recordStatus);

        return (
          <div className="flex items-center gap-2">
            
            <button onClick={() => viewTimeline(row.timeline)} className="text-xs font-medium text-indigo-600 hover:underline">
              Timeline
            </button>

            {row.offerLetterUrl && (
              <a href={row.offerLetterUrl} target="_blank" rel="noreferrer" className="p-1 text-blue-500 hover:text-blue-700" title="View Offer Letter">
                <FileText className="w-4 h-4" />
              </a>
            )}

            {canEdit && (
              <button onClick={() => { setEditingRecord(row); setIsFormOpen(true); }} className="p-1 text-gray-500 hover:text-indigo-600" title="Edit Offer">
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            {canAdvance && (
              <button onClick={() => handleWorkflowAdvance(row.id, row.recordStatus)} className="p-1 text-gray-500 hover:text-blue-600 font-semibold" title="Advance Workflow">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {canEdit && (
              <button onClick={() => {
                  if (window.confirm("Withdraw this offer?")) apiClient.changeStatus(row.id, 'WITHDRAWN').then(() => { tableRef.current?.refresh(); onRefreshMetrics(); });
              }} className="p-1 text-gray-500 hover:text-red-600 font-semibold" title="Withdraw Offer">
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
            <Button variant="secondary" size="sm" leftIcon={Download} onClick={handleExport}>Export Offers</Button>
          )}
          <Button variant="primary" size="sm" onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}>
            Generate Offer
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
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingRecord ? `Edit ${title}` : `Generate ${title}`}>
          <div className="py-4 h-[70vh] overflow-y-auto px-2">
            <GenericForm 
              schema={formSchema}
              initialValues={editingRecord || defaultFormValues}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitLabel={editingRecord ? 'Save Changes' : `Draft ${title}`}
            />
          </div>
        </Modal>
      )}

      {isTimelineOpen && (
        <Modal isOpen={isTimelineOpen} onClose={() => setIsTimelineOpen(false)} title="Offer Timeline">
          <div className="py-4 px-2 space-y-4">
             {activeTimeline.length === 0 ? (
               <p className="text-gray-500">No timeline data available.</p>
             ) : (
               <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
                 {activeTimeline.map((event, idx) => (
                   <div key={idx} className="relative pl-6">
                     <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-green-500 ring-4 ring-white dark:ring-gray-800" />
                     <h3 className="font-semibold text-gray-900 dark:text-white">{event.stage}</h3>
                     <p className="text-sm text-gray-500">{new Date(event.date).toLocaleString()} by {event.by}</p>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </Modal>
      )}
    </div>
  );
};
