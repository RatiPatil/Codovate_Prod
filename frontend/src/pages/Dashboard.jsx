import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import CareerEngineCard from '../components/dashboard/CareerEngineCard';

const Dashboard = () => {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const wsRes = await api.get('/students/workspace');
        setWorkspace(wsRes.data);
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

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32 max-w-7xl mx-auto pb-32">
      <section className="dashboard-section mb-10">
        <h1 className="text-3xl md:text-5xl font-black mb-4">
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">{profile?.firstName || 'Student'}</span>
        </h1>
        <p className="text-gray-400 text-lg">Your next career move starts here.</p>
      </section>

      <section className="dashboard-section mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-5">
          
          {/* Step 1: Profile */}
          <CareerEngineCard
            icon="👤"
            label="Step 1: Setup"
            title={profile?.has_resume ? 'Profile Complete' : 'Complete Profile'}
            subtitle={profile?.has_resume ? 'Ready to apply.' : 'Finish your profile to unlock opportunities.'}
            link="/profile"
            linkText="Go to Profile"
            accentColor={profile?.has_resume ? 'green' : 'red'}
            badge={profile?.has_resume ? 'Ready ✓' : 'Required'}
          />

          {/* Step 2: Opportunities */}
          <CareerEngineCard
            icon="🔍"
            label="Step 2: Explore"
            title="Find Opportunities"
            subtitle="Browse open internships and jobs."
            link="/opportunities"
            linkText="Explore Now"
            accentColor="yellow"
            badge="Live"
          />

          {/* Step 3: Applications */}
          <CareerEngineCard
            icon="📋"
            label="Step 3: Track"
            title="Your Applications"
            subtitle={`${profile?.appsCount || 0} active application(s)`}
            link="/applications"
            linkText="Track Status"
            accentColor="blue"
            badge="In Progress"
          />

        </div>
      </section>
    </div>
  );
};

export default Dashboard;