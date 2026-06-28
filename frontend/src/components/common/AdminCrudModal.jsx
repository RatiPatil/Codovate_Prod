import React, { useState, useEffect } from 'react';

const AdminCrudModal = ({ isOpen, onClose, onSubmit, title, schema, initialData }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        // Initialize empty state based on schema
        const initialState = {};
        schema.forEach(field => {
          if (field.type === 'checkbox') {
            initialState[field.name] = false;
          } else if (field.type === 'multiselect') {
            initialState[field.name] = [];
          } else {
            initialState[field.name] = '';
          }
        });
        setFormData(initialState);
      }
      setErrors({});
    }
  }, [isOpen, initialData, schema]);

  if (!isOpen) return null;

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    schema.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name].length === 0)) {
        newErrors[field.name] = `${field.label} is required`;
      }
      if (field.type === 'email' && formData[field.name] && !/\S+@\S+\.\S+/.test(formData[field.name])) {
        newErrors[field.name] = `Valid email is required`;
      }
      if (field.type === 'number' && formData[field.name] && isNaN(formData[field.name])) {
        newErrors[field.name] = `Must be a number`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || err.message || 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {errors.submit && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
              {errors.submit}
            </div>
          )}

          <form id="crud-form" onSubmit={handleSubmit} className="space-y-4">
            {schema.map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className={`w-full bg-white/5 border ${errors[field.name] ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#2015FF] transition-colors`}
                  >
                    <option value="" disabled>Select {field.label}</option>
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-[#0f0f1a]">{opt.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder || ''}
                    rows={4}
                    className={`w-full bg-white/5 border ${errors[field.name] ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#2015FF] transition-colors`}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.type === 'number' ? Number(e.target.value) : e.target.value)}
                    placeholder={field.placeholder || ''}
                    className={`w-full bg-white/5 border ${errors[field.name] ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#2015FF] transition-colors`}
                  />
                )}
                
                {errors[field.name] && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors[field.name]}</p>
                )}
              </div>
            ))}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#050510]/50 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="crud-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#2015FF] text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#2015FF]/20"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminCrudModal;
