import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HeroSection from '../components/home/HeroSection';
import PublicStats from '../components/home/PublicStats';
import PlatformFeatures from '../components/home/PlatformFeatures';
import TeamsSpotlight from '../components/home/TeamsSpotlight';
import OpportunitiesPreview from '../components/home/OpportunitiesPreview';
import LearningPreview from '../components/home/LearningPreview';
import ResumeSpotlight from '../components/home/ResumeSpotlight';
import JourneySection from '../components/home/JourneySection';
import WhyCodovateSection from '../components/home/WhyCodovateSection';
import FinalCTA from '../components/home/FinalCTA';
import HomeFooter from '../components/home/HomeFooter';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if already logged in
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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-700 font-sans antialiased">
      {/* Main Content Sections */}
      <main>
        <HeroSection />
        <PublicStats />
        <PlatformFeatures />
        <TeamsSpotlight />
        <OpportunitiesPreview />
        <LearningPreview />
        <ResumeSpotlight />
        <JourneySection />
        <WhyCodovateSection />
        <FinalCTA />
      </main>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
};

export default Home;