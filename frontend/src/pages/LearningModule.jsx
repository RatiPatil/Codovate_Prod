import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import InteractiveQuiz from '../components/roadmap/InteractiveQuiz';
import ReactMarkdown from 'react-markdown';

const LearningModule = () => {
  const { stepId } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('notes'); // notes, resources, assignments, quiz

  useEffect(() => {
    fetchModule();
  }, [stepId]);

  const fetchModule = async () => {
    try {
      setLoading(true);
      const res = await api.get('/roadmap');
      const data = res.data;
      if (!data) {
        navigate('/roadmap');
        return;
      }
      setRoadmap(data);
      
      const targetStep = data.steps.find(s => s.id === stepId);
      if (!targetStep) {
        navigate('/roadmap');
        return;
      }
      
      setStep(targetStep);
      
      // If content isn't there, generate it on demand
      if (!targetStep.content) {
        generateContent(targetStep.id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const generateContent = async (id) => {
    try {
      setGenerating(true);
      const res = await api.post(`/roadmap/step/${id}/generate-content`);
      setStep(prev => ({ ...prev, content: res.data.content }));
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleAssignmentToggle = async (assignmentId, completed) => {
    // Optimistic UI update
    setStep(prev => {
      const newContent = { ...prev.content };
      newContent.assignments = newContent.assignments.map(a => 
        a.id === assignmentId ? { ...a, completed } : a
      );
      return { ...prev, content: newContent };
    });

    try {
      await api.put(`/roadmap/step/${stepId}/content-progress`, {
        type: 'assignment',
        itemId: assignmentId,
        completed
      });
    } catch (err) {
      console.error("Failed to update assignment", err);
      fetchModule(); // Revert on failure
    }
  };

  const handleQuizComplete = async (score) => {
    try {
      await api.put(`/roadmap/step/${stepId}/content-progress`, {
        type: 'quiz',
        score
      });
    } catch (err) {
      console.error("Failed to update quiz", err);
    }
  };

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-[#050505] p-4 md:p-8 pt-24 md:pt-32 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 mb-8 relative">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl">🧠</div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {generating ? 'AI is crafting your Learning Module...' : 'Loading...'}
        </h2>
        <p className="text-gray-400 max-w-sm mx-auto">
          Generating bespoke notes, video recommendations, assignments, and interactive quizzes for this topic.
        </p>
      </div>
    );
  }

  if (!step || !step.content) return <div className="text-white pt-32 text-center">Error loading module.</div>;

  const { content } = step;

  const tabs = [
    { id: 'notes', icon: '📖', label: 'Notes & Study' },
    { id: 'resources', icon: '▶️', label: 'Media & PDFs' },
    { id: 'assignments', icon: '📝', label: 'Assignments' },
    { id: 'quiz', icon: '🧠', label: 'Quiz' }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 pb-32 max-w-6xl mx-auto">
      
      {/* Back & Header */}
      <div className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => navigate('/roadmap')}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <span className="text-primary font-bold text-sm tracking-wider uppercase">Learning Module</span>
          <h1 className="text-3xl font-black">{step.title}</h1>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-10 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-[0_0_20px_rgba(32,21,255,0.3)]' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-panel p-6 md:p-10 rounded-3xl min-h-[500px]">
        {activeTab === 'notes' && (
          <div className="prose prose-invert prose-primary max-w-none">
            <ReactMarkdown>{content.notes}</ReactMarkdown>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span>▶️</span> Recommended Videos</h3>
              <div className="space-y-4">
                {content.videos?.map((vid, i) => (
                  <a key={i} href={vid.url !== '#' ? vid.url : `https://www.youtube.com/results?search_query=${encodeURIComponent(vid.title)}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:bg-white/5 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    </div>
                    <span className="font-semibold text-gray-300 group-hover:text-white flex-1">{vid.title}</span>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span>📄</span> Articles & PDFs</h3>
              <div className="space-y-4">
                {[...(content.articles||[]), ...(content.pdfs||[])].map((doc, i) => (
                  <a key={i} href={doc.url !== '#' ? doc.url : `https://www.google.com/search?q=${encodeURIComponent(doc.title)}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:bg-white/5 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <span className="font-semibold text-gray-300 group-hover:text-white flex-1">{doc.title}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span>📝</span> Hands-on Assignments</h3>
            <div className="grid gap-6">
              {content.assignments?.map(assignment => (
                <div key={assignment.id} className={`glass-card p-6 rounded-2xl border transition-colors ${assignment.completed ? 'border-primary/50 bg-primary/5' : 'border-white/5'}`}>
                  <div className="flex items-start gap-4">
                    <input 
                      type="checkbox"
                      checked={assignment.completed}
                      onChange={(e) => handleAssignmentToggle(assignment.id, e.target.checked)}
                      className="w-6 h-6 mt-1 rounded text-primary border-gray-600 focus:ring-primary focus:ring-offset-gray-900 cursor-pointer"
                    />
                    <div>
                      <h4 className={`text-lg font-bold mb-2 ${assignment.completed ? 'text-gray-400 line-through' : 'text-white'}`}>{assignment.title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{assignment.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!content.assignments || content.assignments.length === 0) && (
                <p className="text-gray-500 italic">No assignments for this module.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <InteractiveQuiz 
            quizData={content.quiz} 
            onComplete={handleQuizComplete}
          />
        )}
      </div>

    </div>
  );
};

export default LearningModule;
