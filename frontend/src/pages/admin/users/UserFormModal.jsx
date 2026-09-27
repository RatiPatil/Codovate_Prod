import React, { useState } from 'react';
import { Modal } from '../../../components/admin/ui/Modal';
import { GenericForm } from '../../../components/admin/ui/GenericForm';
import { usersApi } from '../../../api/usersApi';

/**
 * Reusable User Form Modal based on GenericForm engine.
 * Handles both "Create" and "Edit" modes dynamically.
 */
export const UserFormModal = ({ isOpen, onClose, initialData, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!initialData?.id;

  const schema = [
    { name: 'firstName', label: 'First Name', placeholder: 'Jane' },
    { name: 'lastName', label: 'Last Name', placeholder: 'Doe' },
    { 
      name: 'email', 
      label: 'Email Address', 
      type: 'email', 
      fullWidth: true,
      disabled: isEditMode // usually block email changes without re-auth, or handle in a specific flow
    },
    { 
      name: 'role', 
      label: 'Role', 
      type: 'select', 
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Faculty', value: 'faculty' },
        { label: 'Mentor', value: 'mentor' },
        { label: 'Recruiter', value: 'recruiter' },
        { label: 'College Admin', value: 'college_admin' },
        { label: 'Super Admin', value: 'super_admin' },
      ]
    },
    { 
      name: 'orgId', 
      label: 'Organization ID (Optional)', 
      placeholder: 'org_xxxxxx'
    },
    // We only require a password on creation. Edit doesn't touch password through this UI.
    ...(!isEditMode ? [{
      name: 'password',
      label: 'Temporary Password',
      type: 'password',
      fullWidth: true
    }] : [])
  ];

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await usersApi.updateUser(initialData.id, values);
      } else {
        await usersApi.createUser(values);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save user', err);
      alert(err?.response?.data?.message || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values.email) errors.email = 'Email is required';
    if (!values.role) errors.role = 'Role is required';
    if (!isEditMode && !values.password) errors.password = 'Password is required for new users';
    return errors;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? 'Edit User Profile' : 'Create New User'}
    >
      <div className="py-4">
        <GenericForm 
          schema={schema}
          initialValues={initialData || { role: 'student' }}
          onSubmit={handleSubmit}
          validate={validate}
          isLoading={isSubmitting}
          submitLabel={isEditMode ? 'Save Changes' : 'Create User'}
        />
      </div>
    </Modal>
  );
};
