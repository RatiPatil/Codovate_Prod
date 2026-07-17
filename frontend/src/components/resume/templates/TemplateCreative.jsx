import React from 'react';

const Bullet = ({ text }) => (
  <li className="flex items-start gap-1.5 text-[9px] text-gray-700 mb-0.5">
    <span className="shrink-0 text-[#8B5CF6] mt-[2px] font-black">»</span>
    <span>{text.replace(/^[•▸\-*]\s*/, '')}</span>
  </li>
);

const Section = ({ title, children }) => (
  <section className="mb-5">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-4 h-4 rounded bg-gradient-to-br from-[#8B5CF6] to-[#6366f1] shrink-0"></div>
      <h2 className="text-[12px] font-black tracking-widest uppercase text-gray-900">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
    </div>
    <div className="pl-6">
      {children}
    </div>
  </section>
);

const TemplateCreative = ({ data }) => {
  const { personalInfo = {}, education = [], experience = [], projects = [], skills = {}, certifications = [], aiSummary, enhancedExperience, enhancedProjects, targetRole } = data || {};

  const expToShow = enhancedExperience?.length > 0 ? enhancedExperience : experience;
  const projToShow = enhancedProjects?.length > 0 ? enhancedProjects : projects;

  return (
    <div className="bg-[#fcfcfc] text-black w-full h-full p-8 font-sans text-[9px] leading-snug overflow-hidden box-border">
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#8B5CF6] to-[#6366f1] rounded-2xl p-6 text-white mb-6 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-[24px] font-black uppercase tracking-wider leading-none mb-1">
            {personalInfo.name || 'YOUR NAME'}
          </h1>
          {targetRole && <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest mb-3">{targetRole}</p>}
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-medium text-white/90">
            {personalInfo.email && <span className="flex items-center gap-1"><span className="opacity-50">✉</span> {personalInfo.email}</span>}
            {personalInfo.phone && <span className="flex items-center gap-1"><span className="opacity-50">☏</span> {personalInfo.phone}</span>}
            {personalInfo.location && <span className="flex items-center gap-1"><span className="opacity-50">📍</span> {personalInfo.location}</span>}
            {personalInfo.linkedin && <span className="flex items-center gap-1"><span className="opacity-50">in</span> {personalInfo.linkedin.replace(/https?:\/\/(www\.)?/, '')}</span>}
            {personalInfo.github && <span className="flex items-center gap-1"><span className="opacity-50">gh</span> {personalInfo.github.replace(/https?:\/\/(www\.)?/, '')}</span>}
            {personalInfo.portfolio && <span className="flex items-center gap-1"><span className="opacity-50">🌐</span> {personalInfo.portfolio.replace(/https?:\/\/(www\.)?/, '')}</span>}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
      </div>

      <div className="flex gap-6">
        {/* Left Column */}
        <div className="w-[60%] space-y-2">
          {/* Summary */}
          {aiSummary && (
            <Section title="Profile">
              <p className="text-gray-600 text-[9px] leading-relaxed text-justify bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">{aiSummary}</p>
            </Section>
          )}

          {/* Experience */}
          {expToShow?.some(e => e.company) && (
            <Section title="Experience">
              {expToShow.filter(e => e.company).map(exp => (
                <div key={exp.id} className="mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-[11px] text-gray-800">{exp.role}</p>
                      <p className="text-[9px] font-bold text-[#8B5CF6]">{exp.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-[8.5px] font-bold bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full inline-block">{exp.startDate}{exp.current ? ' – Present' : exp.endDate ? ` – ${exp.endDate}` : ''}</p>
                      {exp.location && <p className="text-gray-400 text-[8px] mt-0.5">{exp.location}</p>}
                    </div>
                  </div>
                  {(exp.bullets || []).length > 0 ? (
                    <ul className="mt-1.5 space-y-0.5">{exp.bullets.map((b, i) => <Bullet key={i} text={b} />)}</ul>
                  ) : exp.description ? (
                    <ul className="mt-1.5 space-y-0.5">{exp.description.split('\n').filter(l => l.trim()).map((l, i) => <Bullet key={i} text={l} />)}</ul>
                  ) : null}
                </div>
              ))}
            </Section>
          )}

          {/* Projects */}
          {projToShow?.some(p => p.title) && (
            <Section title="Projects">
              {projToShow.filter(p => p.title).map(proj => (
                <div key={proj.id} className="mb-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-[10.5px] text-gray-800">
                        {proj.title}
                      </p>
                      {proj.techStack && <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{proj.techStack}</p>}
                    </div>
                    {proj.link && <span className="text-[#8B5CF6] text-[8px] font-bold">{proj.link.replace(/https?:\/\/(www\.)?/, '')}</span>}
                  </div>
                  {(proj.bullets || []).length > 0 ? (
                    <ul className="mt-1.5 space-y-0.5">{proj.bullets.map((b, i) => <Bullet key={i} text={b} />)}</ul>
                  ) : proj.description ? (
                    <ul className="mt-1.5 space-y-0.5">{proj.description.split('\n').filter(l => l.trim()).map((l, i) => <Bullet key={i} text={l} />)}</ul>
                  ) : null}
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* Right Column */}
        <div className="w-[40%] space-y-2">
          {/* Education */}
          {education.some(e => e.institution) && (
            <Section title="Education">
              {education.filter(e => e.institution).map(edu => (
                <div key={edu.id} className="mb-3 border-l-2 border-[#8B5CF6] pl-2.5">
                  <p className="font-black text-[10px] text-gray-800">{edu.degree}</p>
                  {edu.field && <p className="text-[9px] text-[#6366f1] font-bold">{edu.field}</p>}
                  <p className="text-[8.5px] text-gray-500 mt-0.5">{edu.institution}</p>
                  <p className="text-gray-400 text-[8px]">{edu.startYear}{edu.endYear ? ` – ${edu.endYear}` : ''}</p>
                  {edu.gpa && <p className="text-[8.5px] text-gray-600 mt-0.5 font-bold bg-gray-100 inline-block px-1 rounded">GPA/Score: {edu.gpa}</p>}
                </div>
              ))}
            </Section>
          )}

          {/* Skills */}
          {(skills?.technical?.length > 0 || skills?.soft?.length > 0) && (
            <Section title="Skills">
              <div className="space-y-3">
                {skills.technical?.length > 0 && (
                  <div>
                    <p className="text-[8px] uppercase tracking-widest font-black text-gray-400 mb-1.5">Technical</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.technical.map(s => <span key={s} className="bg-[#8B5CF6]/10 text-[#8B5CF6] px-2 py-0.5 rounded-full font-bold text-[8px]">{s}</span>)}
                    </div>
                  </div>
                )}
                {skills.soft?.length > 0 && (
                  <div>
                    <p className="text-[8px] uppercase tracking-widest font-black text-gray-400 mb-1.5">Soft Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.soft.map(s => <span key={s} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold text-[8px]">{s}</span>)}
                    </div>
                  </div>
                )}
                {skills.languages?.length > 0 && (
                  <div>
                    <p className="text-[8px] uppercase tracking-widest font-black text-gray-400 mb-1.5">Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.languages.map(s => <span key={s} className="text-gray-600 text-[8.5px]">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Certifications */}
          {certifications?.some(c => c.name) && (
            <Section title="Certifications">
              <div className="space-y-2">
                {certifications.filter(c => c.name).map(cert => (
                  <div key={cert.id} className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <p className="text-[9px] font-black text-gray-800">{cert.name}</p>
                    <p className="text-[8px] text-gray-500">{cert.issuer} {cert.date && `• ${cert.date}`}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateCreative;
