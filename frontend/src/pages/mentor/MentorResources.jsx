import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileText, Download, Trash2, Link as LinkIcon, FileVideo } from 'lucide-react';
import { showAlert, showConfirm } from '../../utils/uiUtils';
import { format } from 'date-fns';

const MentorResources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Interview Prep',
    file_type: 'pdf',
    file_url: ''
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await api.get('/mentor-resources');
      setResources(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.file_url) return showAlert("Title and URL are required.");
    
    try {
      await api.post('/mentor-resources', formData);
      setShowModal(false);
      setFormData({ title: '', description: '', category: 'Interview Prep', file_type: 'pdf', file_url: '' });
      fetchResources();
      showAlert("Resource uploaded successfully");
    } catch (err) {
      showAlert("Failed to upload resource");
    }
  };

  const handleDelete = async (id) => {
    if (!await showConfirm("Are you sure you want to delete this resource?")) return;
    try {
      await api.delete(`/mentor-resources/${id}`);
      fetchResources();
      showAlert("Deleted successfully");
    } catch (err) {
      showAlert("Failed to delete");
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'pdf': return <FileText size={24} className="text-red-400" />;
      case 'video': return <FileVideo size={24} className="text-blue-400" />;
      default: return <LinkIcon size={24} className="text-emerald-400" />;
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Resource Center</h1>
          <p className="text-gray-400">Share PDFs, notes, roadmaps, and videos with students.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          <Upload size={18} /> Upload Resource
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl"></div>)}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <FolderOpen size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">You haven't uploaded any resources yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(res => (
            <div key={res.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-xl">
                  {getIcon(res.file_type)}
                </div>
                <button 
                  onClick={() => handleDelete(res.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 className="font-bold text-lg text-white mb-2">{res.title}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">{res.description}</p>
              
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/10">
                <span className="text-xs text-gray-500">{format(new Date(res.created_at?.toDate ? res.created_at.toDate() : res.created_at), 'MMM d, yyyy')}</span>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{res.downloads || 0} clicks</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A0A1B] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-6">Upload Resource</h2>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea 
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <select 
                    value={formData.file_type}
                    onChange={e => setFormData({...formData, file_type: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="pdf" className="bg-[#0A0A1B]">PDF / Document</option>
                    <option value="video" className="bg-[#0A0A1B]">Video</option>
                    <option value="link" className="bg-[#0A0A1B]">External Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Interview Prep" className="bg-[#0A0A1B]">Interview Prep</option>
                    <option value="Roadmap" className="bg-[#0A0A1B]">Roadmap</option>
                    <option value="Notes" className="bg-[#0A0A1B]">Notes</option>
                    <option value="Coding Sheet" className="bg-[#0A0A1B]">Coding Sheet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">URL (Drive Link, YouTube, etc.)</label>
                <input 
                  type="url" 
                  required
                  value={formData.file_url}
                  onChange={e => setFormData({...formData, file_url: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorResources;
/ /   E O F  
 