import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Save, RefreshCw } from 'lucide-react';

/**
 * GenericForm Engine
 * Renders a complete form based on a schema array and handles state + validation.
 * 
 * @param {Array} schema - [{ name: 'email', label: 'Email', type: 'email', required: true }]
 * @param {Object} initialValues - {}
 * @param {Function} onSubmit - async (values) => void
 * @param {Function} validate - (values) => { fieldName: 'error string' }
 */
export const GenericForm = ({
  schema = [],
  initialValues = {},
  onSubmit,
  validate,
  submitLabel = "Save Changes",
  isLoading = false
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Sync if initialValues change externally (like data loaded from API)
  useEffect(() => {
    setValues(initialValues);
    setIsDirty(false);
    setErrors({});
  }, [initialValues]);

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    // Clear error for this field on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleReset = () => {
    setValues(initialValues);
    setIsDirty(false);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    try {
      await onSubmit(values);
      setIsDirty(false);
    } catch (err) {
      console.error('[GenericForm] Submit error', err);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      label: field.label,
      value: values[field.name] || '',
      onChange: (e) => handleChange(field.name, e.target.value),
      error: errors[field.name],
      disabled: isLoading || field.disabled,
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name} className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
            <textarea
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={isLoading || field.disabled}
              placeholder={field.placeholder}
              rows={field.rows || 4}
              className={`block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors[field.name] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors[field.name] && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[field.name]}</p>}
          </div>
        );
      
      case 'select':
        return (
          <div key={field.name} className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
            <select
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={isLoading || field.disabled}
              className={`block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors[field.name] ? 'border-red-300 focus:border-red-500' : ''}`}
            >
              <option value="" disabled>Select an option</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors[field.name] && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[field.name]}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center mt-6">
            <input
              type="checkbox"
              id={field.name}
              checked={!!values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              disabled={isLoading || field.disabled}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor={field.name} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              {field.label}
            </label>
          </div>
        );

      default:
        // text, email, number, password, etc.
        return <Input key={field.name} type={field.type || 'text'} {...commonProps} />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Dirty Warning */}
      {isDirty && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-400 px-4 py-3 rounded-lg text-sm flex items-center">
          You have unsaved changes.
        </div>
      )}

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schema.map(field => (
          <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : ''}>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          disabled={!isDirty || isLoading}
          leftIcon={RefreshCw}
        >
          Reset
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={!isDirty}
          leftIcon={Save}
        >
          {submitLabel}
        </Button>
      </div>

    </form>
  );
};
