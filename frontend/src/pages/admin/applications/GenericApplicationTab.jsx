import React, { useRef, useState } from 'react';
import { DataTable } from '../../../components/admin/ui/DataTable';
import { Modal } from '../../../components/admin/ui/Modal';
import { Badge } from '../../../components/admin/ui/Badge';
import { ChevronRight, Download, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../../components/admin/ui/Button';

export const GenericApplicationTab = ({ 
  title, 
  apiClient, 
  columns, 
  onRefreshMetrics,
  baseFilter = {}
}) => {
  const tableRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [activeTimeline, setActiveTimeline] = useState([]);

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

  const ATS_STAGES = [
    'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_RELEASED', 'HIRED'
  ];
  
  const handleStageAdvance = async (id, currentStage) => {
    const currentIndex = ATS_STAGES.indexOf(currentStage || 'SUBMITTED');
    if (currentIndex === -1 || currentIndex >= ATS_STAGES.length - 1) return;
    const nextStage = ATS_STAGES[currentIndex + 1];
    
    if (!window.confirm(`Move candidate to ${nextStage}?`)) return;
    try {
      await apiClient.advanceStage(id, nextStage);
      tableRef.current?.refresh();
      onRefreshMetrics();
    } catch (err) { alert('Failed to advance stage'); }
  };

  const handleBulkStage = async (stage) => {
    if (selectedIds.length === 0) return alert('Select candidates first.');
    if (!window.confirm(`Move ${selectedIds.length} candidates to ${stage}?`)) return;
    
    try {
      await apiClient.bulkUpdateStage({ applicationIds: selectedIds, stage });
      tableRef.current?.refresh();
      onRefreshMetrics();
      setSelectedIds([]);
    } catch (err) { alert('Failed to perform bulk update'); }
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
      header: 'ATS Stage', 
      key: 'recordStatus', 
      render: (val) => {
        const variants = { 
          SUBMITTED: 'default', 
          UNDER_REVIEW: 'warning', 
          SHORTLISTED: 'primary', 
          INTERVIEW_SCHEDULED: 'success', 
          OFFER_RELEASED: 'success', 
          HIRED: 'success',
          REJECTED: 'danger',
          WITHDRAWN: 'danger'
        };
        return <Badge variant={variants[val] || 'default'}>{val || 'SUBMITTED'}</Badge>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => {
        const isTerminal = ['HIRED', 'REJECTED', 'WITHDRAWN'].includes(row.recordStatus);
        return (
          <div className="flex items-center gap-2">
            
            <button onClick={() => viewTimeline(row.timeline)} className="text-xs font-medium text-indigo-600 hover:underline">
              Timeline
            </button>

            {!isTerminal && (
              <>
                <button onClick={() => handleStageAdvance(row.id, row.recordStatus)} className="p-1 text-gray-500 hover:text-blue-600 font-semibold" title="Advance Stage">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => {
                  if (window.confirm("Reject this candidate?")) apiClient.advanceStage(row.id, 'REJECTED').then(() => { tableRef.current?.refresh(); onRefreshMetrics(); });
                }} className="p-1 text-gray-500 hover:text-red-600" title="Reject Candidate">
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )
      }
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Top Bar with Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 ml-4 animate-in fade-in">
              <span className="text-sm text-gray-500">{selectedIds.length} selected:</span>
              <Button size="sm" variant="secondary" onClick={() => handleBulkStage('SHORTLISTED')}>Shortlist</Button>
              <Button size="sm" variant="danger" onClick={() => handleBulkStage('REJECTED')}>Reject</Button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {apiClient.export && (
            <Button variant="secondary" size="sm" leftIcon={Download} onClick={handleExport}>Export Pipeline</Button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-[500px]">
        <DataTable 
          ref={tableRef}
          columns={internalColumns}
          fetchData={fetchData}
          enableSelection={true}
          enableSearch={true}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {isTimelineOpen && (
        <Modal isOpen={isTimelineOpen} onClose={() => setIsTimelineOpen(false)} title="Application Timeline">
          <div className="py-4 px-2 space-y-4">
             {activeTimeline.length === 0 ? (
               <p className="text-gray-500">No timeline data available.</p>
             ) : (
               <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
                 {activeTimeline.map((event, idx) => (
                   <div key={idx} className="relative pl-6">
                     <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-gray-800" />
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
