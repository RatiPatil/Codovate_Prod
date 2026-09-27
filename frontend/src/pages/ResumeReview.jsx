import React, { useState, useRef } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, FileText, CheckCircle, AlertCircle, XCircle, Search, Target, Zap, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const ResumeReview = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    } else {
      toast.error('Please select a valid PDF file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
    } else {
      toast.error('Please drop a valid PDF file.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a resume to upload.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', targetRole);

    try {
      const res = await api.post('/resume/review', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      toast.success('Resume analyzed successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to analyze resume.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans p-6 md:p-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <button onClick={() => navigate('/placement')} className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ChevronLeft size={20} /> Back to Placement Hub
        </button>

        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">AI Resume Review</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload your PDF resume and instantly receive ATS scoring, missing keywords, and actionable feedback tailored to your target role.
          </p>
        </header>

        {!result ? (
          <div className="max-w-2xl mx-auto bg-[#0a0a16] border border-white/10 rounded-3xl p-8 shadow-2xl animate-fadeIn">
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Target Role</label>
              <input 
                type="text" 
                value={targetRole} 
                onChange={(e) => setTargetRole(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. Frontend Developer, Data Scientist"
              />
            </div>

            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed ${file ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/20 hover:border-emerald-400 hover:bg-white/5'} rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all text-center mb-8 h-64`}
            >
              <input 
                type="file" 
                accept="application/pdf" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              
              {file ? (
                <>
                  <FileText className="text-emerald-500 mb-4" size={48} />
                  <h3 className="text-xl font-bold text-white mb-2">{file.name}</h3>
                  <p className="text-gray-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <Upload className="text-gray-500 mb-4 group-hover:text-emerald-400 transition-colors" size={48} />
                  <h3 className="text-xl font-bold text-gray-300 mb-2">Upload your Resume</h3>
                  <p className="text-gray-500 text-sm">Drag and drop your PDF here, or click to browse.</p>
                </>
              )}
            </div>

            <button 
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="w-full py-4 rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <><Loader size={20} className="animate-spin" /> Analyzing Resume...</>
              ) : (
                <><Zap size={20} /> Generate AI Report</>
              )}
            </button>
          </div>
        ) : (
          <div className="animate-slideUp space-y-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Analysis Results for: <span className="text-emerald-400">{result.targetRole}</span></h2>
              <button 
                onClick={() => { 
                  setResult(null); 
                  setFile(null); 
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-bold transition-colors border border-white/10"
              >
                Scan Another Resume
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Score Card */}
              <div className="col-span-1 bg-[#0a0a16] border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
                <div className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-4">ATS Compatibility Score</div>
                <div className="relative w-48 h-48 flex items-center justify-center mb-4">
                  {/* Fake SVG Circle Progress */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
                    <circle 
                      cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray={502} 
                      strokeDashoffset={502 - (502 * result.atsScore) / 100}
                      className={`${result.atsScore >= 80 ? 'text-emerald-500' : result.atsScore >= 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`} 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-5xl font-black">{result.atsScore}</span>
                    <span className="text-gray-400 text-sm">/ 100</span>
                  </div>
                </div>
                <p className={`font-bold ${result.atsScore >= 80 ? 'text-emerald-400' : result.atsScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {result.atsScore >= 80 ? 'Excellent! Highly ATS friendly.' : result.atsScore >= 50 ? 'Good, but needs optimization.' : 'Poor ATS compatibility.'}
                </p>
              </div>

              {/* Feedback Sections */}
              <div className="col-span-1 md:col-span-2 space-y-6">
                <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-6">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-200 mb-3"><Search size={20} className="text-blue-400" /> Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords?.map((kw, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-sm">{kw}</span>
                    ))}
                    {!result.missingKeywords?.length && <span className="text-gray-400">No major keywords missing!</span>}
                  </div>
                </div>

                <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-6">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-200 mb-3"><Target size={20} className="text-orange-400" /> Skills Gap</h3>
                  <p className="text-gray-300 leading-relaxed bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl">
                    {result.skillsGap}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Grammar & Phrasing</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.grammar}</p>
                  </div>
                  <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Formatting & Structure</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.formatting}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions Checklist */}
            <div className="bg-[#0a0a16] border border-white/10 rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-black mb-6">Actionable Suggestions</h3>
              <ul className="space-y-4">
                {result.suggestions?.map((tip, i) => (
                  <li key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                      {i + 1}
                    </div>
                    <p className="text-gray-200 mt-1">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeReview;
