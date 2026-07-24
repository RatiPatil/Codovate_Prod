import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '../components/admin/ui/Card';
import { Button } from '../components/admin/ui/Button';
import { Input } from '../components/admin/ui/Input';
import { Badge } from '../components/admin/ui/Badge';
import { Modal } from '../components/admin/ui/Modal';
import { DataTable } from '../components/admin/ui/DataTable';
import { GenericForm } from '../components/admin/ui/GenericForm';
import { Plus, Trash, Mail } from 'lucide-react';

const AdminSandbox = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock Form Schema
  const formSchema = [
    { name: 'firstName', label: 'First Name', placeholder: 'John' },
    { name: 'lastName', label: 'Last Name', placeholder: 'Doe' },
    { name: 'email', label: 'Email Address', type: 'email', fullWidth: true, placeholder: 'john@example.com' },
    { name: 'role', label: 'Role', type: 'select', options: [{label: 'Admin', value: 'admin'}, {label: 'User', value: 'user'}] },
    { name: 'bio', label: 'Biography', type: 'textarea', fullWidth: true },
    { name: 'isActive', label: 'Active Account', type: 'checkbox', fullWidth: true },
  ];

  // Mock DataTable Fetcher
  const mockFetchData = async ({ limit, cursor }) => {
    return new Promise(resolve => setTimeout(() => {
      resolve({
        data: Array.from({ length: 5 }).map((_, i) => ({
          id: `usr_${Date.now()}_${i}`,
          name: `Mock User ${i}`,
          email: `mock${i}@example.com`,
          status: i % 2 === 0 ? 'ACTIVE' : 'SUSPENDED'
        })),
        pagination: { nextCursor: 'mock_next_cursor' }
      });
    }, 1000));
  };

  const tableColumns = [
    { header: 'Name', key: 'name', sortable: true },
    { header: 'Email', key: 'email', sortable: true },
    { header: 'Status', key: 'status', render: (val) => (
      <Badge variant={val === 'ACTIVE' ? 'success' : 'danger'}>{val}</Badge>
    )}
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin UI Sandbox</h1>
        <p className="text-gray-500 dark:text-gray-400">A testing ground for the Enterprise Design System.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Buttons & Badges */}
        <Card>
          <CardHeader><CardTitle>Buttons & Badges</CardTitle></CardHeader>
          <CardBody className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button leftIcon={Plus}>With Icon</Button>
              <Button isLoading>Loading</Button>
            </div>
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
            </div>
          </CardBody>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader><CardTitle>Form Inputs</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <Input label="Standard Input" placeholder="Type something..." />
            <Input label="With Icon" leftIcon={Mail} placeholder="email@example.com" />
            <Input label="Error State" error="This field is required" defaultValue="Invalid data" />
          </CardBody>
        </Card>
      </div>

      {/* Form Engine */}
      <Card>
        <CardHeader><CardTitle>Generic Form Engine</CardTitle></CardHeader>
        <CardBody>
          <GenericForm 
            schema={formSchema} 
            initialValues={{ isActive: true }}
            onSubmit={async (val) => { console.log(val); alert('Form Submitted (check console)'); }}
          />
        </CardBody>
      </Card>

      {/* DataTable Engine */}
      <Card>
        <CardHeader><CardTitle>Enterprise DataTable</CardTitle></CardHeader>
        <CardBody className="p-0">
          <div className="h-[400px]">
            <DataTable 
              title="Users Table"
              columns={tableColumns} 
              fetchData={mockFetchData}
              enableSelection={true}
            />
          </div>
        </CardBody>
      </Card>

      {/* Modals */}
      <Card>
        <CardHeader><CardTitle>Overlays</CardTitle></CardHeader>
        <CardBody>
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
        </CardBody>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Delete Organization"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="danger" leftIcon={Trash}>Confirm Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete this organization? This action cannot be undone and will permanently remove all associated users and data.</p>
      </Modal>

    </div>
  );
};

export default AdminSandbox;
