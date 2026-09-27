import React, { useState } from 'react';
import { Modal } from '../../../components/admin/ui/Modal';
import { GenericForm } from '../../../components/admin/ui/GenericForm';
import { organizationsApi } from '../../../api/organizationsApi';

/**
 * Reusable Organization Form Modal based on GenericForm engine.
 * Handles both "Create" and "Edit" modes dynamically.
 */
export const OrganizationFormModal = ({ isOpen, onClose, initialData, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!initialData?.id;

  const schema = [
    { name: 'name', label: 'Organization Name', placeholder: 'Acme Corp', fullWidth: true },
    { name: 'shortName', label: 'Short Name', placeholder: 'Acme' },
    { name: 'code', label: 'Organization Code', placeholder: 'ACME' },
    { 
      name: 'type', 
      label: 'Organization Type', 
      type: 'select', 
      fullWidth: true,
      options: [
        { label: 'College / Educational Institution', value: 'college' },
        { label: 'Company / Corporate', value: 'company' },
        { label: 'Training Institute', value: 'training_institute' },
        { label: 'University', value: 'university' },
        { label: 'Government', value: 'government' },
        { label: 'NGO', value: 'ngo' },
      ]
    },
    { name: 'email', label: 'Contact Email', type: 'email', placeholder: 'contact@acme.com' },
    { name: 'phone', label: 'Contact Phone', placeholder: '+1 555 0192' },
    { name: 'website', label: 'Website URL', placeholder: 'https://acme.com', fullWidth: true },
    { name: 'address', label: 'Address', type: 'textarea', fullWidth: true },
    { name: 'city', label: 'City', placeholder: 'San Francisco' },
    { name: 'state', label: 'State / Province', placeholder: 'CA' },
    { name: 'country', label: 'Country', placeholder: 'USA' },
    { name: 'pincode', label: 'Postal Code', placeholder: '94105' },
  ];

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await organizationsApi.updateOrganization(initialData.id, values);
      } else {
        await organizationsApi.createOrganization(values);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save organization', err);
      alert(err?.response?.data?.message || 'Failed to save organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Organization Name is required';
    if (!values.type) errors.type = 'Organization Type is required';
    return errors;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? 'Edit Organization' : 'Create New Organization'}
    >
      <div className="py-4 h-[60vh] overflow-y-auto px-2">
        <GenericForm 
          schema={schema}
          initialValues={initialData || { type: 'college' }}
          onSubmit={handleSubmit}
          validate={validate}
          isLoading={isSubmitting}
          submitLabel={isEditMode ? 'Save Changes' : 'Create Organization'}
        />
      </div>
    </Modal>
  );
};
