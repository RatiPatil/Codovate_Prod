import React, { useState } from 'react';
import api from '../../api/axios';

const BroadcastNotificationModal = ({ isOpen, onClose }) => {
  const [targetAudience, setTargetAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/admin/notifications/broadcast', {
        targetAudience,
        title,
        message
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle('');
        setMessage('');
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#080812] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Broadcast Notification</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#2015FF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-[#2015FF]">✓</span>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Broadcast Sent!</h3>
              <p className="text-gray-400">Your notification has been dispatched.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">{error}</div>}
              
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Target Audience</label>
                <select 
                  value={targetAudience} 
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#2015FF]"
                >
                  <option value="all">All Users</option>
                  <option value="student">All Students</option>
                  <option value="college_admin">All College Admins</option>
                  <option value="company_admin">All Company Admins</option>
                  <option value="mentor">All Mentors</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Notification Title</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Platform Maintenance"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#2015FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Message</label>
                <textarea 
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="4"
                  placeholder="Type your message here..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#2015FF] resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
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
                  className="px-6 py-3 rounded-xl font-bold bg-[#2015FF] text-white hover:bg-[#2015FF]/80 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BroadcastNotificationModal;
