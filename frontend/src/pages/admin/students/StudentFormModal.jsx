import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/admin/ui/Modal';
import { GenericForm } from '../../../components/admin/ui/GenericForm';
import { studentsApi } from '../../../api/studentsApi';
import { academicApi } from '../../../api/academicApi';
import { collegesApi } from '../../../api/collegesApi';

/**
 * Reusable Student Form Modal based on GenericForm engine.
 */
export const StudentFormModal = ({ isOpen, onClose, initialData, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!initialData?.id;

  // Dynamic Lookups
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        collegesApi.getColleges({ limit: 100 }),
        academicApi.departments.getMany({ limit: 100 }),
        academicApi.programs.getMany({ limit: 100 }),
        academicApi.semesters.getMany({ limit: 100 }),
        academicApi.divisions.getMany({ limit: 100 }),
      ]).then(([cRes, dRes, pRes, sRes, divRes]) => {
        setColleges(cRes.data.data.map(i => ({ label: i.name, value: i.id })));
        setDepartments(dRes.data.data.map(i => ({ label: i.name, value: i.id })));
        setPrograms(pRes.data.data.map(i => ({ label: i.name, value: i.id })));
        setSemesters(sRes.data.data.map(i => ({ label: `Semester ${i.semesterNumber}`, value: i.id })));
        setDivisions(divRes.data.data.map(i => ({ label: i.name, value: i.id })));
      }).catch(err => console.error("Failed to load lookups", err));
    }
  }, [isOpen]);

  const schema = [
    // Identity Section (Only required on creation, though we can edit names)
    { name: 'name', label: 'Full Name', placeholder: 'John Doe', fullWidth: true },
    { name: 'email', label: 'Email Address (Login)', type: 'email', placeholder: 'john@college.edu', fullWidth: true, disabled: isEditMode },
    
    // Academic Hierarchy
    { name: 'collegeId', label: 'College', type: 'select', options: colleges, fullWidth: true },
    { name: 'departmentId', label: 'Department', type: 'select', options: departments },
    { name: 'programId', label: 'Program', type: 'select', options: programs },
    { name: 'semesterId', label: 'Current Semester', type: 'select', options: semesters },
    { name: 'divisionId', label: 'Division', type: 'select', options: divisions },
    
    // Identifiers
    { name: 'prn', label: 'PRN / University Reg No', placeholder: '10203040' },
    { name: 'rollNumber', label: 'Roll Number', placeholder: 'CS-01' },
    
    // Scores & Readiness
    { name: 'cgpa', label: 'Current CGPA', type: 'number', placeholder: '8.5' },
    { name: 'placementReadiness', label: 'Placement Readiness (%)', type: 'number', placeholder: '85' },
  ];

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await studentsApi.updateStudent(initialData.id, values);
      } else {
        await studentsApi.createStudent(values);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save student', err);
      alert(err?.response?.data?.message || 'Failed to save student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.email) errors.email = 'Email is required';
    if (!values.collegeId) errors.collegeId = 'College mapping is required';
    return errors;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? 'Edit Student Profile' : 'Onboard New Student'}
    >
      <div className="py-4 h-[65vh] overflow-y-auto px-2">
        <GenericForm 
          schema={schema}
          initialValues={initialData || {}}
          onSubmit={handleSubmit}
          validate={validate}
          isLoading={isSubmitting}
          submitLabel={isEditMode ? 'Save Changes' : 'Onboard Student'}
        />
      </div>
    </Modal>
  );
};
