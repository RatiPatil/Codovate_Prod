import React, { useState } from 'react';
import api from '../../api/axios';

const PostOpportunityModal = ({ isOpen, onClose, initialType = 'job' }) => {
  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [requirements, setRequirements] = useState('');
  const [salary, setSalary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/opportunities', {
        title,
        description,
        type,
        location,
        requirements: requirements.split(',').map(r => r.trim()),
        stipend_salary: salary, // Backend might use stipend_salary or similar
        status: 'open'
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post opportunity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#080812] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">Post a New {type === 'job' ? 'Job' : 'Internship'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-amber-500">✓</span>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Opportunity Posted!</h3>
              <p className="text-gray-400">Your listing is now live for students to apply.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="job">Job / Full-Time</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role Title</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Frontend Engineer"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                  placeholder="Describe the role and responsibilities..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location</label>
                  <input 
                    type="text" 
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Remote, Mumbai, etc."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Salary / Stipend</label>
                  <input 
                    type="text" 
                    required
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. 10 LPA or ₹20,000/month"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Requirements (Comma Separated)</label>
                <input 
                  type="text" 
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="React, Node.js, TypeScript"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Posting...' : `Post ${type === 'job' ? 'Job' : 'Internship'}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostOpportunityModal;
