import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';

const notificationSchema = [
  { name: 'title', label: 'Notification Title', type: 'text', required: true },
  { name: 'message', label: 'Message Content', type: 'textarea', required: true }
];

const CompanyAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/company-admin/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleEdit = (notification) => {
    setEditData(notification);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      await api.delete(`/company-admin/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      alert("Failed to delete notification");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editData) {
        await api.put(`/company-admin/notifications/${editData.id}`, formData);
      } else {
        await api.post('/company-admin/notifications', formData);
      }
      setModalOpen(false);
      setEditData(null);
      fetchNotifications();
    } catch (err) {
      alert("Failed to save notification");
    }
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Message', accessor: 'message' },
    { 
      header: 'Date Sent', 
      render: (row) => new Date(row.created_at).toLocaleDateString() 
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
        title="Company Notifications"
        data={notifications}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        searchPlaceholder="Search notifications..."
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSubmit={handleSubmit}
        title={editData ? "Edit Notification" : "Send New Notification"}
        schema={notificationSchema}
        initialData={editData}
      />
    </div>
  );
};

export default CompanyAdminNotifications;
