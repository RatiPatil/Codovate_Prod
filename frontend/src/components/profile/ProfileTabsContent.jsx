import React, { useState } from 'react';
import { Edit3, Plus, User as UserIcon, Briefcase, GraduationCap, LayoutDashboard, Globe, X, ExternalLink, Award, Trophy } from 'lucide-react';

/* ── About Tab ──────────────────────────────────────────────────────── */
export const AboutTab = ({ form, setForm, editingSection, setEditingSection, handleSaveSection, saving }) => {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-6 sm:p-8 shadow-sm group relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-indigo-500" /> About Me
        </h2>
        
        {editingSection === 'bio' ? (
          <div className="flex gap-2">
            <button onClick={() => setEditingSection(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition">Cancel</button>
            <button onClick={() => handleSaveSection('bio')} disabled={saving} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setEditingSection('bio')} 
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Edit3 size={14} /> Edit About
          </button>
        )}
      </div>

      {editingSection === 'bio' ? (
        <textarea 
          value={form.bio} 
          onChange={e => setForm({...form, bio: e.target.value})} 
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y min-h-[120px]" 
          placeholder="Tell us your story..."
        />
      ) : (
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap max-w-3xl">
          {form.bio || <span className="text-gray-400 italic">No bio added yet. Write something awesome about yourself!</span>}
        </p>
      )}
    </div>
  );
};

/* ── Skills Tab ─────────────────────────────────────────────────────── */
export const SkillsTab = ({ skills, setSkills, editingSection, setEditingSection, handleSaveSection, saving }) => {
  const [customSkill, setCustomSkill] = useState('');
  const ALL_SKILLS = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Git'];

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-6 sm:p-8 shadow-sm group relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-500" /> Skills
        </h2>
        
        {editingSection === 'skills' ? (
          <div className="flex gap-2">
            <button onClick={() => setEditingSection(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition">Cancel</button>
            <button onClick={() => handleSaveSection('skills')} disabled={saving} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setEditingSection('skills')} 
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Edit3 size={14} /> Edit Skills
          </button>
        )}
      </div>

      {editingSection === 'skills' ? (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => {
              const skillName = typeof skill === 'string' ? skill : (skill?.name || '');
              return (
                <div key={idx} className="flex items-center justify-between pl-3 pr-1 py-1 bg-gray-100 border border-gray-200 rounded-xl">
                  <span className="text-gray-800 text-sm font-medium mr-2">{skillName}</span>
                  <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="p-1 text-gray-400 hover:text-red-500 bg-white rounded-lg shadow-sm transition"><X className="w-3 h-3" /></button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input type="text" value={customSkill} onChange={e => setCustomSkill(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customSkill.trim() && !skills.includes(customSkill.trim())) { setSkills([...skills, customSkill.trim()]); setCustomSkill(''); } } }} placeholder="Add a custom skill..." className="px-4 py-2 text-sm border border-gray-200 rounded-xl flex-1 focus:outline-none focus:border-indigo-500" />
            <button onClick={() => { if (customSkill.trim() && !skills.includes(customSkill.trim())) { setSkills([...skills, customSkill.trim()]); setCustomSkill(''); } }} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-900 transition">Add</button>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-3">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.filter(s => !skills.includes(s)).slice(0, 10).map(skill => (
                <button key={skill} onClick={() => setSkills([...skills, skill])} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 transition flex items-center gap-1"><Plus className="w-3 h-3" /> {skill}</button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {skills.length > 0 ? (
            skills.map((skill, idx) => {
              const skillName = typeof skill === 'string' ? skill : (skill?.name || '');
              return (
                <span key={idx} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-sm font-bold shadow-sm cursor-default">
                  {skillName}
                </span>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 italic">No skills added yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Experience Tab ─────────────────────────────────────────────────── */
export const ExperienceTab = () => {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-6 sm:p-8 shadow-sm group relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-500" /> Experience
        </h2>
        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100">
          <Plus size={14} /> Add Experience
        </button>
      </div>

      <div className="text-center p-8 border border-dashed border-gray-200 rounded-2xl">
        <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm font-medium">No experience added yet.</p>
        <p className="text-gray-400 text-xs mt-1">Showcase your internships, open source contributions, or part-time roles.</p>
      </div>
    </div>
  );
};

/* ── Projects Tab ───────────────────────────────────────────────────── */
export const ProjectsTab = ({ projects, setProjects, editingSection, setEditingSection, handleSaveSection, saving }) => {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-6 sm:p-8 shadow-sm group relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-indigo-500" /> Projects
        </h2>
        
        {editingSection === 'projects' ? (
          <div className="flex gap-2">
            <button onClick={() => setEditingSection(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition">Cancel</button>
            <button onClick={() => handleSaveSection('projects')} disabled={saving} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setEditingSection('projects')} 
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Plus size={14} /> Add Project
          </button>
        )}
      </div>

      {editingSection === 'projects' ? (
        <div className="space-y-4">
          {projects.map((proj, idx) => (
            <div key={idx} className="p-5 bg-gray-50 border border-gray-200 rounded-2xl relative">
              <button onClick={() => setProjects(projects.filter((_, i) => i !== idx))} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><X className="w-4 h-4" /></button>
              <div className="grid gap-4 max-w-lg">
                <input type="text" value={proj.title} onChange={e => { const p = [...projects]; p[idx] = { ...p[idx], title: e.target.value }; setProjects(p); }} placeholder="Project Title" className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl font-bold" />
                <textarea value={proj.description} onChange={e => { const p = [...projects]; p[idx] = { ...p[idx], description: e.target.value }; setProjects(p); }} placeholder="Description" className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl h-20 resize-none" />
                <input type="url" value={proj.link} onChange={e => { const p = [...projects]; p[idx] = { ...p[idx], link: e.target.value }; setProjects(p); }} placeholder="https://github.com/..." className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl" />
              </div>
            </div>
          ))}
          <button onClick={() => setProjects([...projects, { title: '', description: '', link: '' }])} className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-600 text-sm font-bold hover:bg-indigo-50 transition flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add New Project
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {projects.length > 0 ? (
            projects.map((proj, idx) => (
              <div key={idx} className="group/card relative rounded-2xl bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                <div className="h-32 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                  <LayoutDashboard className="w-12 h-12 text-gray-300 group-hover/card:scale-110 group-hover/card:text-gray-400 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Featured</div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h4 className="font-bold text-gray-900 text-lg mb-2">{proj.title || 'Untitled Project'}</h4>
                  <p className="text-gray-500 text-sm flex-1 mb-4 line-clamp-3">{proj.description}</p>
                  
                  {proj.link && (
                    <a href={proj.link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-bold transition-colors w-full mt-auto">
                      View Project <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="sm:col-span-2 text-center p-8 border border-dashed border-gray-200 rounded-2xl text-gray-500 text-sm font-medium">
              No projects added yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Education Tab ──────────────────────────────────────────────────── */
export const EducationTab = ({ form, setForm, editingSection, setEditingSection, handleSaveSection, saving }) => {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-6 sm:p-8 shadow-sm group relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-500" /> Education
        </h2>
        
        {editingSection === 'education' ? (
          <div className="flex gap-2">
            <button onClick={() => setEditingSection(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition">Cancel</button>
            <button onClick={() => handleSaveSection('education')} disabled={saving} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setEditingSection('education')} 
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Edit3 size={14} /> Edit Education
          </button>
        )}
      </div>

      {editingSection === 'education' ? (
        <div className="space-y-4 max-w-xl">
          <input type="text" value={form.college} onChange={e => setForm({...form, college: e.target.value})} placeholder="College Name" className="w-full px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl" />
          <input type="text" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} placeholder="Degree / Branch" className="w-full px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl" />
          <select value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-full px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl">
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
            <option value="Graduated">Graduated</option>
          </select>
        </div>
      ) : (
        <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">{form.college || 'Add your college'}</h4>
            <p className="text-gray-600 text-sm">{form.branch || 'Add your degree/branch'}</p>
            <p className="text-gray-400 text-xs mt-1">{form.year ? `Class of ${form.year}` : ''}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Certificates Tab ───────────────────────────────────────────────── */
export const CertificatesTab = () => {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-6 sm:p-8 shadow-sm group relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-500" /> Certificates
        </h2>
        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100">
          <Plus size={14} /> Add Certificate
        </button>
      </div>

      <div className="text-center p-8 border border-dashed border-gray-200 rounded-2xl">
        <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm font-medium">No certificates added yet.</p>
      </div>
    </div>
  );
};

/* ── Achievements Tab ───────────────────────────────────────────────── */
export const AchievementsTab = () => {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-6 sm:p-8 shadow-sm group relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Achievements
        </h2>
        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100">
          <Plus size={14} /> Add Achievement
        </button>
      </div>

      <div className="text-center p-8 border border-dashed border-gray-200 rounded-2xl">
        <Trophy className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm font-medium">No achievements added yet.</p>
        <p className="text-gray-400 text-xs mt-1">Add your hackathon wins, awards, or test scores.</p>
      </div>
    </div>
  );
};
