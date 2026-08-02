import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, Download, Layers, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

const ResumeSpotlight = () => {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <FileText size={14} />
              RESUME BUILDER
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 leading-tight">
              From Skills to a Resume You're Ready to Share.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Build and maintain your resume from your education, skills, projects, and experience — all inside Codovate.
            </p>

            {/* 4 Feature Points Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Easy Editing</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Instant step-by-step section inputs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <Layers size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Multiple Templates</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Classic, Modern, and Creative styles.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <Download size={18} className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">PDF Export</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Clean ATS-friendly PDF download.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <ShieldCheck size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Version History</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Save and switch between versions.</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Link
                to="/resume-builder"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all group"
              >
                Build Your Resume
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: Illustrative Resume Template Preview */}
          <div className="lg:col-span-6 relative">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-200/70 p-6 md:p-8 space-y-6">
              
              {/* Header inside resume */}
              <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ratikant Patil</h3>
                  <p className="text-sm font-semibold text-blue-600 mt-0.5">Frontend & Full Stack Software Engineer</p>
                  <p className="text-xs text-slate-500 mt-1">mumbai, maharashtra • student@codovate.in • github.com/student</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center">
                  <p className="text-[10px] text-emerald-600 font-semibold uppercase">ATS Score</p>
                  <p className="text-base font-black">85%</p>
                </div>
              </div>

              {/* Education section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Education</h4>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-slate-800">B.Tech in Computer Engineering</span>
                  <span className="text-slate-500 font-medium">2022 – 2026</span>
                </div>
                <p className="text-xs text-slate-600">COEP Technological University • CGPA: 8.8 / 10</p>
              </div>

              {/* Skills section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['React.js', 'JavaScript (ES6+)', 'Node.js', 'Express', 'Tailwind CSS', 'Git', 'REST APIs'].map(sk => (
                    <span key={sk} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200/50">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Projects Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projects</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Codovate Career Ecosystem</span>
                    <span className="text-slate-500 font-normal">React, Node.js, Firestore</span>
                  </div>
                  <p className="text-slate-600">Architected a real-time student team matching and application tracking portal.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ResumeSpotlight;
