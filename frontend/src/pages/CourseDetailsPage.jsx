import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  FileText,
  HelpCircle,
  Clock,
  Award,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RotateCcw
} from 'lucide-react';

const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [userProgress, setUserProgress] = useState({
    completedLessons: [],
    progressPercentage: 0,
    status: 'NOT_STARTED',
    minutesLearned: 0
  });

  const [activeLessonId, setActiveLessonId] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/learning/course/${courseId}`);

      if (res.data) {
        setCourse(res.data.course);
        setUserProgress(res.data.userProgress || {});

        // Auto select last active lesson or first lesson
        const allLessons = [];
        (res.data.course?.modules || []).forEach(m => {
          (m.lessons || []).forEach(l => allLessons.push(l));
        });

        if (allLessons.length > 0) {
          const lastId = res.data.userProgress?.lastLessonId;
          const target = allLessons.find(l => l.id === lastId) || allLessons[0];
          setActiveLessonId(target.id);
        }
      }
    } catch (err) {
      console.error('[CourseDetails] Fetch error:', err);
      setError("Failed to load course details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Flatten all lessons across modules for pagination
  const allLessons = [];
  if (course?.modules) {
    course.modules.forEach(m => {
      (m.lessons || []).forEach(l => allLessons.push({ ...l, moduleTitle: m.title }));
    });
  }

  const currentLessonIndex = allLessons.findIndex(l => l.id === activeLessonId);
  const activeLesson = allLessons[currentLessonIndex] || allLessons[0];

  const isCurrentCompleted = userProgress.completedLessons?.includes(activeLesson?.id);

  const handleMarkComplete = async () => {
    if (!activeLesson || completing) return;
    try {
      setCompleting(true);
      const res = await api.post(`/learning/course/${courseId}/complete-lesson`, {
        lessonId: activeLesson.id,
        minutes: activeLesson.durationMinutes || 15
      });

      if (res.data?.userProgress) {
        setUserProgress(res.data.userProgress);
      }

      // Auto advance to next lesson if available
      if (currentLessonIndex < allLessons.length - 1) {
        setActiveLessonId(allLessons[currentLessonIndex + 1].id);
      }
    } catch (err) {
      console.error('[CourseDetails] Complete lesson error:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    if (!activeLesson?.quiz?.questions) return;
    
    let correct = 0;
    activeLesson.quiz.questions.forEach((q, idx) => {
      if (selectedQuizAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });

    const scorePct = Math.round((correct / activeLesson.quiz.questions.length) * 100);
    setQuizScore(scorePct);

    if (scorePct >= 60) {
      handleMarkComplete();
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col items-center justify-center space-y-4 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium animate-pulse">Loading course module...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col items-center justify-center space-y-4 min-h-[400px]">
        <p className="text-red-400 font-semibold">{error || "Course not found."}</p>
        <button
          onClick={() => navigate('/learning')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all text-white"
        >
          Back to Learning Hub
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
      
      {/* TOP NAV BAR */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={() => navigate('/learning')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          <span>Back to Learning Hub</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-900">{course.title}</span>
            <span className="text-[11px] text-slate-500 font-medium">Instructor: {course.instructor || 'Codovate Team'}</span>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-indigo-600">{userProgress.progressPercentage || 0}%</span>
            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${userProgress.progressPercentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN COURSE WORKSPACE GRID */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT / CENTER: LESSON PLAYER & CONTENT AREA */}
        <div className="flex-1 space-y-6 min-w-0">
          
          {/* LESSON HEADER */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
              <span>{activeLesson?.moduleTitle}</span>
              <span>•</span>
              <span className="capitalize">{activeLesson?.type || 'lesson'}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeLesson?.title}
            </h1>
          </div>

          {/* MEDIA / CONTENT AREA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[450px] space-y-6 shadow-sm">
            
            {/* VIDEO LESSON RENDERER */}
            {activeLesson?.type === 'video' && (
              <div className="space-y-6">
                {activeLesson.videoUrl ? (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-xl">
                    <iframe
                      src={activeLesson.videoUrl}
                      title={activeLesson.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <PlayCircle className="w-16 h-16 text-indigo-600 animate-pulse" />
                    <p className="text-slate-800 font-bold text-sm">Interactive Video Lecture</p>
                  </div>
                )}

                {activeLesson.notes && (
                  <div className="prose max-w-none border-t border-slate-100 pt-6 text-sm text-slate-600 leading-relaxed">
                    <ReactMarkdown>{activeLesson.notes}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* NOTES / ARTICLE LESSON RENDERER */}
            {activeLesson?.type === 'notes' && (
              <div className="prose max-w-none text-sm text-slate-600 leading-relaxed space-y-4">
                <ReactMarkdown>{activeLesson.notes || "# Lesson Notes\n\nStudy the key principles and concepts for this topic carefully."}</ReactMarkdown>
              </div>
            )}

            {/* QUIZ LESSON RENDERER */}
            {activeLesson?.type === 'quiz' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold">
                  <HelpCircle className="w-5 h-5 shrink-0" />
                  <span>Pass this quiz with 60% or higher to complete this module lesson.</span>
                </div>

                <form onSubmit={handleQuizSubmit} className="space-y-6">
                  {activeLesson.quiz?.questions?.map((q, qIdx) => (
                    <div key={qIdx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <p className="font-bold text-slate-900 text-sm">
                        Q{qIdx + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options?.map((opt, oIdx) => (
                          <label key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                            selectedQuizAnswers[qIdx] === oIdx
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}>
                            <input
                              type="radio"
                              name={`question_${qIdx}`}
                              checked={selectedQuizAnswers[qIdx] === oIdx}
                              onChange={() => setSelectedQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                              className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {quizScore !== null && (
                    <div className={`p-4 rounded-2xl border text-center font-bold text-sm ${
                      quizScore >= 60 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      {quizScore >= 60 ? `🎉 Passed with ${quizScore}%!` : `Score: ${quizScore}%. Review materials and try again.`}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 font-bold text-white text-xs rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    Submit Quiz
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* ACTION CONTROLS ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <button
              disabled={currentLessonIndex === 0}
              onClick={() => setActiveLessonId(allLessons[currentLessonIndex - 1]?.id)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Lesson</span>
            </button>

            <button
              onClick={handleMarkComplete}
              disabled={completing}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
                isCurrentCompleted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:opacity-90'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCurrentCompleted ? 'Completed ✓' : completing ? 'Saving...' : 'Mark as Complete'}</span>
            </button>

            <button
              disabled={currentLessonIndex >= allLessons.length - 1}
              onClick={() => setActiveLessonId(allLessons[currentLessonIndex + 1]?.id)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-sm"
            >
              <span>Next Lesson</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* RIGHT SIDEBAR: MODULE & LESSON CURRICULUM OUTLINE */}
        <div className="w-full lg:w-96 shrink-0 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight border-b border-slate-100 pb-3">
              Course Outline
            </h3>

            <div className="space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
              {(course.modules || []).map((mod, mIdx) => (
                <div key={mod.id || mIdx} className="space-y-2">
                  <h4 className="text-xs font-extrabold text-indigo-600 tracking-wide uppercase">
                    {mod.title}
                  </h4>

                  <div className="space-y-1.5">
                    {(mod.lessons || []).map((les) => {
                      const isDone = userProgress.completedLessons?.includes(les.id);
                      const isActive = les.id === activeLessonId;

                      return (
                        <div
                          key={les.id}
                          onClick={() => setActiveLessonId(les.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            isActive
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm'
                              : isDone
                              ? 'bg-emerald-50/60 border-emerald-200 text-slate-700 hover:bg-emerald-100'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : les.type === 'video' ? (
                              <PlayCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                            )}
                            <span className="line-clamp-1">{les.title}</span>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                            {les.durationMinutes || 15}m
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default CourseDetailsPage;
