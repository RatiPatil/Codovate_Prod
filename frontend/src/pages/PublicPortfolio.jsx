import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { Mail, Github, Linkedin, ExternalLink, MapPin, Briefcase, GraduationCap, Award, CheckCircle, Code, ChevronRight } from 'lucide-react';

const PublicPortfolio = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.get(`/portfolio/${username}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Portfolio not found.');
      } finally {
        setLoading(false);
      }
    };
    if (username) fetchPortfolio();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center text-white p-6 text-center">
        <h1 className="text-4xl font-black mb-4">404</h1>
        <p className="text-gray-400">{error || 'User not found'}</p>
        <a href="/" className="mt-6 text-purple-400 hover:text-purple-300 font-bold border border-purple-500/20 bg-purple-500/10 px-6 py-2 rounded-xl transition-all">Go Home</a>
      </div>
    );
  }

  const { name, headline, about, contact, skills, experience, education, certifications, projects, avatar } = data;

  return (
    <div className="min-h-screen bg-[#050510] text-white selection:bg-purple-500/30 font-sans pb-20">
      
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 px-6 max-w-5xl mx-auto flex flex-col items-center text-center">
        {avatar ? (
          <img src={avatar} alt={name} className="w-32 h-32 rounded-3xl object-cover mb-8 shadow-2xl shadow-purple-500/20 border border-white/10" />
        ) : (
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
            <span className="text-5xl font-black text-white">{name?.charAt(0)}</span>
          </div>
        )}
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">{name}</h1>
        <p className="text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-bold mb-8">
          {headline}
        </p>
        
        {/* Contact Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {contact?.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all">
              <Mail size={16} className="text-gray-400" />
              <span>Email Me</span>
            </a>
          )}
          {contact?.github && (
            <a href={contact.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all">
              <Github size={16} className="text-gray-400" />
              <span>GitHub</span>
            </a>
          )}
          {contact?.linkedin && (
            <a href={contact.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all">
              <Linkedin size={16} className="text-gray-400" />
              <span>LinkedIn</span>
            </a>
          )}
          {contact?.location && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium">
              <MapPin size={16} className="text-gray-400" />
              <span>{contact.location}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 space-y-24">
        
        {/* About */}
        {about && (
          <section className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl blur-xl"></div>
            <div className="relative bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl backdrop-blur-sm">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <CheckCircle size={20} />
                </span>
                About Me
              </h2>
              <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                {about}
              </p>
            </div>
          </section>
        )}

        {/* Skills Matrix */}
        {(skills?.technical?.length > 0 || skills?.soft?.length > 0) && (
          <section>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Code size={20} />
              </span>
              Skills & Expertise
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skills?.technical?.length > 0 && (
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                  <h3 className="text-sm uppercase tracking-widest font-black text-gray-400 mb-6">Technical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.technical.map((skill, i) => (
                      <span key={i} className="px-4 py-2 bg-blue-500/10 text-blue-300 rounded-lg text-sm font-bold border border-blue-500/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skills?.soft?.length > 0 && (
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                  <h3 className="text-sm uppercase tracking-widest font-black text-gray-400 mb-6">Soft Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.soft.map((skill, i) => (
                      <span key={i} className="px-4 py-2 bg-purple-500/10 text-purple-300 rounded-lg text-sm font-bold border border-purple-500/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects?.length > 0 && (
          <section>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Code size={20} />
              </span>
              Featured Projects
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {projects.map((proj) => (
                <div key={proj.id} className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all duration-300">
                  <div className="p-8 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black mb-3 group-hover:text-emerald-400 transition-colors">{proj.title}</h3>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                          {proj.description || proj.problemStatement}
                        </p>
                        
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-8">
                            {proj.technologies.slice(0, 5).map((tech, i) => (
                              <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-300">
                                {tech}
                              </span>
                            ))}
                            {proj.technologies.length > 5 && (
                              <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-500">
                                +{proj.technologies.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex gap-4">
                          {proj.githubUrl && (
                            <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                              <Github size={18} /> Code
                            </a>
                          )}
                          {proj.liveUrl && (
                            <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                              <ExternalLink size={18} /> Live Demo
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* Optional Thumbnail could go here if proj has images */}
                      {proj.images && proj.images.length > 0 && (
                        <div className="w-full md:w-1/3 aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shrink-0">
                          <img src={proj.images[0]} alt={proj.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience Timeline */}
        {experience?.length > 0 && (
          <section>
            <h2 className="text-2xl font-black mb-10 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Briefcase size={20} />
              </span>
              Experience
            </h2>
            <div className="space-y-12 pl-4 md:pl-8 border-l-2 border-white/10">
              {experience.map((exp, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] md:-left-[37px] top-1 w-10 h-10 bg-[#050510] border-2 border-orange-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  </div>
                  <div className="pl-6 md:pl-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-xl font-black">{exp.role}</h3>
                        <p className="text-orange-400 font-bold">{exp.company}</p>
                      </div>
                      <div className="text-gray-500 text-sm font-medium bg-white/5 px-3 py-1 rounded-full self-start">
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-gray-400 mt-4 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                    )}
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {exp.bullets.map((b, idx) => (
                          <li key={idx} className="flex gap-3 text-gray-400">
                            <ChevronRight size={18} className="text-orange-500 shrink-0 mt-0.5" />
                            <span>{b.replace(/^[•▸\-*]\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education & Certifications (Two Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Education */}
          {education?.length > 0 && (
            <section>
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <GraduationCap size={20} />
                </span>
                Education
              </h2>
              <div className="space-y-6">
                {education.map((edu, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <h3 className="font-black text-lg">{edu.degree}</h3>
                    <p className="text-pink-400 font-bold mb-2">{edu.field}</p>
                    <p className="text-gray-400 text-sm">{edu.institution}</p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{edu.startYear} - {edu.endYear}</span>
                      {edu.gpa && <span className="text-xs font-bold text-gray-300">GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications?.length > 0 && (
            <section>
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                  <Award size={20} />
                </span>
                Certifications
              </h2>
              <div className="space-y-6">
                {certifications.map((cert, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Award size={24} className="text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-white leading-tight mb-1">{cert.name}</h3>
                      <p className="text-sm text-yellow-400 font-bold mb-2">{cert.issuer}</p>
                      {cert.date && <p className="text-xs text-gray-500">{cert.date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      <footer className="mt-32 pb-8 text-center text-gray-600 text-sm">
        <p>Built with ❤️ on <a href="https://codovate.in" className="font-bold text-gray-400 hover:text-white transition-colors">Codovate</a></p>
      </footer>
    </div>
  );
};

export default PublicPortfolio;
