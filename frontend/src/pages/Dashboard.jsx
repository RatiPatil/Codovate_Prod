import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import SkeletonLoader from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';
import { useToast } from '../components/ui/ToastProvider';

const Dashboard = () => {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedJobs, setSavedJobs] = useState({});
  const { addToast } = useToast();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        const res = await api.get('/students/workspace');
        setWorkspace(res.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load your student command center.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, []);

  useEffect(() => {
    if (!loading && workspace && containerRef.current) {
      const sections = containerRef.current.querySelectorAll('.dashboard-section');
      gsap.fromTo(
        sections,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [loading, workspace]);

  const toggleSaveJob = (jobId) => {
    setSavedJobs(prev => {
      const newState = !prev[jobId];
      addToast({
        type: 'info',
        title: newState ? 'Saved' : 'Removed',
        message: newState ? 'Opportunity saved to your bookmarks.' : 'Removed from bookmarks.'
      });
      return { ...prev, [jobId]: newState };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32 max-w-7xl mx-auto space-y-8">
        <div className="h-12 bg-white/10 rounded-xl w-1/3 animate-pulse" />
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  if (error && !workspace) return <ErrorState message={error} />;
  if (!workspace) return null;

  const profile = workspace.profile || {};
  const recentApps = workspace.recentApps || [];
  const recommendedJobs = workspace.recommendedJobs || [];
  const placementReadiness = workspace.placementReadiness || {};

  // Calculate Section 1: Today's Next Step
  const getNextStep = () => {
    if (!profile.has_resume) {
      return {
        title: 'Upload Your Resume',
        subtitle: 'Adding your resume to your profile increases application callbacks by 3x.',
        badge: 'Priority Action',
        buttonText: 'Upload Resume on Profile →',
        link: '/profile',
        accentColor: 'from-amber-500/20 to-orange-500/10 border-amber-500/30'
      };
    }
    if ((profile.appsCount || 0) === 0) {
      return {
        title: 'Apply to Your First Opportunity',
        subtitle: 'Top tier-1 hiring partners are actively evaluating student profiles today.',
        badge: 'Next Step',
        buttonText: 'Explore Opportunities →',
        link: '/opportunities',
        accentColor: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30'
      };
    }
    return {
      title: 'Explore Recommended Opportunities',
      subtitle: `We found roles matching your career goal: ${profile.career_goal || 'Software Engineer'}.`,
      badge: 'Active Journey',
      buttonText: 'Browse Matches →',
      link: '/opportunities',
      accentColor: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30'
    };
  };

  const nextStep = getNextStep();

  // Calculate Section 2: Career Progress Checklist (5 items)
  const checklist = [
    { label: 'Profile Completed', done: (profile.profile_completion || 0) >= 80, link: '/profile' },
    { label: 'Resume Uploaded', done: !!profile.has_resume, link: '/profile' },
    { label: 'Skills Added', done: (profile.skills_count || 0) > 0, link: '/profile' },
    { label: 'Applied to Opportunity', done: (profile.appsCount || 0) > 0, link: '/opportunities' },
    { label: 'Interview Scheduled', done: !!profile.has_interview, link: '/applications' },
  ];

  const completedCount = checklist.filter(c => c.done).length;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32 max-w-7xl mx-auto pb-32 space-y-8 font-inter">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <section className="dashboard-section bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Student Command Center
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">{profile.name || 'Student'}</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base font-medium">
              Target Role: <span className="text-white font-semibold">{profile.career_goal || 'Software Engineer'}</span>
            </p>
          </div>

          {/* Profile Completion Bar */}
          <div className="w-full lg:w-72 bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-gray-400 uppercase tracking-wider">Profile Readiness</span>
              <span className="text-primary font-black text-sm">{profile.profile_completion || 0}%</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${profile.profile_completion || 0}%` }}
              />
            </div>
            <Link to="/profile" className="text-[11px] text-gray-400 hover:text-white mt-2 block font-semibold transition-colors">
              Manage Profile & Details →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: TODAY'S NEXT STEP (Single Hero Action Card) ──────── */}
      <section className="dashboard-section">
        <div className={`p-6 md:p-8 rounded-3xl bg-gradient-to-r ${nextStep.accentColor} border backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6`}>
          <div className="space-y-2 max-w-2xl">
            <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold tracking-wider uppercase text-white">
              ⚡ {nextStep.badge}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">{nextStep.title}</h2>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">{nextStep.subtitle}</p>
          </div>
          <Link
            to={nextStep.link}
            className="btn-primary py-3.5 px-6 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all duration-300 whitespace-nowrap block"
          >
            {nextStep.buttonText}
          </Link>
        </div>
      </section>

      {/* ── SECTION 2: CAREER PROGRESS CHECKLIST ───────────────────────── */}
      <section className="dashboard-section bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Career Progress Checklist</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Complete all 5 milestones to maximize hiring callbacks.</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
            {completedCount} of 5 Completed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {checklist.map((item, idx) => (
            <Link
              key={idx}
              to={item.link}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between h-28 ${
                item.done
                  ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Step 0{idx + 1}</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${item.done ? 'bg-emerald-500 text-black' : 'border border-white/20 text-transparent'}`}>
                  ✓
                </span>
              </div>
              <span className={`text-xs font-bold leading-tight ${item.done ? 'text-emerald-400' : 'text-gray-300'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── SECTION 3: RECOMMENDED OPPORTUNITIES ──────────────────────── */}
      <section className="dashboard-section space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Recommended Opportunities</h2>
            <p className="text-xs text-gray-400 font-medium">Curated roles matching your profile.</p>
          </div>
          <Link to="/opportunities" className="text-xs font-bold text-primary hover:underline">
            View All ({recommendedJobs.length}) →
          </Link>
        </div>

        {recommendedJobs.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center space-y-3">
            <p className="text-gray-400 text-sm font-medium">No live opportunities match right now.</p>
            <Link to="/opportunities" className="inline-block btn-primary text-xs px-4 py-2 rounded-lg font-bold">
              Browse All Opportunities
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedJobs.map(job => (
              <div key={job.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      {job.type || 'Full-Time'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSaveJob(job.id)}
                      className="text-gray-400 hover:text-yellow-400 text-sm transition-colors"
                      title="Bookmark Job"
                    >
                      {savedJobs[job.id] ? '★' : '☆'}
                    </button>
                  </div>
                  <h3 className="font-bold text-base text-white">{job.title}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{job.company} • {job.location}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-xs font-semibold text-gray-300">{job.salary}</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/opportunities`)}
                    className="text-xs font-bold btn-primary px-3.5 py-1.5 rounded-lg shadow-md shadow-primary/20"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── SECTION 4: RECENT APPLICATIONS ───────────────────────────── */}
      <section className="dashboard-section space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Recent Applications</h2>
            <p className="text-xs text-gray-400 font-medium">Track your application progress in real-time.</p>
          </div>
          <Link to="/applications" className="text-xs font-bold text-primary hover:underline">
            View All ({profile.appsCount || 0}) →
          </Link>
        </div>

        {recentApps.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center space-y-3">
            <p className="text-gray-400 text-sm font-medium">You haven't submitted any applications yet.</p>
            <Link to="/opportunities" className="inline-block btn-primary text-xs px-4 py-2 rounded-lg font-bold">
              Find Roles & Apply
            </Link>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {recentApps.map(app => (
                <div key={app.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/[0.02] transition-colors">
                  <div>
                    <h3 className="font-bold text-sm text-white">{app.title}</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{app.company}</p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      app.status === 'Offer' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      app.status === 'Interview' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      app.status === 'Under Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {app.status}
                    </span>
                    <Link to="/applications" className="text-xs font-bold text-gray-300 hover:text-white underline">
                      Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── SECTION 5: AI CAREER COACH INSIGHT ────────────────────────── */}
      <section className="dashboard-section bg-gradient-to-r from-purple-900/20 to-primary/10 border border-purple-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider">
              🤖 AI Career Coach Insight
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {placementReadiness.improvements?.[0] || 'Upload your resume and add 2 technical skills to boost callback rates by 25%.'}
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              Overall Placement Readiness Score: <span className="text-purple-400 font-bold">{placementReadiness.score || 45}/100</span>
            </p>
          </div>
          <Link
            to="/profile"
            className="btn-primary py-3 px-5 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all whitespace-nowrap block"
          >
            Update Profile →
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;