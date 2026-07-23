import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';

import HeroSection from '../components/dashboard/HeroSection';
import TodaysFocusWidget from '../components/dashboard/TodaysFocusWidget';
import PlacementReadinessWidget from '../components/dashboard/PlacementReadinessWidget';
import AIRecommendations from '../components/dashboard/AIRecommendations';
import CareerEngineCard from '../components/dashboard/CareerEngineCard';
import SkillGapWidget from '../components/dashboard/SkillGapWidget';
import CommunityHubWidget from '../components/dashboard/CommunityHubWidget';

const Dashboard = () => {
  // Each section has its own loading state for progressive rendering
  const [workspace, setWorkspace] = useState(null);
  const [dailyTasks, setDailyTasks] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [skillGap, setSkillGap] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel to avoid waterfall loading
        const [
          wsRes,
          tasksRes,
          readinessRes,
          recsRes,
          roadmapRes,
          reportRes,
          skillGapRes
        ] = await Promise.allSettled([
          api.get('/students/workspace'),
          api.get('/students/daily-tasks'),
          api.get('/students/placement-readiness'),
          api.get('/students/recommendations'),
          api.get('/roadmap/career-roadmap'),
          api.get('/students/weekly-report'),
          api.get('/ai/skill-gap'),
        ]);

        if (wsRes.status === 'fulfilled') setWorkspace(wsRes.value.data);
        else throw new Error('Failed to load workspace.'); // Core requirement

        if (tasksRes.status === 'fulfilled') setDailyTasks(tasksRes.value.data);
        if (readinessRes.status === 'fulfilled') setReadiness(readinessRes.value.data);
        if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value.data?.recommendations || []);
        if (roadmapRes.status === 'fulfilled') setRoadmap(roadmapRes.value.data);
        if (reportRes.status === 'fulfilled') setWeeklyReport(reportRes.value.data);
        if (skillGapRes.status === 'fulfilled') setSkillGap(skillGapRes.value.data);

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load your workspace.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  useEffect(() => {
    if (!loading && workspace && containerRef.current) {
      const sections = containerRef.current.querySelectorAll('.dashboard-section');
      gsap.fromTo(sections,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out' }
      );
    }
  }, [loading, workspace]);

  if (loading) return <Loader fullScreen />;
  if (error && !workspace) return <ErrorState message={error} />;
  if (!workspace) return null;

  const profile = workspace.profile || {};
  const activeStep = roadmap?.steps?.find(s => s.status === 'in_progress' || s.status === 'pending');

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32 max-w-7xl mx-auto pb-32">

      {/* ── SECTION 1: HERO ──────────────────────────────────────── */}
      <section className="dashboard-section mb-10">
        <HeroSection profile={profile} />
      </section>

      {/* ── SECTION 2: TODAY'S TASKS ─────────────────────────────── */}
      <section className="dashboard-section mb-10">
        <TodaysFocusWidget mission={dailyTasks || workspace.mission} />
      </section>

      {/* ── SECTION 3: AI CAREER ENGINE ROW ─────────────────────── */}
      <section className="dashboard-section mb-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-8 bg-gradient-to-b from-primary to-purple-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(32,21,255,0.5)]" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">AI Career Engine</h2>
          <span className="bg-primary/20 text-primary text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-primary/30 tracking-widest shadow-sm">Live</span>
        </div>

        {/* Engine Grid: All sections fed by the AI Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-5">

          {/* Career Roadmap Card */}
          <CareerEngineCard
            icon="🗺️"
            label="Career Roadmap"
            title={activeStep ? activeStep.title : roadmap ? 'Roadmap Complete!' : 'No Roadmap Yet'}
            subtitle={roadmap ? `${roadmap.overall_progress || 0}% overall progress` : 'Generate your personalized AI roadmap'}
            progress={roadmap?.overall_progress}
            link="/roadmap"
            linkText="View Roadmap"
            accentColor="blue"
            badge={roadmap?.goal}
          />

          {/* Learning Card */}
          <CareerEngineCard
            icon="📚"
            label="Learning"
            title={activeStep?.content ? `Studying ${activeStep.title}` : activeStep ? `Start ${activeStep.title}` : 'Explore Modules'}
            subtitle={activeStep ? `Estimated: ${activeStep.estimated_time || '—'}` : 'Begin your first module'}
            link={activeStep ? `/roadmap/module/${activeStep.id}` : '/roadmap'}
            linkText="Open Module"
            accentColor="purple"
            badge={activeStep?.difficulty}
          />

          {/* Projects Card */}
          <CareerEngineCard
            icon="💻"
            label="Projects"
            title="Build Real Projects"
            subtitle={`${profile?.projects?.length || 0} project(s) on your profile`}
            link="/profile"
            linkText="Add Project"
            accentColor="green"
            badge="Portfolio"
          />

          {/* Resume Card */}
          <CareerEngineCard
            icon="📄"
            label="Resume"
            title={profile?.has_resume ? 'Resume Uploaded' : 'Resume Missing'}
            subtitle={profile?.has_resume ? 'Keep it updated for opportunities.' : 'Upload your resume to start applying.'}
            link="/resume"
            linkText={profile?.has_resume ? 'Update Resume' : 'Build Resume'}
            accentColor={profile?.has_resume ? 'green' : 'red'}
            badge={profile?.has_resume ? 'Uploaded ✓' : 'Required'}
          />

          {/* Opportunities Card */}
          <CareerEngineCard
            icon="🔍"
            label="Opportunities"
            title="Browse Internships & Jobs"
            subtitle={`${profile?.appsCount || 0} active application(s)`}
            link="/opportunities"
            linkText="Explore Now"
            accentColor="yellow"
            badge="AI-Matched"
          />

          {/* Mentors Card */}
          {(() => {
            const recs = recommendations || workspace?.recommendations || [];
            const mentorRec = recs.find(r => r.type === 'mentor');
            return (
              <CareerEngineCard
                icon="👨‍🏫"
                label="Recommended Mentor"
                title={mentorRec ? mentorRec.title : 'Find a Mentor'}
                subtitle={mentorRec ? mentorRec.company : 'Get expert guidance'}
                link={mentorRec ? mentorRec.linkUrl : '/mentors'}
                linkText="Book Session →"
                accentColor="orange"
                badge="Expert Guidance"
              />
            );
          })()}

          {/* Teams Card */}
          <CareerEngineCard
            icon="🤝"
            label="Teams"
            title="Collaborate & Build"
            subtitle={`${profile?.teamsCount || 0} team(s) joined`}
            link="/teams"
            linkText="Find Teams"
            accentColor="pink"
            badge="Live Projects"
          />

          {/* Weekly Report Card */}
          {weeklyReport?.readinessScore != null ? (
            <CareerEngineCard
              icon="📊"
              label="Weekly Report"
              title={`Week Ending ${new Date(weeklyReport.weekEnding).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
              subtitle={`Readiness: ${weeklyReport.readinessScore}% · Tasks: ${weeklyReport.tasksAssigned}`}
              link="/rewards"
              linkText="View Progress"
              accentColor="cyan"
              badge="Generated"
            />
          ) : (
            <CareerEngineCard
              icon="📊"
              label="Weekly Report"
              title="Report Not Yet Generated"
              subtitle="Generated automatically every Friday by the AI engine."
              link="/rewards"
              linkText="View Rewards"
              accentColor="cyan"
              badge="Coming Friday"
            />
          )}

        </div>
      </section>

      {/* ── SECTION 4: PLACEMENT READINESS ───────────────────────── */}
      {readiness && (
        <section className="dashboard-section mb-10">
          <PlacementReadinessWidget readiness={readiness} />
        </section>
      )}

      {/* ── SECTION 5: SKILL GAP ANALYSIS ────────────────────── */}
      {skillGap && (
        <section className="dashboard-section mb-10">
          <SkillGapWidget skillGap={skillGap} />
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-10">
        {/* ── SECTION 6: AI RECOMMENDATIONS ────────────────────────── */}
        <section className="dashboard-section xl:col-span-2">
          <AIRecommendations recommendations={recommendations || workspace.recommendations || []} />
        </section>
        
        {/* ── SECTION 7: COMMUNITY HUB ───────────────────────────── */}
        <section className="dashboard-section xl:col-span-1">
          <CommunityHubWidget updates={workspace?.communityUpdates || []} />
        </section>
      </div>

    </div>
  );
};

export default Dashboard;