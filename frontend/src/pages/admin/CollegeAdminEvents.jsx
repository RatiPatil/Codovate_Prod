import React, { useState, useEffect } from 'react';
import AdminDataTable from '../../components/common/AdminDataTable';
import AdminCrudModal from '../../components/common/AdminCrudModal';
import api from '../../api/axios';

const eventSchema = [
  { name: 'title', label: 'Event Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'date', label: 'Event Date', type: 'date', required: true },
  {
    name: 'type',
    label: 'Event Type',
    type: 'select',
    required: true,
    options: [
      { label: 'Hackathon', value: 'hackathon' },
      { label: 'Webinar', value: 'webinar' },
      { label: 'Workshop', value: 'workshop' }
    ]
  },
  { name: 'link', label: 'Registration/Join Link', type: 'text' }
];

const CollegeAdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/college-admin/events');
      setEvents(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/college-admin/events/${id}`);
      fetchEvents();
    } catch (err) {
      alert("Failed to delete event");
    }
  };

  const handleSubmit = async (formData) => {
    if (editingEvent) {
      await api.put(`/college-admin/events/${editingEvent.id}`, formData);
    } else {
      await api.post('/college-admin/events', formData);
    }
    fetchEvents();
  };

  const columns = [
    { header: 'Event Title', accessor: 'title' },
    { header: 'Type', accessor: 'type', render: (row) => <span className="capitalize">{row.type}</span> },
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
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
        title="College Events" 
        data={events} 
        columns={columns} 
        loading={loading} 
        onAdd={handleAdd}
        searchPlaceholder="Search events..." 
        searchableKeys={['title', 'type']} 
      />
      <AdminCrudModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingEvent ? "Edit Event" : "Create Event"}
        schema={eventSchema}
        initialData={editingEvent}
      />
    </div>
  );
};

export default CollegeAdminEvents;
