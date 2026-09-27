import { formatDate, formatTime, formatDateTime, parseDate, getISODate } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';
import { showAlert, showConfirm } from '../../utils/uiUtils';

const notificationSchema = [
  { name: 'title', label: 'Notification Title', type: 'text', required: true },
  { name: 'message', label: 'Message Content', type: 'textarea', required: true },
  {
    name: 'type',
    label: 'Severity Level',
    type: 'select',
    required: true,
    options: [
      { label: 'Info', value: 'info' },
      { label: 'Success', value: 'success' },
      { label: 'Warning', value: 'warning' },
      { label: 'Error', value: 'error' }
    ]
  },
  {
    name: 'target_role',
    label: 'Target Audience',
    type: 'select',
    required: true,
    options: [
      { label: 'All College Members', value: 'all' },
      { label: 'Students Only', value: 'student' },
      { label: 'Faculty Only', value: 'faculty' }
    ]
  },
  {
    name: 'expires_at',
    label: 'Expiration Date (Optional)',
    type: 'date',
    required: false
  }
];

const CollegeAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/college-admin/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingNotification(null);
    setModalOpen(true);
  };

  const handleEdit = (notification) => {
    const editData = { ...notification };
    if (editData.expires_at) {
      if (editData.expires_at._seconds) {
        editData.expires_at = getISODate(editData.expires_at);
      } else {
        try {
          editData.expires_at = getISODate(editData.expires_at);
        } catch(e) {}
      }
    }
    setEditingNotification(editData);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!await showConfirm("Are you sure you want to delete this notification?")) return;
    try {
      await api.delete(`/college-admin/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      showAlert("Failed to delete notification");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingNotification) {
      await api.put(`/college-admin/notifications/${editingNotification.id}`, formData);
    } else {
      await api.post('/college-admin/notifications', formData);
    }
    fetchNotifications();
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { 
      header: 'Severity', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
          row.type === 'error' ? 'bg-red-500/20 text-red-500' : 
          row.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
          row.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
          'bg-blue-500/20 text-blue-500'
        }`}>
          {row.type}
        </span>
      )
    },
    { 
      header: 'Audience', 
      render: (row) => <span className="capitalize">{row.target_role || 'All'}</span> 
    },
    { 
      header: 'Date', 
      render: (row) => {
        const dateVal = row.created_at;
        return formatDate(dateVal);
      }
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
        title="College Announcements" 
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
        title={editingNotification ? "Edit Announcement" : "New Announcement"}
        schema={notificationSchema}
        initialData={editingNotification}
      />
    </div>
  );
};

export default CollegeAdminNotifications;
