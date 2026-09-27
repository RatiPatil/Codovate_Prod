import React, { useState, useEffect } from 'react';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { interviewsApi } from '../../../api/interviewsApi';
import { applicationsApi } from '../../../api/applicationsApi';
import { recruitersApi } from '../../../api/recruitersApi';
import { GenericInterviewTab } from './GenericInterviewTab';
import { Calendar, Video, CheckCircle, Clock } from 'lucide-react';

const InterviewManagement = () => {
  const [metrics, setMetrics] = useState({ data: null, loading: true });
  const [applications, setApplications] = useState([]);
  const [recruiters, setRecruiters] = useState([]);

  const fetchMetrics = async () => {
    try {
      const res = await interviewsApi.getMetrics();
      setMetrics({ data: res.data.data, loading: false });
    } catch (err) {
      console.error(err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchLookups = async () => {
    try {
      const [appRes, recRes] = await Promise.all([
        applicationsApi.getMany({ limit: 100, recordStatus: 'SHORTLISTED' }),
        recruitersApi.profiles.getMany({ limit: 200 })
      ]);
      // Normally we'd fetch ALL applications, but for performance we just pull Shortlisted for scheduling
      setApplications(appRes.data.data.map(a => ({ label: `App ID: ${a.id} (Student: ${a.studentId})`, value: a.id })));
      setRecruiters(recRes.data.data.map(r => ({ label: r.name || r.email, value: r.userId })));
    } catch (err) {
      console.error("Failed to fetch lookups", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchLookups();
  }, []);

  const columns = [
    { header: 'App ID', key: 'applicationId', render: val => <span className="font-mono text-xs">{val}</span> },
    { header: 'Type', key: 'interviewType' },
    { header: 'Date', key: 'scheduledAt', render: val => new Date(val).toLocaleString() },
    { header: 'Mode', key: 'mode' }
  ];

  const schema = [
    { name: 'applicationId', label: 'Target Application', type: 'select', options: applications, fullWidth: true },
    { name: 'interviewType', label: 'Interview Type', type: 'select', options: [
      {label: 'Technical', value: 'Technical'},
      {label: 'HR', value: 'HR'},
      {label: 'Managerial', value: 'Managerial'},
      {label: 'Group Discussion', value: 'Group Discussion'},
      {label: 'Coding Test', value: 'Coding Test'}
    ]},
    { name: 'mode', label: 'Mode', type: 'select', options: [
      {label: 'Online', value: 'Online'},
      {label: 'Offline', value: 'Offline'},
      {label: 'Hybrid', value: 'Hybrid'}
    ]},
    { name: 'scheduledAt', label: 'Date & Time', type: 'date', fullWidth: true }, // Ideally datetime-local, GenericForm uses date for now
    { name: 'durationMinutes', label: 'Duration (Minutes)', type: 'number', placeholder: '60' },
    { name: 'panelMemberIds', label: 'Panel Members (Comma Separated User IDs)', placeholder: 'uid1, uid2', fullWidth: true },
    { name: 'meetingLink', label: 'Meeting Link', placeholder: 'https://meet.google.com/xxx', fullWidth: true },
    { name: 'venue', label: 'Physical Venue', placeholder: 'Conference Room A', fullWidth: true }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Workspace</h1>
        <p className="text-gray-500 dark:text-gray-400">Schedule assessments, manage panels, and capture structured feedback.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Interviews" value={metrics.data?.total} icon={Calendar} isLoading={metrics.loading} />
        <StatCard title="Scheduled" value={metrics.data?.scheduled} icon={Clock} isLoading={metrics.loading} />
        <StatCard title="Pending Feedback" value={metrics.data?.pendingFeedback} icon={Video} isLoading={metrics.loading} />
        <StatCard title="Passed Candidates" value={metrics.data?.passed} icon={CheckCircle} isLoading={metrics.loading} />
      </div>

      <div className="pt-2">
        <GenericInterviewTab
          title="Interviews"
          apiClient={interviewsApi}
          columns={columns}
          formSchema={schema}
          onRefreshMetrics={fetchMetrics}
        />
      </div>

    </div>
  );
};

export default InterviewManagement;
