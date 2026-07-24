import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/admin/ui/Modal';
import { GenericForm } from '../../../components/admin/ui/GenericForm';
import { collegesApi } from '../../../api/collegesApi';
import { organizationsApi } from '../../../api/organizationsApi';

/**
 * Reusable College Form Modal based on GenericForm engine.
 */
export const CollegeFormModal = ({ isOpen, onClose, initialData, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgOptions, setOrgOptions] = useState([]);
  const isEditMode = !!initialData?.id;

  // Fetch organizations to populate the orgId dropdown
  useEffect(() => {
    if (isOpen) {
      organizationsApi.getOrganizations({ limit: 100 }).then(res => {
        // ideally filter by type='college' or similar, but for now we list all
        const options = res.data.data.map(org => ({
          label: org.name,
          value: org.id
        }));
        setOrgOptions(options);
      }).catch(err => console.error("Failed to load organizations for dropdown", err));
    }
  }, [isOpen]);

  const schema = [
    { name: 'name', label: 'College Name', placeholder: 'Stanford University', fullWidth: true },
    { name: 'shortName', label: 'Short Name', placeholder: 'Stanford' },
    { name: 'collegeCode', label: 'College Code', placeholder: 'STN' },
    { name: 'aicteCode', label: 'AICTE / Statutory Code', placeholder: '1-1234567' },
    { 
      name: 'orgId', 
      label: 'Parent Organization', 
      type: 'select',
      options: orgOptions,
      fullWidth: true 
    },
    { name: 'university', label: 'Affiliating University', placeholder: 'Stanford', fullWidth: true },
    { name: 'autonomousStatus', label: 'Autonomous Institution', type: 'checkbox' },
    { name: 'naacGrade', label: 'NAAC Grade', placeholder: 'A++' },
    { name: 'principalName', label: 'Principal Name', placeholder: 'Dr. Jane Doe' },
    { name: 'tpoName', label: 'Training & Placement Officer', placeholder: 'John Smith' },
    { name: 'email', label: 'Contact Email', type: 'email', placeholder: 'admin@college.edu' },
    { name: 'phone', label: 'Contact Phone', placeholder: '+1 555 0192' },
    { name: 'website', label: 'Website URL', placeholder: 'https://college.edu', fullWidth: true },
    { name: 'address', label: 'Address', type: 'textarea', fullWidth: true },
    { name: 'city', label: 'City', placeholder: 'Palo Alto' },
    { name: 'state', label: 'State / Province', placeholder: 'CA' },
    { name: 'country', label: 'Country', placeholder: 'USA' },
    { name: 'establishedYear', label: 'Established Year', placeholder: '1885', type: 'number' },
  ];

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await collegesApi.updateCollege(initialData.id, values);
      } else {
        await collegesApi.createCollege(values);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save college', err);
      alert(err?.response?.data?.message || 'Failed to save college');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'College Name is required';
    if (!values.orgId) errors.orgId = 'Parent Organization is required';
    return errors;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? 'Edit College Profile' : 'Register New College'}
    >
      <div className="py-4 h-[65vh] overflow-y-auto px-2">
        <GenericForm 
          schema={schema}
          initialValues={initialData || { autonomousStatus: false }}
          onSubmit={handleSubmit}
          validate={validate}
          isLoading={isSubmitting}
          submitLabel={isEditMode ? 'Save Changes' : 'Register College'}
        />
      </div>
    </Modal>
  );
};
