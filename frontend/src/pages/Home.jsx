import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedAtmosphere from '../components/home/AnimatedAtmosphere';
import OrbitalSystem from '../components/home/OrbitalSystem';
import StickyNavbar from '../components/home/StickyNavbar';
import HeroSectionV2 from '../components/home/HeroSectionV2';
import TrustSection from '../components/home/TrustSection';
import StatsSection from '../components/home/StatsSection';
import ConnectedOrbitSection from '../components/home/ConnectedOrbitSection';
import FeaturesGrid from '../components/home/FeaturesGrid';
import LearningTabsSection from '../components/home/LearningTabsSection';
import CodeEditorPreview from '../components/home/CodeEditorPreview';
import ProjectsSection from '../components/home/ProjectsSection';
import RoadmapSection from '../components/home/RoadmapSection';
import FreeResourcesSection from '../components/home/FreeResourcesSection';
import MentorsSection from '../components/home/MentorsSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import FAQSection from '../components/home/FAQSection';
import FinalCTA from '../components/home/FinalCTA';
import FooterV2 from '../components/home/FooterV2';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if user is logged in
  useEffect(() => {
    if (user) {
      const adminRoles = ['super_admin', 'admin', 'college_admin', 'company_admin', 'mentor'];
      if (adminRoles.includes(user.role)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    document.title = 'Codovate — Learn. Build. Compete. Grow.';
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FCFDFF] dark:bg-[#080A12] text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-700 dark:selection:text-indigo-200 font-sans antialiased overflow-x-hidden transition-colors duration-300">
      {/* 1. Global Animated Atmospheric Glow Container (Layers 1 & 2) */}
      <AnimatedAtmosphere />

      {/* 2. Floating Curved Orbital System & Icon Nodes */}
      <OrbitalSystem />

      {/* 3. Sticky Floating Pill Navbar */}
      <StickyNavbar />

      {/* 4. Continuous Animated Homepage Content Stream */}
      <main className="relative z-10">
        <HeroSectionV2 />
        <TrustSection />
        <StatsSection />
        <ConnectedOrbitSection />
        <FeaturesGrid />
        <LearningTabsSection />
        <CodeEditorPreview />
        <ProjectsSection />
        <RoadmapSection />
        <FreeResourcesSection />
        <MentorsSection />
        <TestimonialsSection />
        <FAQSection />
        <FinalCTA />
      </main>

      {/* 5. Clean Footer */}
      <FooterV2 />
    </div>
  );
};

export default Home;