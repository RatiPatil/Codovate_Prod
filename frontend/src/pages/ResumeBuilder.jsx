import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/uiUtils';
import TemplateClassic from '../components/resume/templates/TemplateClassic';
import TemplateModern from '../components/resume/templates/TemplateModern';
import TemplateCreative from '../components/resume/templates/TemplateCreative';
import {
  FileText,
  User,
  Target,
  GraduationCap,
  Briefcase,
  Rocket,
  Wrench,
  Award,
  Sparkles,
  Save,
  Clock,
  Eye,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

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
  { id: 'personal',       label: 'Personal Info',   icon: User,          desc: 'Basic contact details' },
  { id: 'objective',      label: 'Target Role',     icon: Target,        desc: 'Job target & career goal' },
  { id: 'education',      label: 'Education',       icon: GraduationCap, desc: 'Degrees & academic info' },
  { id: 'experience',     label: 'Experience',      icon: Briefcase,     desc: 'Internships & work history' },
  { id: 'projects',       label: 'Projects',        icon: Rocket,        desc: 'Your key projects' },
  { id: 'skills',         label: 'Skills',          icon: Wrench,        desc: 'Technical & soft skills' },
  { id: 'certifications', label: 'Certifications',  icon: Award,         desc: 'Certificates & awards' },
  { id: 'generate',       label: 'AI Generate',     icon: Sparkles,      desc: 'Let AI build your resume' },
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

// ─── Light Theme Input Components ─────────────────────────────────────────────
const Label = ({ children, hint }) => (
  <label className="block mb-1.5">
    <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">{children}</span>
    {hint && <span className="ml-2 text-xs text-[#64748B] normal-case font-normal">{hint}</span>}
  </label>
);

const Input = ({ value, onChange, placeholder, type = 'text', className = '', hasError = false, disabled = false }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full bg-white border ${hasError ? 'border-red-500 focus:border-red-400 bg-red-50' : 'border-[#E2E8F0] focus:border-[#2563EB]'} rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-medium ${className}`}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] rounded-xl p-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-medium resize-y"
  />
);

const AddBtn = ({ onClick, label }) => (
  <button
    onClick={onClick}
    type="button"
    className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-[#CBD5E1] rounded-xl text-[#64748B] text-xs font-bold hover:border-[#7C3AED] hover:text-[#7C3AED] hover:bg-[#F3E8FF]/30 transition-all cursor-pointer"
  >
    + {label}
  </button>
);

const RemoveBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    type="button"
    className="w-7 h-7 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center text-sm font-bold transition-all shrink-0 cursor-pointer"
  >
    ×
  </button>
);

const SkillTag = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F3E8FF] border border-[#E9D5FF] rounded-lg text-[#7C3AED] text-xs font-bold">
    {label}
    {onRemove && (
      <button onClick={onRemove} type="button" className="text-[#7C3AED]/60 hover:text-red-500 transition-colors text-sm leading-none ml-0.5">×</button>
    )}
  </span>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4 ${className}`}>
    {children}
  </div>
);

const GlowBtn = ({ onClick, disabled, loading, children, className = '', color = 'blue' }) => {
  const styles = {
    blue: 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 text-white shadow-md shadow-blue-900/10',
    green: 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md shadow-green-900/10',
    purple: 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:opacity-95 text-white shadow-md shadow-purple-900/10',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all disabled:opacity-40 cursor-pointer ${styles[color] || styles.blue} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
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
            <span className="text-[#0F172A] text-xs font-bold">Education #{i + 1}</span>
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
            <span className="text-[#0F172A] text-xs font-bold">Experience #{i + 1}</span>
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={exp.current} onChange={e => update(exp.id, 'current', e.target.checked)} className="w-4 h-4 rounded accent-[#7C3AED]" />
                <span className="text-[#64748B] text-xs font-medium">Current</span>
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
            <span className="text-[#0F172A] text-xs font-bold">Project #{i + 1}</span>
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
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input
          value={inputs[category]}
          onChange={e => setInputs(p => ({ ...p, [category]: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(category))}
          placeholder={placeholder}
          className="flex-1 bg-white border border-[#E2E8F0] focus:border-[#2563EB] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8]"
        />
        <button
          onClick={() => addSkill(category)}
          type="button"
          className="px-4 py-2.5 bg-[#F3E8FF] border border-[#E9D5FF] hover:bg-[#7C3AED] hover:text-white rounded-xl text-[#7C3AED] text-xs font-bold transition-all cursor-pointer"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {(data.skills[category] || []).map(s => <SkillTag key={s} label={s} onRemove={() => removeSkill(category, s)} />)}
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {SUGGESTED[category].filter(s => !(data.skills[category] || []).includes(s)).slice(0, 8).map(s => (
          <button
            key={s}
            onClick={() => { onChange('skills', { ...data.skills, [category]: [...(data.skills[category] || []), s] }); }}
            type="button"
            className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:border-[#7C3AED] hover:text-[#7C3AED] rounded-lg text-[#64748B] text-[11px] font-medium transition-all cursor-pointer"
          >
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
            <span className="text-[#0F172A] text-xs font-bold">Certificate #{i + 1}</span>
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
    if (score >= 80) return 'text-[#16A34A]';
    if (score >= 60) return 'text-[#D97706]';
    return 'text-[#DC2626]';
  };

  return (
    <div className="space-y-6">
      {/* Readiness Check */}
      <Card>
        <h3 className="text-[#0F172A] font-bold text-sm mb-4">Resume Readiness Check</h3>
        <div className="space-y-2.5">
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
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                item.done ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]' : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]'
              }`}>
                {item.done ? '✓' : '○'}
              </div>
              <span className={`text-xs ${item.done ? 'text-[#0F172A] font-semibold' : 'text-[#64748B]'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Generate Banner */}
      <div className="bg-gradient-to-br from-[#EFF6FF] via-[#F3E8FF] to-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-6 text-center space-y-3 shadow-sm">
        <div className="text-4xl">✨</div>
        <h3 className="text-[#0F172A] font-extrabold text-lg">AI Resume Generator</h3>
        <p className="text-[#64748B] text-xs max-w-lg mx-auto leading-relaxed">
          Our AI will craft a professional summary, enhance your bullet points with action verbs, calculate your ATS score, and suggest improvements.
        </p>
        <div className="pt-2">
          <GlowBtn onClick={onGenerate} disabled={aiLoading} loading={aiLoading && 'Generating with AI...'} color="purple" className="text-sm px-8 py-3">
            🤖 Generate My Resume
          </GlowBtn>
        </div>
      </div>

      {/* AI Results */}
      {aiResult && (
        <div className="space-y-4">
          {/* ATS Score */}
          {aiResult.atsScore !== null && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#0F172A] font-bold text-sm">ATS Score</h3>
                <span className={`text-3xl font-extrabold ${scoreColor(aiResult.atsScore)}`}>{aiResult.atsScore}/100</span>
              </div>
              <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    aiResult.atsScore >= 80 ? 'bg-[#16A34A]' : aiResult.atsScore >= 60 ? 'bg-[#D97706]' : 'bg-[#DC2626]'
                  }`}
                  style={{ width: `${aiResult.atsScore}%` }}
                />
              </div>
              {aiResult.atsTips?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Tips to Improve</p>
                  {aiResult.atsTips.map((tip, i) => (
                    <p key={i} className="text-[#334155] text-xs flex items-start gap-2">
                      <span className="text-[#7C3AED] font-bold shrink-0">→</span>{tip}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Generated Summary */}
          {aiResult.summary && (
            <Card className="border-[#7C3AED]/30 bg-[#F3E8FF]/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-[#0F172A] font-bold text-sm">AI Generated Summary</h3>
                <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#7C3AED] border border-[#E9D5FF]">
                  {aiResult.powered_by === 'gemini-1.5-flash' ? 'Gemini AI' : 'Smart Template'}
                </span>
              </div>
              <p className="text-[#334155] text-xs leading-relaxed">{aiResult.summary}</p>
            </Card>
          )}

          {/* Suggested Skills */}
          {aiResult.suggestedSkills?.length > 0 && (
            <Card>
              <h3 className="text-[#0F172A] font-bold text-sm mb-3">💡 Suggested Skills to Add</h3>
              <div className="flex flex-wrap gap-2">
                {aiResult.suggestedSkills.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg text-[#D97706] text-xs font-bold">+ {s}</span>
                ))}
              </div>
            </Card>
          )}

          <div className="p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl text-[#16A34A] text-xs font-bold text-center">
            ✅ Resume generated! Toggle live preview to inspect your resume and download as PDF.
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN RESUME BUILDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const ResumeBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ ...defaultData, personalInfo: { ...defaultData.personalInfo, name: user?.name || '', email: user?.email || '' } });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [templateId, setTemplateId] = useState('classic');
  const [versions, setVersions] = useState([]);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionLoading, setVersionLoading] = useState(false);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await api.get('/resume/versions');
      setVersions(res.data || []);
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

        // 3. Merge projects
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

      <div className="min-h-screen bg-[#FAFBFF] p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 font-sans text-[#0F172A] print:hidden">
        
        {/* ── BREADCRUMB & HEADER ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="text-xs text-[#64748B] font-medium flex items-center gap-1.5">
            <span className="hover:text-[#0F172A] cursor-pointer transition-colors" onClick={() => navigate('/dashboard')}>Home</span>
            <span>&gt;</span>
            <span className="text-[#0F172A] font-semibold">Resume Builder</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                Resume Builder
              </h1>
              <p className="text-[#64748B] text-sm mt-1 font-medium">
                Create a professional resume and get hired faster.
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {saveMsg && <span className="text-xs font-bold text-[#16A34A] animate-pulse mr-1">{saveMsg}</span>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                <Save className="w-4 h-4 text-[#2563EB]" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>

              <button
                onClick={() => setShowVersionsModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F3E8FF] border border-[#E9D5FF] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>Versions</span>
              </button>

              <button
                onClick={() => setShowPreview(p => !p)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#2563EB] hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
              </button>

              <GlowBtn onClick={handlePrint} color="blue" className="flex items-center gap-1.5 text-xs px-5 py-2.5">
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </GlowBtn>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ────────────────────────────────────────────── */}
        <div className={`grid grid-cols-1 ${showPreview ? 'xl:grid-cols-12' : ''} gap-8 items-start`}>

          {/* LEFT COLUMN: EDITOR FORM */}
          <div className={`${showPreview ? 'xl:col-span-6' : 'w-full'} space-y-6`}>
            
            {/* STEP NAVIGATION BADGES */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {STEPS.map((s, i) => {
                  const IconComp = s.icon;
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
                  const isCurrent = i === step;

                  return (
                    <button
                      key={s.id}
                      onClick={() => setStep(i)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white shadow-md shadow-purple-900/20'
                          : completed
                          ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                          : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{s.label}</span>
                      {completed && !isCurrent && <span className="text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#2563EB] to-[#9333EA] h-full rounded-full transition-all duration-500"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* STEP HEADER BANNER */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] border border-[#E9D5FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                  {(() => {
                    const CurrentIcon = STEPS[step].icon;
                    return <CurrentIcon className="w-5 h-5" />;
                  })()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A]">{STEPS[step].label}</h2>
                  <p className="text-xs text-[#64748B]">{STEPS[step].desc}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-1 rounded-full border border-[#E9D5FF]">
                Step {step + 1} of {STEPS.length}
              </span>
            </div>

            {/* STEP CONTENT EDITOR */}
            <div>
              {STEP_COMPONENTS[step]}
            </div>

            {/* STEP NAVIGATION FOOTER */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all disabled:opacity-40 cursor-pointer"
              >
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

          {/* RIGHT COLUMN: LIVE PREVIEW & TEMPLATE CONTROLS */}
          {showPreview && (
            <div className="xl:col-span-6 space-y-4 sticky top-24">
              
              {/* PREVIEW HEADER CONTROLS */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#7C3AED]" />
                  <h3 className="text-sm font-bold text-[#0F172A]">Live Preview</h3>
                </div>

                {/* TEMPLATE SELECTOR PILLS */}
                <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
                  {[
                    { id: 'classic', label: 'Professional' },
                    { id: 'modern', label: 'Modern' },
                    { id: 'creative', label: 'Creative' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTemplateId(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        templateId === t.id
                          ? 'bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white shadow-sm'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {data.atsScore && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    data.atsScore >= 80 ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]' : 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                  }`}>
                    ATS: {data.atsScore}/100
                  </span>
                )}
              </div>

              {/* A4 PREVIEW CANVAS */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E2E8F0]" style={{ aspectRatio: '210/297', maxHeight: '78vh' }}>
                <div style={{ transform: 'scale(0.72)', transformOrigin: 'top left', width: '138.88%', height: '138.88%' }}>
                  {renderTemplate()}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* SAVED VERSIONS MODAL */}
      {showVersionsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-[#0F172A]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Saved Resume Versions</h3>
              <button onClick={() => setShowVersionsModal(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold text-lg">✕</button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={versionName}
                onChange={e => setVersionName(e.target.value)}
                placeholder="Version Name (e.g. Frontend Engineer)"
                className="flex-1 bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A]"
              />
              <button
                onClick={handleSaveVersion}
                disabled={versionLoading}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {versionLoading ? 'Saving...' : 'Save New'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {versions.length === 0 ? (
                <p className="text-xs text-[#64748B] text-center py-4">No saved versions yet.</p>
              ) : (
                versions.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-[#FAFBFF] border border-[#E2E8F0] rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{v.name || 'Untitled Version'}</p>
                      <p className="text-[10px] text-[#64748B]">{new Date(v.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleLoadVersion(v.id)} className="px-3 py-1 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer">Load</button>
                      <button onClick={() => handleDeleteVersion(v.id)} className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE RESUME (HIDDEN, SHOWS ON WINDOW.PRINT) */}
      <div className="hidden print:block" style={{ width: '210mm', minHeight: '297mm' }}>
        {renderTemplate()}
      </div>
    </>
  );
};

export default ResumeBuilder;
