import React, { useRef, useState } from 'react';
import { DataTable } from '../../../components/admin/ui/DataTable';
import { Modal } from '../../../components/admin/ui/Modal';
import { GenericForm } from '../../../components/admin/ui/GenericForm';
import { Badge } from '../../../components/admin/ui/Badge';
import { Edit, PlayCircle, ExternalLink, ClipboardCheck, Plus, Download, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/admin/ui/Button';

export const GenericInterviewTab = ({ 
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
  
  // Feedback specific
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [activeInterview, setActiveInterview] = useState(null);
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

  const WORKFLOW_STATES = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];
  
  const handleWorkflowAdvance = async (id, currentStatus) => {
    const currentIndex = WORKFLOW_STATES.indexOf(currentStatus || 'SCHEDULED');
    if (currentIndex === -1 || currentIndex >= WORKFLOW_STATES.length - 1) return;
    const nextStatus = WORKFLOW_STATES[currentIndex + 1];
    
    if (!window.confirm(`Update status to ${nextStatus}?`)) return;
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

  const handleFeedbackSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await apiClient.submitFeedback(activeInterview.id, values);
      setIsFeedbackOpen(false);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (apiClient.export) {
      apiClient.export({ format: 'csv', ...baseFilter });
    }
  };

  const openFeedback = (row) => {
    setActiveInterview(row);
    setIsFeedbackOpen(true);
  };

  const internalColumns = [
    ...columns,
    { 
      header: 'Status', 
      key: 'recordStatus', 
      render: (val) => {
        const variants = { 
          SCHEDULED: 'default', 
          CONFIRMED: 'primary', 
          IN_PROGRESS: 'warning', 
          COMPLETED: 'default', 
          FEEDBACK_SUBMITTED: 'success', 
          PASSED: 'success',
          FAILED: 'danger'
        };
        return <Badge variant={variants[val] || 'default'}>{val || 'SCHEDULED'}</Badge>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => {
        const canAdvance = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(row.recordStatus);
        const canFeedback = row.recordStatus === 'COMPLETED' || row.recordStatus === 'FEEDBACK_SUBMITTED';

        return (
          <div className="flex items-center gap-2">
            
            {row.meetingLink && row.mode !== 'Offline' && (
              <a href={row.meetingLink} target="_blank" rel="noreferrer" className="p-1 text-indigo-500 hover:text-indigo-700" title="Join Meeting">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button onClick={() => { setEditingRecord(row); setIsFormOpen(true); }} className="p-1 text-gray-500 hover:text-indigo-600" title="Edit Logistics">
              <Edit className="w-4 h-4" />
            </button>
            
            {canAdvance && (
              <button onClick={() => handleWorkflowAdvance(row.id, row.recordStatus)} className="p-1 text-gray-500 hover:text-blue-600 font-semibold" title="Advance Workflow">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {canFeedback && (
               <button onClick={() => openFeedback(row)} className="p-1 text-green-600 hover:text-green-800" title="Submit Feedback">
                 <ClipboardCheck className="w-4 h-4" />
               </button>
            )}
          </div>
        )
      }
    }
  ];

  const feedbackSchema = [
    { name: 'communication', label: 'Communication (1-5)', type: 'number' },
    { name: 'technical', label: 'Technical Skills (1-5)', type: 'number' },
    { name: 'problemSolving', label: 'Problem Solving (1-5)', type: 'number' },
    { name: 'cultureFit', label: 'Culture Fit (1-5)', type: 'number' },
    { name: 'overallRating', label: 'Overall Rating (1-5)', type: 'number', fullWidth: true },
    { name: 'comments', label: 'Detailed Comments', type: 'textarea', fullWidth: true },
    { name: 'recommendation', label: 'Final Recommendation', type: 'select', options: [
      {label: 'Strong Hire', value: 'Offer Recommended'},
      {label: 'Hire', value: 'Pass'},
      {label: 'No Hire', value: 'Fail'},
      {label: 'Strong No Hire', value: 'Reject'}
    ], fullWidth: true }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title} Directory</h2>
        <div className="flex gap-2">
          {apiClient.export && (
            <Button variant="secondary" size="sm" leftIcon={Download} onClick={handleExport}>Export Schedule</Button>
          )}
          <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}>
            Schedule {title}
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
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingRecord ? `Edit ${title}` : `Schedule ${title}`}>
          <div className="py-4 h-[70vh] overflow-y-auto px-2">
            <GenericForm 
              schema={formSchema}
              initialValues={editingRecord || defaultFormValues}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitLabel={editingRecord ? 'Save Changes' : `Schedule ${title}`}
            />
          </div>
        </Modal>
      )}

      {isFeedbackOpen && (
        <Modal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} title="Submit Interview Feedback">
          <div className="py-4 h-[70vh] overflow-y-auto px-2">
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
               <p className="text-sm font-medium">Evaluating Candidate ID: {activeInterview?.studentId}</p>
               <p className="text-xs text-gray-500">Interview Type: {activeInterview?.interviewType}</p>
            </div>
            <GenericForm 
              schema={feedbackSchema}
              initialValues={activeInterview?.feedback || {}}
              onSubmit={handleFeedbackSubmit}
              isLoading={isSubmitting}
              submitLabel="Submit Feedback"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
