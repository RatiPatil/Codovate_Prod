import React from 'react';

const Bullet = ({ text }) => (
  <li className="flex items-start gap-1.5 text-[9.5px] text-gray-700 mb-0.5">
    <span className="shrink-0 mt-[3px]">▸</span>
    <span>{text.replace(/^[•▸\-*]\s*/, '')}</span>
  </li>
);

const Section = ({ title, children }) => (
  <section className="mb-4">
    <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-900 border-b-[1.5px] border-gray-800 pb-0.5 mb-2">{title}</h2>
    {children}
  </section>
);

const TemplateClassic = ({ data }) => {
  const { personalInfo = {}, education = [], experience = [], projects = [], skills = {}, certifications = [], aiSummary, enhancedExperience, enhancedProjects, targetRole } = data || {};

  const expToShow = enhancedExperience?.length > 0 ? enhancedExperience : experience;
  const projToShow = enhancedProjects?.length > 0 ? enhancedProjects : projects;

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
      {expToShow?.some(e => e.company) && (
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
      {projToShow?.some(p => p.title) && (
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
      {(skills?.technical?.length > 0 || skills?.soft?.length > 0) && (
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
      {certifications?.some(c => c.name) && (
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

export default TemplateClassic;
