import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import { FeatureFlagProvider } from './context/FeatureFlagContext';
import { SessionProvider } from './context/SessionContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { SidebarProvider } from './context/SidebarContext';
import { SearchProvider } from './context/SearchContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/ui/ToastProvider';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalNotifications from './components/GlobalNotifications';
import { Toaster } from 'react-hot-toast';

// Direct Layout Imports
import Layout from './components/Layout';

// Lazy load all major pages to enable code splitting
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const MentorLogin = lazy(() => import('./pages/MentorLogin'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const OnboardingSuccess = lazy(() => import('./pages/OnboardingSuccess'));
const WelcomeExperience = lazy(() => import('./pages/WelcomeExperience'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Opportunities = lazy(() => import('./pages/Opportunities'));
const Applications = lazy(() => import('./pages/Applications'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const RecruiterLogin = lazy(() => import('./pages/RecruiterLogin'));
const TeamsLayout = lazy(() => import('./pages/teams/TeamsLayout'));
const Workspace = lazy(() => import('./pages/teams/Workspace'));
// Admin Layouts & Views
const Mentors = lazy(() => import('./pages/Mentors'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminSandbox = lazy(() => import('./pages/AdminSandbox'));
const SuperAdminDashboard = lazy(() => import('./pages/admin/SuperAdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/users/UserManagement'));
const OrganizationManagement = lazy(() => import('./pages/admin/organizations/OrganizationManagement'));
const CollegeManagement = lazy(() => import('./pages/admin/colleges/CollegeManagement'));
const AcademicStructure = lazy(() => import('./pages/admin/academic/AcademicStructure'));
const StudentManagement = lazy(() => import('./pages/admin/students/StudentManagement'));
const StaffManagement = lazy(() => import('./pages/admin/staff/StaffManagement'));
const PlacementManagement = lazy(() => import('./pages/admin/placements/PlacementManagement'));
const CompanyManagement = lazy(() => import('./pages/admin/companies/CompanyManagement'));
const RecruiterManagement = lazy(() => import('./pages/admin/recruiters/RecruiterManagement'));
const JobManagement = lazy(() => import('./pages/admin/jobs/JobManagement'));
const ApplicationManagement = lazy(() => import('./pages/admin/applications/ApplicationManagement'));
const InterviewManagement = lazy(() => import('./pages/admin/interviews/InterviewManagement'));
const OfferManagement = lazy(() => import('./pages/admin/offers/OfferManagement'));
const PlacementRecordsManagement = lazy(() => import('./pages/admin/placement-records/PlacementRecordsManagement'));
const AnalyticsCommandCenter = lazy(() => import('./pages/admin/analytics/AnalyticsCommandCenter'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Gamification = lazy(() => import('./pages/Gamification'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const CareerCoach = lazy(() => import('./pages/CareerCoach'));
const LearningModule = lazy(() => import('./pages/LearningModule'));
const ProjectHub = lazy(() => import('./pages/ProjectHub'));
const AiDashboard = lazy(() => import('./pages/student/ai/AiDashboard'));
const DashboardRouter = lazy(() => import('./components/DashboardRouter'));
const MentorRouter = lazy(() => import('./components/MentorRouter'));
const PublicPortfolio = lazy(() => import('./pages/PublicPortfolio'));
const PlacementHub = lazy(() => import('./pages/PlacementHub'));
const CodingPractice = lazy(() => import('./pages/CodingPractice'));
const SkillAssessments = lazy(() => import('./pages/SkillAssessments'));
const ResumeReview = lazy(() => import('./pages/ResumeReview'));
const MockInterview = lazy(() => import('./pages/MockInterview'));
const Events = lazy(() => import('./pages/Events'));
const Community = lazy(() => import('./pages/Community'));
const Chat = lazy(() => import('./pages/Chat'));
const ActivityFeed = lazy(() => import('./pages/ActivityFeed'));

import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';

const GlobalLoader = () => (
  <div className="flex items-center justify-center h-screen bg-[#050510]">
    <div className="w-8 h-8 border-2 border-[#2015FF] border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <GlobalErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <SessionProvider>
              <OrganizationProvider>
                <SidebarProvider>
                  <SearchProvider>
                    <RoleProvider>
                      <FeatureFlagProvider>
                        <SocketProvider>
                          <GlobalNotifications />
                          <Toaster position="top-right" toastOptions={{
                            style: {
                              background: '#333',
                              color: '#fff',
                            }
                          }} />
                          <Suspense fallback={<GlobalLoader />}>
                            <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/recruiter-login" element={<RecruiterLogin />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  <Route path="/onboarding" element={
                    <ProtectedRoute requireOnboarding={false}>
                      <Onboarding />
                    </ProtectedRoute>
                  } />

                  <Route path="/onboarding-success" element={
                    <ProtectedRoute requireOnboarding={false}>
                      <OnboardingSuccess />
                    </ProtectedRoute>
                  } />

                  <Route path="/welcome" element={
                    <ProtectedRoute requireOnboarding={false}>
                      <WelcomeExperience />
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/opportunities" element={
                    <ProtectedRoute>
                      <Layout><Opportunities /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/applications" element={
                    <ProtectedRoute>
                      <Layout><Applications /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Layout><Profile /></Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Student Dedicated Routes */}
                  <Route path="/student/ai-dashboard" element={
                    <ProtectedRoute requireRole="student">
                      <Layout><AiDashboard /></Layout>
                    </ProtectedRoute>
                  } />



                  <Route path="/mentor/login" element={<MentorLogin />} />
                  <Route path="/mentor/*" element={
                    <ProtectedRoute requireOnboarding={false}>
                      <MentorRouter />
                    </ProtectedRoute>
                  } />
                  
                  {/* ───────────────────────────────────────────────────────── */}
                  <Route path="/admin" element={<ProtectedRoute requiredRole="super_admin" requireOnboarding={false}><Outlet /></ProtectedRoute>}>
                    <Route element={<AdminLayout />}>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<SuperAdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="organizations" element={<OrganizationManagement />} />
                      <Route path="colleges" element={<CollegeManagement />} />
                      <Route path="academic" element={<AcademicStructure />} />
                      <Route path="students" element={<StudentManagement />} />
                      <Route path="staff" element={<StaffManagement />} />
                      <Route path="placements" element={<PlacementManagement />} />
                      <Route path="companies" element={<CompanyManagement />} />
                      <Route path="recruiters" element={<RecruiterManagement />} />
                      <Route path="jobs" element={<JobManagement />} />
                      <Route path="applications" element={<ApplicationManagement />} />
                      <Route path="interviews" element={<InterviewManagement />} />
                      <Route path="offers" element={<OfferManagement />} />
                      <Route path="placement-records" element={<PlacementRecordsManagement />} />
                      <Route path="analytics" element={<AnalyticsCommandCenter />} />
                      <Route path="sandbox" element={<AdminSandbox />} />
                      {/* Future modules will mount here */}
                    </Route>
                  </Route>
                  
                  <Route path="/p/:username" element={<PublicPortfolio />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                          </Suspense>
                        </SocketProvider>
                      </FeatureFlagProvider>
                    </RoleProvider>
                  </SearchProvider>
                </SidebarProvider>
              </OrganizationProvider>
            </SessionProvider>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </GlobalErrorBoundary>
  );
}

export default App;