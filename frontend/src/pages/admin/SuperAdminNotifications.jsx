import { formatDate, formatTime, formatDateTime, parseDate, getISODate } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';

const notificationSchema = [
  { name: 'title', label: 'Announcement Title', type: 'text', required: true },
  { name: 'message', label: 'Message Body', type: 'textarea', required: true },
  { 
    name: 'type', 
    label: 'Severity / Type', 
    type: 'select', 
    required: true,
    options: [
      { label: 'Info (Blue)', value: 'info' },
      { label: 'Success (Green)', value: 'success' },
      { label: 'Warning (Yellow)', value: 'warning' },
      { label: 'Error/Alert (Red)', value: 'error' }
    ]
  },
  { 
    name: 'target_role', 
    label: 'Target Audience', 
    type: 'select', 
    required: true,
    options: [
      { label: 'All Users', value: 'all' },
      { label: 'Students Only', value: 'student' },
      { label: 'Mentors Only', value: 'mentor' },
      { label: 'College Admins', value: 'college_admin' },
      { label: 'Company Admins', value: 'company_admin' }
    ]
  }
];

const SuperAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotif, setEditingNotif] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/admin/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingNotif(null);
    setModalOpen(true);
  };

  const handleEdit = (notif) => {
    setEditingNotif(notif);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.delete(`/admin/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      alert("Failed to delete notification");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingNotif) {
      await api.put(`/admin/notifications/${editingNotif.id}`, formData);
    } else {
      await api.post('/admin/notifications', formData);
    }
    fetchNotifications();
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { 
      header: 'Type', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.type === 'error' ? 'bg-red-500/20 text-red-500' : 
          row.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
          row.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
          'bg-blue-500/20 text-blue-500'
        }`}>
          {row.type}
        </span>
      )
    },
    { 
      header: 'Audience', 
      render: (row) => (
        <span className="capitalize text-gray-300 font-medium">
          {row.target_role === 'all' ? 'All Users' : row.target_role.replace('_', ' ')}
        </span>
      )
    },
    { 
      header: 'Date', 
      render: (row) => formatDate(row.created_at)
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleEdit(row)}
            className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-xs font-bold transition-colors"
          >
            Edit
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto">
      <AdminDataTable 
        title="Global Announcements" 
        data={notifications} 
        columns={columns} 
        loading={loading} 
        onAdd={handleAdd}
        searchPlaceholder="Search announcements..." 
        searchableKeys={['title', 'message']} 
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingNotif ? "Edit Announcement" : "Draft New Announcement"}
        schema={notificationSchema}
        initialData={editingNotif}
      />
    </div>
  );
};

export default SuperAdminNotifications;
