import { useEffect, useState, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import api from '../api/axios';
import Loader from '../components/common/Loader';

// Components
import DashboardHero from '../components/dashboard/DashboardHero';
import TodaysMission from '../components/dashboard/TodaysMission';
import AICareerCoach from '../components/dashboard/AICareerCoach';
import CareerRoadmapCard from '../components/dashboard/CareerRoadmapCard';
import LearningCard from '../components/dashboard/LearningCard';
import CodingCard from '../components/dashboard/CodingCard';
import ProfileCard from '../components/dashboard/ProfileCard';
import ResumeCard from '../components/dashboard/ResumeCard';
import PortfolioCard from '../components/dashboard/PortfolioCard';
import RecommendedOpportunities from '../components/dashboard/RecommendedOpportunities';
import MentorCard from '../components/dashboard/MentorCard';
import TeamCard from '../components/dashboard/TeamCard';
import UpcomingEvents from '../components/dashboard/UpcomingEvents';
import Achievements from '../components/dashboard/Achievements';
import GamificationCard from '../components/dashboard/GamificationCard';
import NotificationsCard from '../components/dashboard/NotificationsCard';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [mission, setMission] = useState(null);
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const dashboardRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, missionRes, oppsRes] = await Promise.all([
        api.get('/students/profile'),
        api.get('/students/mission').catch(() => ({ data: null })),
        api.get('/opportunities').catch(() => ({ data: [] }))
      ]);
      setProfile(profileRes.data);
      setMission(missionRes.data);
      setOpps(oppsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Handle GSAP Entrance Animation
  useEffect(() => {
    if (!loading && dashboardRef.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        gsap.fromTo(
          gsap.utils.toArray('.stagger-card'),
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.05, ease: 'back.out(1.2)' }
        );
      }
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <Loader fullScreen={false} message="Loading AI Career Workspace..." />
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="p-6 md:p-8 max-w-[1600px] mx-auto relative z-10 space-y-6">
      
      {/* 1. Hero Section */}
      <div className="stagger-card opacity-0">
        <DashboardHero profile={profile} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Mission, Roadmap, Learning) */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          <div className="stagger-card opacity-0">
            <TodaysMission 
              mission={mission} 
              onMissionComplete={(data) => {
                setProfile(prev => ({ ...prev, xp: data.xp, streak: data.streak, level: data.level }));
              }} 
            />
          </div>
          <div className="stagger-card opacity-0 h-[400px]">
            <CareerRoadmapCard profile={profile} />
          </div>
          <div className="stagger-card opacity-0">
            <AICareerCoach profile={profile} />
          </div>
        </div>

        {/* Middle Column (Core Skills & Opportunities) */}
        <div className="col-span-1 lg:col-span-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="stagger-card opacity-0 h-[300px]">
              <LearningCard />
            </div>
            <div className="stagger-card opacity-0 h-[300px]">
              <CodingCard />
            </div>
          </div>

          <div className="stagger-card opacity-0 h-[350px]">
            <RecommendedOpportunities opportunities={opps} profile={profile} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[250px]">
            <div className="stagger-card opacity-0 h-full">
              <ProfileCard profile={profile} />
            </div>
            <div className="stagger-card opacity-0 h-full">
              <ResumeCard />
            </div>
            <div className="stagger-card opacity-0 h-full">
              <PortfolioCard />
            </div>
          </div>
        </div>

        {/* Right Column (Community, Events, Gamification) */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          <div className="stagger-card opacity-0 h-[220px]">
            <GamificationCard profile={profile} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[200px]">
            <div className="stagger-card opacity-0 h-full">
              <MentorCard profile={profile} />
            </div>
            <div className="stagger-card opacity-0 h-full">
              <TeamCard />
            </div>
          </div>

          <div className="stagger-card opacity-0 h-[220px]">
            <UpcomingEvents />
          </div>
          
          <div className="stagger-card opacity-0 h-[200px]">
            <Achievements />
          </div>

          <div className="stagger-card opacity-0">
            <NotificationsCard />
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;