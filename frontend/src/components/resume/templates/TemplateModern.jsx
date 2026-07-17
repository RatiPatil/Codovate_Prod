import React from 'react';

const Bullet = ({ text }) => (
  <li className="flex items-start gap-1.5 text-[9px] text-gray-700 mb-0.5">
    <span className="shrink-0 text-blue-500 mt-[2px]">•</span>
    <span>{text.replace(/^[•▸\-*]\s*/, '')}</span>
  </li>
);

const Section = ({ title, children, isSidebar = false }) => (
  <section className="mb-4">
    <h2 className={`text-[10px] font-black uppercase tracking-[0.1em] mb-2 border-b ${isSidebar ? 'text-white border-blue-400 pb-1' : 'text-blue-900 border-gray-200 pb-1'}`}>
      {title}
    </h2>
    {children}
  </section>
);

const TemplateModern = ({ data }) => {
  const { personalInfo = {}, education = [], experience = [], projects = [], skills = {}, certifications = [], aiSummary, enhancedExperience, enhancedProjects, targetRole } = data || {};

  const expToShow = enhancedExperience?.length > 0 ? enhancedExperience : experience;
  const projToShow = enhancedProjects?.length > 0 ? enhancedProjects : projects;

  return (
    <div className="bg-white text-black w-full h-full font-sans text-[9px] leading-snug overflow-hidden box-border flex">
      {/* Sidebar */}
      <div className="w-[35%] bg-[#1e293b] text-white p-6 flex flex-col min-h-full">
        <div className="mb-6">
          <h1 className="text-[18px] font-black uppercase tracking-wider text-white leading-tight mb-1">
            {personalInfo.name || 'YOUR NAME'}
          </h1>
          {targetRole && <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3">{targetRole}</p>}
          
          <div className="space-y-1.5 text-[8.5px] text-gray-300">
            {personalInfo.email && <div className="flex items-center gap-2"><span>✉</span> {personalInfo.email}</div>}
            {personalInfo.phone && <div className="flex items-center gap-2"><span>☏</span> {personalInfo.phone}</div>}
            {personalInfo.location && <div className="flex items-center gap-2"><span>📍</span> {personalInfo.location}</div>}
            {personalInfo.linkedin && <div className="flex items-center gap-2"><span>in</span> {personalInfo.linkedin.replace(/https?:\/\/(www\.)?/, '')}</div>}
            {personalInfo.github && <div className="flex items-center gap-2"><span>gh</span> {personalInfo.github.replace(/https?:\/\/(www\.)?/, '')}</div>}
            {personalInfo.portfolio && <div className="flex items-center gap-2"><span>🌐</span> {personalInfo.portfolio.replace(/https?:\/\/(www\.)?/, '')}</div>}
          </div>
        </div>

        {/* Education (Sidebar) */}
        {education.some(e => e.institution) && (
          <Section title="Education" isSidebar>
            {education.filter(e => e.institution).map(edu => (
              <div key={edu.id} className="mb-2.5">
                <p className="font-bold text-[9.5px] text-white">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                <p className="text-[8.5px] text-blue-200">{edu.institution}</p>
                <p className="text-gray-400 text-[8px]">{edu.startYear}{edu.endYear ? ` – ${edu.endYear}` : ''}</p>
                {edu.gpa && <p className="text-[8.5px] text-gray-300 mt-0.5">GPA/Score: {edu.gpa}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* Skills (Sidebar) */}
        {(skills?.technical?.length > 0 || skills?.soft?.length > 0) && (
          <Section title="Skills" isSidebar>
            <div className="space-y-2 text-[8.5px]">
              {skills.technical?.length > 0 && (
                <div>
                  <p className="font-bold text-white mb-1">Technical</p>
                  <div className="flex flex-wrap gap-1">
                    {skills.technical.map(s => <span key={s} className="bg-blue-900/50 text-blue-100 px-1.5 py-0.5 rounded">{s}</span>)}
                  </div>
                </div>
              )}
              {skills.soft?.length > 0 && (
                <div>
                  <p className="font-bold text-white mb-1">Soft Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {skills.soft.map(s => <span key={s} className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>

      {/* Main Content */}
      <div className="w-[65%] p-6 bg-white">
        {/* Summary */}
        {aiSummary && (
          <Section title="Profile">
            <p className="text-gray-600 text-[9px] leading-relaxed text-justify">{aiSummary}</p>
          </Section>
        )}

        {/* Experience */}
        {expToShow?.some(e => e.company) && (
          <Section title="Experience">
            {expToShow.filter(e => e.company).map(exp => (
              <div key={exp.id} className="mb-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-black text-[10.5px] text-gray-800">{exp.role}</p>
                    <p className="text-[9.5px] font-bold text-blue-600">{exp.company} {exp.location && <span className="text-gray-400 font-normal">| {exp.location}</span>}</p>
                  </div>
                  <p className="text-gray-400 text-[8.5px] shrink-0 font-medium bg-gray-50 px-1.5 py-0.5 rounded">{exp.startDate}{exp.current ? ' – Present' : exp.endDate ? ` – ${exp.endDate}` : ''}</p>
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
              <div key={proj.id} className="mb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-black text-[10.5px] text-gray-800">
                      {proj.title}
                    </p>
                    {proj.techStack && <p className="text-[8.5px] text-blue-500 font-medium">{proj.techStack}</p>}
                  </div>
                  {proj.link && <span className="text-gray-400 text-[8.5px] shrink-0 font-medium bg-gray-50 px-1.5 py-0.5 rounded">{proj.link.replace(/https?:\/\/(www\.)?/, '')}</span>}
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

        {/* Certifications */}
        {certifications?.some(c => c.name) && (
          <Section title="Certifications">
            <div className="grid grid-cols-2 gap-2">
              {certifications.filter(c => c.name).map(cert => (
                <div key={cert.id} className="bg-gray-50 p-2 rounded border border-gray-100 border-l-2 border-l-blue-400">
                  <p className="text-[9px] font-bold text-gray-800 truncate">{cert.name}</p>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-[8px] text-gray-500">{cert.issuer}</span>
                    <span className="text-[8px] text-blue-400">{cert.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default TemplateModern;
