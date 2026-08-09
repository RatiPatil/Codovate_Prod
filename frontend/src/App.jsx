import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
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
import PublicOnlyRoute from './components/PublicOnlyRoute';
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
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
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
const LearningHub = lazy(() => import('./pages/LearningHub'));
const CourseDetailsPage = lazy(() => import('./pages/CourseDetailsPage'));
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
import Logo from './components/common/Logo';

const GlobalLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#F8FAFC] gap-4">
    <div className="animate-pulse">
      <Logo responsive variant="light" className="drop-shadow-sm" />
    </div>
    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const DynamicTitle = () => {
  const location = useLocation();
  useEffect(() => {
    const p = location.pathname;
    if (p === '/dashboard') document.title = 'Codovate | Dashboard';
    else if (p.startsWith('/opportunities')) document.title = 'Codovate | Opportunities';
    else if (p === '/applications') document.title = 'Codovate | My Applications';
    else if (p === '/profile') document.title = 'Codovate | Profile';
    else if (p === '/learning') document.title = 'Codovate | Learning';
    else if (p === '/resume-builder') document.title = 'Codovate | Resume Builder';
    else if (p === '/login') document.title = 'Codovate | Login';
    else if (p === '/signup') document.title = 'Codovate | Sign Up';
    else if (p === '/admin-login') document.title = 'Codovate | Admin Login';
    else if (p.startsWith('/admin')) document.title = 'Codovate | Admin Dashboard';
    else document.title = 'Codovate | AI Powered Student Career Platform';
  }, [location]);
  return null;
};

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
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
                          <DynamicTitle />
                          <GlobalNotifications />
                          <Toaster position="top-right" toastOptions={{
                            style: {
                              background: '#333',
                              color: '#fff',
                            }
                          }} />
                          <Suspense fallback={<GlobalLoader />}>
                            <Routes>
                  <Route path="/" element={<PublicOnlyRoute><Home /></PublicOnlyRoute>} />
                  <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                  <Route path="/recruiter-login" element={<PublicOnlyRoute><RecruiterLogin /></PublicOnlyRoute>} />
                  <Route path="/admin-login" element={<PublicOnlyRoute><AdminLogin /></PublicOnlyRoute>} />
                  <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
                  <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
                  <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

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
                  <Route path="/opportunities/:type" element={
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
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Layout><Profile /></Layout>
                    </ProtectedRoute>
                  } />

                  {/* Complete Student Modules */}
                  <Route path="/roadmap" element={<ProtectedRoute><Layout><Roadmap /></Layout></ProtectedRoute>} />
                  <Route path="/learning" element={<ProtectedRoute><Layout><LearningHub /></Layout></ProtectedRoute>} />
                  <Route path="/learning/course/:courseId" element={<ProtectedRoute><Layout><CourseDetailsPage /></Layout></ProtectedRoute>} />
                  <Route path="/learning/step/:stepId" element={<ProtectedRoute><Layout><LearningModule /></Layout></ProtectedRoute>} />
                  <Route path="/resume-builder" element={<ProtectedRoute><Layout><ResumeBuilder /></Layout></ProtectedRoute>} />
                  <Route path="/mock-interview" element={<ProtectedRoute><Layout><MockInterview /></Layout></ProtectedRoute>} />
                  <Route path="/resume-review" element={<ProtectedRoute><Layout><ResumeReview /></Layout></ProtectedRoute>} />
                  <Route path="/skill-assessments" element={<ProtectedRoute><Layout><SkillAssessments /></Layout></ProtectedRoute>} />
                  <Route path="/coding-practice" element={<ProtectedRoute><Layout><CodingPractice /></Layout></ProtectedRoute>} />
                  <Route path="/projecthub" element={<ProtectedRoute><Layout><ProjectHub /></Layout></ProtectedRoute>} />
                  <Route path="/mentors" element={<Navigate to="/opportunities/internship" replace />} />
                  <Route path="/community" element={<ProtectedRoute><Layout><Community /></Layout></ProtectedRoute>} />
                  <Route path="/teams/*" element={<ProtectedRoute><Layout><TeamsLayout /></Layout></ProtectedRoute>} />
                  <Route path="/events" element={<ProtectedRoute><Layout><Events /></Layout></ProtectedRoute>} />
                  <Route path="/gamification" element={<ProtectedRoute><Layout><Gamification /></Layout></ProtectedRoute>} />
                  <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute><Layout><Calendar /></Layout></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
                  
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