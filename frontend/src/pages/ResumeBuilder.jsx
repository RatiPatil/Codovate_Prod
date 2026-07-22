import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/uiUtils';
import TemplateClassic from '../components/resume/templates/TemplateClassic';
import TemplateModern from '../components/resume/templates/TemplateModern';
import TemplateCreative from '../components/resume/templates/TemplateCreative';

// ─── Print Styles ─────────────────────────────────────────────────────────────
const PRINT_CSS = `
@media print {
  @page { margin: 0; size: A4 portrait; }
  html, body {
    width: 210mm;
    height: 297mm;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }
}
`;

// ─── Step Config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'personal',       label: 'Personal Info',   icon: '👤', desc: 'Basic contact details' },
  { id: 'objective',      label: 'Target Role',     icon: '🎯', desc: 'Job target & career goal' },
  { id: 'education',      label: 'Education',       icon: '🎓', desc: 'Degrees & academic info' },
  { id: 'experience',     label: 'Experience',      icon: '💼', desc: 'Internships & work history' },
  { id: 'projects',       label: 'Projects',        icon: '🚀', desc: 'Your key projects' },
  { id: 'skills',         label: 'Skills',          icon: '🛠️', desc: 'Technical & soft skills' },
  { id: 'certifications', label: 'Certifications',  icon: '📜', desc: 'Certificates & awards' },
  { id: 'generate',       label: 'AI Generate',     icon: '✨', desc: 'Let AI build your resume' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2);

const emptyEducation = () => ({ id: uid(), institution: '', degree: '', field: '', gpa: '', startYear: '', endYear: '', achievements: '' });
const emptyExperience = () => ({ id: uid(), company: '', role: '', startDate: '', endDate: '', current: false, location: '', description: '' });
const emptyProject = () => ({ id: uid(), title: '', techStack: '', link: '', description: '' });
const emptyCert = () => ({ id: uid(), name: '', issuer: '', date: '', link: '' });

const defaultData = {
  personalInfo: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
  targetRole: '',
  targetSummary: '',
  education: [emptyEducation()],
  experience: [emptyExperience()],
  projects: [emptyProject()],
  skills: { technical: [], soft: [], languages: [] },
  certifications: [emptyCert()],
  achievements: '',
  // AI Results
  aiSummary: '',
  enhancedExperience: [],
  enhancedProjects: [],
  suggestedSkills: [],
  atsScore: null,
  atsTips: [],
  powered_by: '',
};

// ─── Shared Input Components ──────────────────────────────────────────────────
const Label = ({ children, hint }) => (
  <label className="block mb-1.5">
    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{children}</span>
    {hint && <span className="ml-2 text-[9px] text-gray-600 normal-case">{hint}</span>}
  </label>
);

const Input = ({ value, onChange, placeholder, type = 'text', className = '', hasError = false }) => (
  <input
    type={type} value={value} onChange={onChange} placeholder={placeholder}
    className={`w-full input-glass ${hasError ? 'border-red-500 focus:border-red-400 bg-red-500/5' : ''} ${className}`}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    className="w-full input-glass resize-y"
  />
);

const AddBtn = ({ onClick, label }) => (
  <button onClick={onClick} type="button"
    className="flex items-center gap-2 px-4 py-2 border border-dashed border-white/15 rounded-xl text-gray-500 text-xs font-bold hover:border-[#2015FF]/50 hover:text-[#6060FF] transition-all">
    + {label}
  </button>
);

const RemoveBtn = ({ onClick }) => (
  <button onClick={onClick} type="button"
    className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center text-xs transition-all shrink-0">
    ×
  </button>
);

const SkillTag = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2015FF]/10 border border-[#2015FF]/20 rounded-lg text-[#6060FF] text-[11px] font-bold">
    {label}
    {onRemove && <button onClick={onRemove} className="text-[#6060FF]/50 hover:text-red-400 transition-colors text-xs leading-none">×</button>}
  </span>
);

const Card = ({ children, className = '' }) => (
  <div className={`glass-panel rounded-2xl p-5 space-y-4 ${className}`}>
    {children}
  </div>
);

const GlowBtn = ({ onClick, disabled, loading, children, className = '', color = 'blue' }) => {
  const styles = {
    blue: 'bg-[#2015FF] hover:bg-[#3525FF] shadow-[0_4px_20px_rgba(32,21,255,0.4)]',
    green: 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.4)]',
    purple: 'bg-purple-600 hover:bg-purple-500 shadow-[0_4px_20px_rgba(139,92,246,0.4)]',
  };
  return (
    <button onClick={onClick} disabled={disabled} type="button"
      className={`px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40 ${styles[color]} ${className}`}>
      {loading ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {typeof loading === 'string' ? loading : 'Loading...'}
        </span>
      ) : children}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1 — Personal Info
const PersonalStep = ({ data, onChange }) => {
  const set = (field, val) => onChange('personalInfo', { ...data.personalInfo, [field]: val });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><Label>Full Name</Label><Input value={data.personalInfo.name} onChange={e => set('name', e.target.value)} placeholder="Ratikant Patil" /></div>
        <div><Label>Phone</Label><Input value={data.personalInfo.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
      </div>
      <div><Label>Email</Label><Input type="email" value={data.personalInfo.email} onChange={e => set('email', e.target.value)} placeholder="ratikant@email.com" /></div>
      <div><Label>Location</Label><Input value={data.personalInfo.location} onChange={e => set('location', e.target.value)} placeholder="Pandharpur, Maharashtra" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><Label>LinkedIn URL</Label><Input value={data.personalInfo.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/..." /></div>
        <div><Label>GitHub URL</Label><Input value={data.personalInfo.github} onChange={e => set('github', e.target.value)} placeholder="github.com/..." /></div>
      </div>
      <div><Label>Portfolio / Website</Label><Input value={data.personalInfo.portfolio} onChange={e => set('portfolio', e.target.value)} placeholder="myportfolio.dev" /></div>
    </div>
  );
};

// Step 2 — Target Role
const ObjectiveStep = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <Label hint="e.g. Software Engineer, Full Stack Developer, Data Scientist">Target Job Role</Label>
      <Input value={data.targetRole} onChange={e => onChange('targetRole', e.target.value)} placeholder="Full Stack Developer" />
    </div>
    <div>
      <Label hint="Optional — AI will generate this for you">Any personal career statement?</Label>
      <Textarea value={data.targetSummary} onChange={e => onChange('targetSummary', e.target.value)}
        placeholder="Briefly describe your career goal or any key highlights you want in your summary (AI will enhance this)..." rows={4} />
    </div>
    <div>
      <Label hint="Optional — AI will use this to tailor your resume">Any specific job description or requirements?</Label>
      <Textarea value={data.achievements} onChange={e => onChange('achievements', e.target.value)}
        placeholder="Paste relevant job description or any key achievements not covered elsewhere..." rows={3} />
    </div>
  </div>
);

// Step 3 — Education
const EducationStep = ({ data, onChange }) => {
  const update = (id, field, val) => onChange('education', data.education.map(e => e.id === id ? { ...e, [field]: val } : e));
  const add = () => onChange('education', [...data.education, emptyEducation()]);
  const remove = (id) => onChange('education', data.education.filter(e => e.id !== id));

  return (
    <div className="space-y-4">
      {data.education.map((edu, i) => (
        <Card key={edu.id}>
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-black">Education #{i + 1}</span>
            {data.education.length > 1 && <RemoveBtn onClick={() => remove(edu.id)} />}
          </div>
          <div><Label>Institution / University</Label><Input value={edu.institution} onChange={e => update(edu.id, 'institution', e.target.value)} placeholder="SVERI College of Engineering" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Degree</Label><Input value={edu.degree} onChange={e => update(edu.id, 'degree', e.target.value)} placeholder="B.Tech / MCA / B.E." /></div>
            <div><Label>Field of Study</Label><Input value={edu.field} onChange={e => update(edu.id, 'field', e.target.value)} placeholder="Computer Science" /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><Label>Start Year</Label><Input value={edu.startYear} onChange={e => update(edu.id, 'startYear', e.target.value)} placeholder="2021" /></div>
            <div><Label>End Year</Label><Input value={edu.endYear} onChange={e => update(edu.id, 'endYear', e.target.value)} placeholder="2025 / Present" /></div>
            <div><Label>GPA / %</Label><Input value={edu.gpa} onChange={e => update(edu.id, 'gpa', e.target.value)} placeholder="8.5 / 85%" /></div>
          </div>
          <div><Label hint="Awards, clubs, relevant coursework">Key Achievements</Label><Textarea value={edu.achievements} onChange={e => update(edu.id, 'achievements', e.target.value)} placeholder="Distinction, Dept Topper, GATE qualified..." rows={2} /></div>
        </Card>
      ))}
      <AddBtn onClick={add} label="Add Another Education" />
    </div>
  );
};

// Step 4 — Experience
const ExperienceStep = ({ data, onChange }) => {
  const update = (id, field, val) => onChange('experience', data.experience.map(e => e.id === id ? { ...e, [field]: val } : e));
  const add = () => onChange('experience', [...data.experience, emptyExperience()]);
  const remove = (id) => onChange('experience', data.experience.filter(e => e.id !== id));

  return (
    <div className="space-y-4">
      {data.experience.map((exp, i) => (
        <Card key={exp.id}>
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-black">Experience #{i + 1}</span>
            {data.experience.length > 1 && <RemoveBtn onClick={() => remove(exp.id)} />}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Company / Organization</Label><Input value={exp.company} onChange={e => update(exp.id, 'company', e.target.value)} placeholder="TCS, Google, Startup Name" /></div>
            <div><Label>Your Role / Title</Label><Input value={exp.role} onChange={e => update(exp.id, 'role', e.target.value)} placeholder="SDE Intern, Backend Developer" /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><Label>Start Date</Label><Input value={exp.startDate} onChange={e => update(exp.id, 'startDate', e.target.value)} placeholder="Jun 2024" /></div>
            <div><Label>End Date</Label><Input value={exp.endDate} onChange={e => update(exp.id, 'endDate', e.target.value)} placeholder="Aug 2024" disabled={exp.current} /></div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={exp.current} onChange={e => update(exp.id, 'current', e.target.checked)} className="w-4 h-4 rounded accent-[#2015FF]" />
                <span className="text-gray-400 text-xs">Current</span>
              </label>
            </div>
          </div>
          <div><Label>Location</Label><Input value={exp.location} onChange={e => update(exp.id, 'location', e.target.value)} placeholder="Remote / Pune, India" /></div>
          <div>
            <Label hint="AI will convert this to powerful bullet points">What did you do? (describe in your own words)</Label>
            <Textarea value={exp.description} onChange={e => update(exp.id, 'description', e.target.value)}
              placeholder={`Built a REST API using Node.js\nImproved app performance by optimizing database queries\nWorked with React to build user dashboard`} rows={4} />
          </div>
        </Card>
      ))}
      <AddBtn onClick={add} label="Add Another Experience" />
    </div>
  );
};

// Step 5 — Projects
const ProjectsStep = ({ data, onChange }) => {
  const update = (id, field, val) => onChange('projects', data.projects.map(p => p.id === id ? { ...p, [field]: val } : p));
  const add = () => onChange('projects', [...data.projects, emptyProject()]);
  const remove = (id) => onChange('projects', data.projects.filter(p => p.id !== id));

  return (
    <div className="space-y-4">
      {data.projects.map((proj, i) => (
        <Card key={proj.id}>
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-black">Project #{i + 1}</span>
            {data.projects.length > 1 && <RemoveBtn onClick={() => remove(proj.id)} />}
          </div>
          <div><Label>Project Title</Label><Input value={proj.title} onChange={e => update(proj.id, 'title', e.target.value)} placeholder="AI Chatbot, E-Commerce Platform" /></div>
          <div><Label hint="e.g. React, Node.js, Python, MongoDB">Tech Stack Used</Label><Input value={proj.techStack} onChange={e => update(proj.id, 'techStack', e.target.value)} placeholder="React, Node.js, Firebase, TailwindCSS" /></div>
          <div><Label>GitHub / Live Link</Label><Input value={proj.link} onChange={e => update(proj.id, 'link', e.target.value)} placeholder="github.com/user/project" /></div>
          <div>
            <Label hint="AI will enhance these into professional bullet points">What does this project do?</Label>
            <Textarea value={proj.description} onChange={e => update(proj.id, 'description', e.target.value)}
              placeholder={`An AI-powered chatbot that answers student queries\nIntegrated with Gemini API for real-time responses\nUsed by 200+ students at SVERI college`} rows={4} />
          </div>
        </Card>
      ))}
      <AddBtn onClick={add} label="Add Another Project" />
    </div>
  );
};

// Step 6 — Skills
const SkillsStep = ({ data, onChange }) => {
  const [inputs, setInputs] = useState({ technical: '', soft: '', languages: '' });
  const addSkill = (category) => {
    const val = inputs[category].trim();
    if (!val) return;
    const cur = data.skills[category] || [];
    if (!cur.includes(val)) {
      onChange('skills', { ...data.skills, [category]: [...cur, val] });
    }
    setInputs(p => ({ ...p, [category]: '' }));
  };
  const removeSkill = (category, skill) => {
    onChange('skills', { ...data.skills, [category]: data.skills[category].filter(s => s !== skill) });
  };

  const SUGGESTED = {
    technical: ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'SQL', 'MongoDB', 'Docker', 'AWS', 'Git', 'REST APIs', 'GraphQL', 'Machine Learning'],
    soft: ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Adaptability', 'Critical Thinking'],
    languages: ['English', 'Hindi', 'Marathi', 'Telugu', 'Tamil', 'Kannada'],
  };

  const SkillCategory = ({ label, category, placeholder }) => (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 mb-3">
        <input
          value={inputs[category]}
          onChange={e => setInputs(p => ({ ...p, [category]: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(category))}
          placeholder={placeholder}
          className="flex-1 input-glass"
        />
        <button onClick={() => addSkill(category)} type="button"
          className="px-4 py-2 bg-[#2015FF]/20 border border-[#2015FF]/30 rounded-xl text-[#6060FF] text-xs font-black hover:bg-[#2015FF] hover:text-white transition-all">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {(data.skills[category] || []).map(s => <SkillTag key={s} label={s} onRemove={() => removeSkill(category, s)} />)}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED[category].filter(s => !(data.skills[category] || []).includes(s)).slice(0, 8).map(s => (
          <button key={s} onClick={() => { onChange('skills', { ...data.skills, [category]: [...(data.skills[category] || []), s] }); }} type="button"
            className="px-2.5 py-1 bg-white/3 border border-white/8 rounded-lg text-gray-500 text-[10px] hover:text-white hover:border-white/20 transition-all">
            + {s}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card><SkillCategory label="Technical Skills" category="technical" placeholder="Python, React, Docker... (press Enter)" /></Card>
      <Card><SkillCategory label="Soft Skills" category="soft" placeholder="Leadership, Teamwork... (press Enter)" /></Card>
      <Card><SkillCategory label="Languages" category="languages" placeholder="English, Hindi... (press Enter)" /></Card>
    </div>
  );
};

// Step 7 — Certifications
const CertificationsStep = ({ data, onChange }) => {
  const update = (id, field, val) => onChange('certifications', data.certifications.map(c => c.id === id ? { ...c, [field]: val } : c));
  const add = () => onChange('certifications', [...data.certifications, emptyCert()]);
  const remove = (id) => onChange('certifications', data.certifications.filter(c => c.id !== id));

  return (
    <div className="space-y-4">
      {data.certifications.map((cert, i) => (
        <Card key={cert.id}>
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-black">Certificate #{i + 1}</span>
            {data.certifications.length > 1 && <RemoveBtn onClick={() => remove(cert.id)} />}
          </div>
          <div><Label>Certificate Name</Label><Input value={cert.name} onChange={e => update(cert.id, 'name', e.target.value)} placeholder="AWS Cloud Practitioner" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Issued By</Label><Input value={cert.issuer} onChange={e => update(cert.id, 'issuer', e.target.value)} placeholder="Amazon, Coursera, NPTEL" /></div>
            <div><Label>Date</Label><Input value={cert.date} onChange={e => update(cert.id, 'date', e.target.value)} placeholder="Mar 2024" /></div>
          </div>
          <div><Label>Certificate Link</Label><Input value={cert.link} onChange={e => update(cert.id, 'link', e.target.value)} placeholder="https://..." /></div>
        </Card>
      ))}
      <AddBtn onClick={add} label="Add Another Certificate" />
    </div>
  );
};

// Step 8 — AI Generate
const GenerateStep = ({ data, onGenerate, aiLoading, aiResult }) => {
  const scoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };


  return (
    <div className="space-y-6">
      {/* Readiness Check */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-white font-black text-sm mb-4">Resume Readiness Check</h3>
        <div className="space-y-2">
          {[
            { label: 'Personal Information', done: !!(data.personalInfo.name && data.personalInfo.email) },
            { label: 'Target Role Specified', done: !!data.targetRole },
            { label: 'Education Added', done: data.education.some(e => e.institution) },
            { label: 'Experience Added', done: data.experience.some(e => e.company) },
            { label: 'Projects Added', done: data.projects.some(p => p.title) },
            { label: 'Skills Added', done: (data.skills.technical || []).length > 0 },
            { label: 'Certifications Added', done: data.certifications.some(c => c.name) },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${item.done ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-600 border border-white/10'}`}>
                {item.done ? '✓' : '○'}
              </div>
              <span className={`text-xs ${item.done ? 'text-white font-semibold' : 'text-gray-500'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="bg-gradient-to-br from-[#2015FF]/15 to-purple-600/10 border border-[#2015FF]/20 rounded-2xl p-6 text-center">
        <div className="text-5xl mb-4">✨</div>
        <h3 className="text-white font-black text-lg mb-2">AI Resume Generator</h3>
        <p className="text-gray-400 text-sm mb-5">
          Our AI will craft a professional summary, enhance your bullet points with action verbs, calculate your ATS score, and suggest improvements.
        </p>
        <GlowBtn onClick={onGenerate} disabled={aiLoading} loading={aiLoading && 'Generating with AI...'} color="purple" className="text-base px-8 py-3">
          🤖 Generate My Resume
        </GlowBtn>
      </div>

      {/* AI Results */}
      {aiResult && (
        <div className="space-y-4">
          {/* ATS Score */}
          {aiResult.atsScore !== null && (
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-black text-sm">ATS Score</h3>
                <span className={`text-3xl font-black ${scoreColor(aiResult.atsScore)}`}>{aiResult.atsScore}/100</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                <div className={`h-full rounded-full transition-all duration-1000 ${aiResult.atsScore >= 80 ? 'bg-green-500' : aiResult.atsScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${aiResult.atsScore}%` }} />
              </div>
              {aiResult.atsTips?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Tips to Improve</p>
                  {aiResult.atsTips.map((tip, i) => (
                    <p key={i} className="text-gray-400 text-xs flex items-start gap-2">
                      <span className="text-[#6060FF] shrink-0">→</span>{tip}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generated Summary */}
          {aiResult.summary && (
            <div className="glass-panel border-primary/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#6060FF] text-sm">✨</span>
                <h3 className="text-white font-black text-sm">AI Generated Summary</h3>
                <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {aiResult.powered_by === 'gemini-1.5-flash' ? 'Gemini AI' : 'Smart Template'}
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{aiResult.summary}</p>
            </div>
          )}

          {/* Suggested Skills */}
          {aiResult.suggestedSkills?.length > 0 && (
            <div className="glass-panel rounded-2xl p-5">
              <h3 className="text-white font-black text-sm mb-3">💡 Suggested Skills to Add</h3>
              <div className="flex flex-wrap gap-2">
                {aiResult.suggestedSkills.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs font-bold">+ {s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-bold text-center">
            ✅ Resume generated! Scroll right to see the live preview → then download as PDF
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// A4 RESUME PREVIEW
// ═══════════════════════════════════════════════════════════════════════════════
const ResumePreview = ({ data }) => {
  const { personalInfo, education, experience, projects, skills, certifications, aiSummary, enhancedExperience, enhancedProjects, targetRole } = data;

  // Use AI enhanced versions if available
  const expToShow = enhancedExperience?.length > 0 ? enhancedExperience : experience;
  const projToShow = enhancedProjects?.length > 0 ? enhancedProjects : projects;

  const Section = ({ title, children }) => (
    <section className="mb-4">
      <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-900 border-b-[1.5px] border-gray-800 pb-0.5 mb-2">{title}</h2>
      {children}
    </section>
  );

  const Bullet = ({ text }) => (
    <li className="flex items-start gap-1.5 text-[9.5px] text-gray-700 mb-0.5">
      <span className="shrink-0 mt-[3px]">▸</span>
      <span>{text.replace(/^[•▸\-*]\s*/, '')}</span>
    </li>
  );

  return (
    <div className="bg-white text-black w-full h-full p-8 font-sans text-[9.5px] leading-snug overflow-hidden box-border">

      {/* Header */}
      <div className="text-center border-b-2 border-gray-900 pb-3 mb-4">
        <h1 className="text-[20px] font-black uppercase tracking-widest text-gray-900 leading-none mb-1">
          {personalInfo.name || 'YOUR NAME'}
        </h1>
        {targetRole && <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">{targetRole}</p>}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[8.5px] text-gray-600">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <><span className="text-gray-300">|</span><span>{personalInfo.phone}</span></>}
          {personalInfo.location && <><span className="text-gray-300">|</span><span>{personalInfo.location}</span></>}
          {personalInfo.linkedin && <><span className="text-gray-300">|</span><span>{personalInfo.linkedin.replace(/https?:\/\/(www\.)?/, '')}</span></>}
          {personalInfo.github && <><span className="text-gray-300">|</span><span>{personalInfo.github.replace(/https?:\/\/(www\.)?/, '')}</span></>}
          {personalInfo.portfolio && <><span className="text-gray-300">|</span><span>{personalInfo.portfolio.replace(/https?:\/\/(www\.)?/, '')}</span></>}
        </div>
      </div>

      {/* Summary */}
      {aiSummary && (
        <Section title="Professional Summary">
          <p className="text-gray-700 text-[9.5px] leading-relaxed">{aiSummary}</p>
        </Section>
      )}

      {/* Education */}
      {education.some(e => e.institution) && (
        <Section title="Education">
          {education.filter(e => e.institution).map(edu => (
            <div key={edu.id} className="mb-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-[10px] text-gray-900">{edu.institution}</p>
                  <p className="text-gray-700 text-[9px]">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}{edu.gpa ? ` — GPA/Score: ${edu.gpa}` : ''}</p>
                </div>
                <p className="text-gray-500 text-[9px] shrink-0">{edu.startYear}{edu.endYear ? ` – ${edu.endYear}` : ''}</p>
              </div>
              {edu.achievements && <p className="text-gray-600 text-[9px] mt-0.5">{edu.achievements}</p>}
            </div>
          ))}
        </Section>
      )}

      {/* Experience */}
      {expToShow.some(e => e.company) && (
        <Section title="Experience">
          {expToShow.filter(e => e.company).map(exp => (
            <div key={exp.id} className="mb-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-[10px] text-gray-900">{exp.role} — <span className="font-bold">{exp.company}</span></p>
                  {exp.location && <p className="text-gray-500 text-[8.5px]">{exp.location}</p>}
                </div>
                <p className="text-gray-500 text-[9px] shrink-0">{exp.startDate}{exp.current ? ' – Present' : exp.endDate ? ` – ${exp.endDate}` : ''}</p>
              </div>
              {(exp.bullets || []).length > 0 ? (
                <ul className="mt-1">{exp.bullets.map((b, i) => <Bullet key={i} text={b} />)}</ul>
              ) : exp.description ? (
                <ul className="mt-1">{exp.description.split('\n').filter(l => l.trim()).map((l, i) => <Bullet key={i} text={l} />)}</ul>
              ) : null}
            </div>
          ))}
        </Section>
      )}

      {/* Projects */}
      {projToShow.some(p => p.title) && (
        <Section title="Projects">
          {projToShow.filter(p => p.title).map(proj => (
            <div key={proj.id} className="mb-2.5">
              <div className="flex items-start justify-between">
                <p className="font-black text-[10px] text-gray-900">
                  {proj.title}
                  {proj.techStack && <span className="font-normal text-gray-600"> | {proj.techStack}</span>}
                </p>
                {proj.link && <span className="text-gray-500 text-[8.5px] shrink-0">{proj.link.replace(/https?:\/\/(www\.)?/, '')}</span>}
              </div>
              {(proj.bullets || []).length > 0 ? (
                <ul className="mt-0.5">{proj.bullets.map((b, i) => <Bullet key={i} text={b} />)}</ul>
              ) : proj.description ? (
                <ul className="mt-0.5">{proj.description.split('\n').filter(l => l.trim()).map((l, i) => <Bullet key={i} text={l} />)}</ul>
              ) : null}
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {(skills.technical?.length > 0 || skills.soft?.length > 0) && (
        <Section title="Skills">
          <div className="space-y-0.5">
            {skills.technical?.length > 0 && (
              <p className="text-[9.5px] text-gray-700"><strong className="text-gray-900">Technical:</strong> {skills.technical.join(' • ')}</p>
            )}
            {skills.soft?.length > 0 && (
              <p className="text-[9.5px] text-gray-700"><strong className="text-gray-900">Soft Skills:</strong> {skills.soft.join(' • ')}</p>
            )}
            {skills.languages?.length > 0 && (
              <p className="text-[9.5px] text-gray-700"><strong className="text-gray-900">Languages:</strong> {skills.languages.join(' • ')}</p>
            )}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {certifications.some(c => c.name) && (
        <Section title="Certifications">
          {certifications.filter(c => c.name).map(cert => (
            <div key={cert.id} className="flex items-center justify-between mb-0.5">
              <p className="text-[9.5px] text-gray-700">
                <strong className="text-gray-900">{cert.name}</strong>
                {cert.issuer ? ` — ${cert.issuer}` : ''}
              </p>
              {cert.date && <span className="text-gray-500 text-[8.5px] shrink-0">{cert.date}</span>}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN RESUME BUILDER
// ═══════════════════════════════════════════════════════════════════════════════
const ResumeBuilder = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ ...defaultData, personalInfo: { ...defaultData.personalInfo, name: user?.name || '', email: user?.email || '' } });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [templateId, setTemplateId] = useState('classic');
  const [versions, setVersions] = useState([]);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionLoading, setVersionLoading] = useState(false);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await api.get('/resume/versions');
      setVersions(res.data);
    } catch (err) {
      console.error('Failed to load versions');
    }
  }, []);

  useEffect(() => {
    if (showVersionsModal) fetchVersions();
  }, [showVersionsModal, fetchVersions]);

  const handleSaveVersion = async () => {
    if (!versionName.trim()) return showAlert('Please enter a version name');
    setVersionLoading(true);
    try {
      await api.post('/resume/versions', { name: versionName, data: { ...data, templateId } });
      setVersionName('');
      fetchVersions();
      showAlert('Version saved!');
    } catch (err) {
      showAlert('Failed to save version');
    } finally {
      setVersionLoading(false);
    }
  };

  const handleLoadVersion = async (id) => {
    try {
      const res = await api.get(`/resume/versions/${id}`);
      if (res.data && res.data.data) {
        setData(res.data.data);
        if (res.data.data.templateId) setTemplateId(res.data.data.templateId);
        setShowVersionsModal(false);
        showAlert('Version loaded!');
      }
    } catch (err) {
      showAlert('Failed to load version');
    }
  };

  const handleDeleteVersion = async (id) => {
    if (!window.confirm('Delete this version?')) return;
    try {
      await api.delete(`/resume/versions/${id}`);
      fetchVersions();
    } catch (err) {
      showAlert('Failed to delete version');
    }
  };

  const renderTemplate = () => {
    const props = { data };
    switch (templateId) {
      case 'modern': return <TemplateModern {...props} />;
      case 'creative': return <TemplateCreative {...props} />;
      case 'classic':
      default: return <TemplateClassic {...props} />;
    }
  };



  // Load saved resume, profile, and projects
  useEffect(() => {
    Promise.all([
      api.get('/resume').catch(() => ({ data: null })),
      api.get('/students/profile').catch(() => ({ data: {} })),
      api.get('/projects/my').catch(() => ({ data: [] }))
    ]).then(([resResume, resProfile, resProjects]) => {
      const saved = resResume.data;
      const p = resProfile.data || {};
      const projs = resProjects.data || [];

      setData(prev => {
        const nextData = { ...prev };
        
        // 1. Merge saved resume
        if (saved) {
          Object.assign(nextData, saved);
          if (saved.aiSummary) setAiResult({ summary: saved.aiSummary, atsScore: saved.atsScore, atsTips: saved.atsTips || [], suggestedSkills: saved.suggestedSkills || [], powered_by: saved.powered_by || '' });
        }

        // 2. Merge profile
        nextData.personalInfo = {
          ...nextData.personalInfo,
          name: p.name || nextData.personalInfo.name,
          email: p.email || nextData.personalInfo.email,
          phone: p.phone || nextData.personalInfo.phone || '',
          github: p.github_url || nextData.personalInfo.github || '',
          linkedin: p.linkedin_url || nextData.personalInfo.linkedin || '',
          portfolio: p.portfolio_url || nextData.personalInfo.portfolio || '',
        };
        nextData.skills = {
          ...nextData.skills,
          technical: p.skills?.length > 0 ? p.skills : (nextData.skills?.technical || []),
        };
        if (p.college && (!nextData.education || !nextData.education[0]?.institution)) {
          nextData.education = [{ ...emptyEducation(), institution: p.college, field: p.branch || '', endYear: p.year || '' }];
        }

        // 3. Merge projects (if not already populated manually by user in saved resume)
        if (!saved?.projects || saved.projects.length === 0 || !saved.projects[0].title) {
          if (projs.length > 0) {
            nextData.projects = projs.map(proj => ({
              id: proj.id || uid(),
              title: proj.title || '',
              techStack: (proj.techStack || []).join(', '),
              link: proj.liveUrl || proj.githubUrl || '',
              description: proj.description || ''
            }));
          } else {
            nextData.projects = [emptyProject()];
          }
        }

        return nextData;
      });
    });
  }, []);

  const onChange = useCallback((key, val) => {
    setData(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleGenerate = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.post('/resume/generate', {
        personalInfo: data.personalInfo,
        education: data.education,
        experience: data.experience,
        projects: data.projects,
        skills: [...(data.skills.technical || []), ...(data.skills.soft || [])],
        certifications: data.certifications,
        achievements: data.achievements,
        targetRole: data.targetRole,
      });

      const result = res.data;
      setAiResult(result);

      // Merge AI results into data
      setData(prev => ({
        ...prev,
        aiSummary: result.summary || '',
        enhancedExperience: result.enhancedExperience || [],
        enhancedProjects: result.enhancedProjects || [],
        suggestedSkills: result.suggestedSkills || [],
        atsScore: result.atsScore,
        atsTips: result.atsTips || [],
        powered_by: result.powered_by,
      }));

      setShowPreview(true);
    } catch (err) {
      showAlert(err.response?.data?.message || 'AI generation failed. Check server logs.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/resume/save', data);
      setSaveMsg('✅ Saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('❌ Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  const STEP_COMPONENTS = [
    <PersonalStep key="personal" data={data} onChange={onChange} />,
    <ObjectiveStep key="objective" data={data} onChange={onChange} />,
    <EducationStep key="education" data={data} onChange={onChange} />,
    <ExperienceStep key="experience" data={data} onChange={onChange} />,
    <ProjectsStep key="projects" data={data} onChange={onChange} />,
    <SkillsStep key="skills" data={data} onChange={onChange} />,
    <CertificationsStep key="certifications" data={data} onChange={onChange} />,
    <GenerateStep key="generate" data={data} onGenerate={handleGenerate} aiLoading={aiLoading} aiResult={aiResult} />,
  ];

  return (
    <>
      <style>{PRINT_CSS}</style>

      <div className="min-h-screen text-white relative z-10 print:hidden">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#050510]/90 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-none">AI Resume Builder</h1>
                <p className="text-gray-500 text-[10px] mt-0.5">Powered by Gemini AI • ATS Optimized</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {saveMsg && <span className="text-xs font-bold text-green-400 animate-pulse">{saveMsg}</span>}
              <button onClick={handleSave} disabled={saving}
                className="px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40">
                {saving ? '💾 ...' : '💾 Save'}
              </button>
              <button onClick={() => setShowVersionsModal(true)}
                className="px-3 sm:px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs font-bold text-purple-400 hover:bg-purple-500 hover:text-white transition-all">
                🕒 Versions
              </button>
              <button onClick={() => setShowPreview(p => !p)}
                className="px-3 sm:px-4 py-2 bg-[#2015FF]/10 border border-[#2015FF]/20 rounded-xl text-xs font-bold text-[#6060FF] hover:bg-[#2015FF] hover:text-white transition-all">
                {showPreview ? '← Hide' : '👁️ Preview'}
              </button>
              <GlowBtn onClick={handlePrint} color="green" className="text-xs px-3 sm:px-4 py-2">
                📥 PDF
              </GlowBtn>
            </div>
          </div>
        </div>

        <div className={`max-w-[1600px] mx-auto p-4 sm:p-6 ${showPreview ? 'grid grid-cols-1 xl:grid-cols-2 gap-6 items-start' : ''}`}>

          {/* Left: Form */}
          <div>
            {/* Step Progress */}
            <div className="mb-6">
              <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
                {STEPS.map((s, i) => {
                  const checkStepComplete = (idx) => {
                    switch(idx) {
                      case 0: return !!(data.personalInfo.name && data.personalInfo.email && data.personalInfo.phone);
                      case 1: return !!data.targetRole;
                      case 2: return data.education.some(e => e.institution);
                      case 3: return data.experience.some(e => e.company);
                      case 4: return data.projects.some(p => p.title);
                      case 5: return (data.skills.technical || []).length > 0;
                      case 6: return data.certifications.some(c => c.name);
                      case 7: return !!data.aiSummary;
                      default: return false;
                    }
                  };
                  const completed = checkStepComplete(i);
                  return (
                  <button key={s.id} onClick={() => setStep(i)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black shrink-0 transition-all ${
                      i === step
                        ? 'bg-[#2015FF] text-white shadow-[0_4px_12px_rgba(32,21,255,0.4)]'
                        : completed
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-white/3 text-gray-500 border border-white/5 hover:border-white/10 hover:text-gray-300'
                    }`}>
                    <span>{completed && i !== step ? '✓' : s.icon}</span>
                    <span className="hidden sm:block">{s.label}</span>
                    {i === 7 && data.aiSummary && <span className="ml-1 text-[8px] px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded">AI ✓</span>}
                  </button>
                  );
                })}
              </div>
              <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#2015FF] rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
              </div>
            </div>

            {/* Step Header */}
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2015FF]/15 border border-[#2015FF]/20 flex items-center justify-center text-xl">
                  {STEPS[step].icon}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{STEPS[step].label}</h2>
                  <p className="text-gray-500 text-xs">{STEPS[step].desc}</p>
                </div>
                <span className="ml-auto text-[10px] text-gray-600 font-bold">Step {step + 1} of {STEPS.length}</span>
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-6">
              {STEP_COMPONENTS[step]}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all disabled:opacity-30">
                ← Previous
              </button>
              <div className="flex gap-3">
                {step < STEPS.length - 1 ? (
                  <GlowBtn onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} color="blue">
                    Next Step →
                  </GlowBtn>
                ) : (
                  <GlowBtn onClick={handleGenerate} disabled={aiLoading} loading={aiLoading && 'Generating...'} color="purple">
                    ✨ Generate Resume
                  </GlowBtn>
                )}
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          {showPreview && (
            <div className="sticky top-24">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-white">Live Preview</h3>
                <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden ml-4">
                  {['classic', 'modern', 'creative'].map(t => (
                    <button key={t} onClick={() => setTemplateId(t)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${templateId === t ? 'bg-[#2015FF] text-white' : 'text-gray-400 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {data.atsScore && (
                  <span className={`text-sm font-black ${data.atsScore >= 80 ? 'text-green-400' : data.atsScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    ATS: {data.atsScore}/100
                  </span>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200" style={{ aspectRatio: '210/297', maxHeight: '80vh' }}>
                <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '142.86%', height: '142.86%' }}>
                  {renderTemplate()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Resume (hidden, only shows on print) */}
      <div className="hidden print:block" style={{ width: '210mm', minHeight: '297mm' }}>
        {renderTemplate()}
      </div>
    </>
  );
};

export default ResumeBuilder;
