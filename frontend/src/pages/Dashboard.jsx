import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';

import HeroSection from '../components/dashboard/HeroSection';
import TodaysFocusWidget from '../components/dashboard/TodaysFocusWidget';
import ProgressOverview from '../components/dashboard/ProgressOverview';
import AIRecommendations from '../components/dashboard/AIRecommendations';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        // We will fetch all data in a single optimized request
        const res = await api.get('/students/workspace');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load workspace data:', err);
        setError('Failed to load your workspace.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkspace();
  }, []);

  useEffect(() => {
    if (!loading && data && containerRef.current) {
      const sections = containerRef.current.querySelectorAll('.dashboard-section');
      gsap.fromTo(sections, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );
    }
  }, [loading, data]);

  if (loading) return <Loader fullScreen />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 md:pt-32 max-w-7xl mx-auto space-y-12 pb-32">
      
      {/* SECTION 1: Hero Section */}
      <section className="dashboard-section">
        <HeroSection profile={data.profile} />
      </section>

      {/* SECTION 2: Today's Focus */}
      <section className="dashboard-section">
        <TodaysFocusWidget mission={data.mission} />
      </section>

      {/* SECTION 3: Progress Overview */}
      <section className="dashboard-section">
        <ProgressOverview profile={data.profile} />
      </section>

      {/* SECTION 4: AI Recommendations */}
      <section className="dashboard-section">
        <AIRecommendations recommendations={data.recommendations} />
      </section>

    </div>
  );
};

export default Dashboard;