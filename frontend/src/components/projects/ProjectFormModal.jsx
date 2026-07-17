import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const ProjectFormModal = ({ isOpen, onClose, initialData, onSaved }) => {
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    problemStatement: '',
    solution: '',
    features: [],
    skillsLearned: [],
    techStack: [],
    githubUrl: '',
    liveUrl: '',
    videoUrl: '',
    status: 'completed'
  });

  const [featureInput, setFeatureInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [techInput, setTechInput] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        problemStatement: initialData.problemStatement || '',
        solution: initialData.solution || '',
        features: Array.isArray(initialData.features) ? initialData.features : [],
        skillsLearned: Array.isArray(initialData.skillsLearned) ? initialData.skillsLearned : [],
        techStack: Array.isArray(initialData.techStack) ? initialData.techStack : [],
        githubUrl: initialData.githubUrl || '',
        liveUrl: initialData.liveUrl || '',
        videoUrl: initialData.videoUrl || '',
        status: initialData.status || 'completed'
      });
    } else if (isOpen) {
      setForm({
        title: '', description: '', problemStatement: '', solution: '',
        features: [], skillsLearned: [], techStack: [], githubUrl: '', liveUrl: '', videoUrl: '', status: 'completed'
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast.error('Title and description are required.');
      return;
    }

    setSaving(true);
    try {
      if (initialData?.id) {
        await api.put(`/projects/${initialData.id}`, form);
        toast.success('Project updated!');
      } else {
        await api.post('/projects', form);
        toast.success('Project created!');
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddArrayItem = (field, value, setter) => {
    if (value.trim() && !form[field].includes(value.trim())) {
      setForm({ ...form, [field]: [...form[field], value.trim()] });
    }
    setter('');
  };

  const handleRemoveArrayItem = (field, valueToRemove) => {
    setForm({ ...form, [field]: form[field].filter(v => v !== valueToRemove) });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl relative z-10 p-6 custom-scrollbar animate-fade-in-up">
        
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">🚀</span>
            {initialData ? 'Edit Project' : 'Create Professional Project'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition bg-white/5 hover:bg-white/10 p-1.5 rounded-lg border border-white/10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Project Name *</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-glass w-full text-sm" placeholder="e.g. AI Portfolio Generator" />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Brief Description *</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-glass w-full h-20 resize-none text-sm" placeholder="A short summary of what it does..." />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Problem Statement</label>
                <textarea value={form.problemStatement} onChange={e => setForm({...form, problemStatement: e.target.value})} className="input-glass w-full h-24 resize-none text-sm" placeholder="What specific problem does this project solve?" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Solution</label>
                <textarea value={form.solution} onChange={e => setForm({...form, solution: e.target.value})} className="input-glass w-full h-24 resize-none text-sm" placeholder="How did you solve it?" />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Links</label>
                <div className="space-y-2.5">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500"><i className="fab fa-github"></i></span>
                    <input type="url" value={form.githubUrl} onChange={e => setForm({...form, githubUrl: e.target.value})} className="input-glass w-full pl-9 text-sm" placeholder="GitHub Repository URL" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500"><i className="fas fa-globe"></i></span>
                    <input type="url" value={form.liveUrl} onChange={e => setForm({...form, liveUrl: e.target.value})} className="input-glass w-full pl-9 text-sm" placeholder="Live Demo URL" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500"><i className="fas fa-video"></i></span>
                    <input type="url" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} className="input-glass w-full pl-9 text-sm" placeholder="Demo Video URL (YouTube/Loom)" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-glass w-full text-sm font-semibold">
                  <option value="in_progress">🔨 In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Technologies Used</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddArrayItem('techStack', techInput, setTechInput); } }} className="input-glass flex-1 text-sm" placeholder="e.g. React, Node.js" />
                  <button type="button" onClick={() => handleAddArrayItem('techStack', techInput, setTechInput)} className="px-4 text-xs rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.techStack.map((tech, i) => (
                    <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-md flex items-center gap-1 border border-primary/20">
                      {tech} <button type="button" onClick={() => handleRemoveArrayItem('techStack', tech)} className="hover:text-white transition">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Key Features</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddArrayItem('features', featureInput, setFeatureInput); } }} className="input-glass flex-1 text-sm" placeholder="e.g. Real-time chat" />
                  <button type="button" onClick={() => handleAddArrayItem('features', featureInput, setFeatureInput)} className="px-4 text-xs rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition">Add</button>
                </div>
                <ul className="space-y-1.5 text-sm text-gray-300">
                  {form.features.map((feat, i) => (
                    <li key={i} className="flex justify-between items-start bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 leading-tight">
                      <span className="pr-2 text-xs text-gray-200">✨ {feat}</span>
                      <button type="button" onClick={() => handleRemoveArrayItem('features', feat)} className="text-gray-500 hover:text-red-400 shrink-0 transition">×</button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Skills Learned</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddArrayItem('skillsLearned', skillInput, setSkillInput); } }} className="input-glass flex-1 text-sm" placeholder="e.g. System Design, WebSockets" />
                  <button type="button" onClick={() => handleAddArrayItem('skillsLearned', skillInput, setSkillInput)} className="px-4 text-xs rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.skillsLearned.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-md flex items-center gap-1 border border-green-500/20">
                      {skill} <button type="button" onClick={() => handleRemoveArrayItem('skillsLearned', skill)} className="hover:text-white transition">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/10 flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition font-bold text-xs">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white transition font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(32,21,255,0.4)]">
              {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (initialData ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormModal;
