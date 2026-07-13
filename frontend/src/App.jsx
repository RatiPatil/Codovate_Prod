import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
const Profile = lazy(() => import('./pages/Profile'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const TeamsLayout = lazy(() => import('./pages/teams/TeamsLayout'));
const Mentors = lazy(() => import('./pages/Mentors'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const Notifications = lazy(() => import('./pages/Notifications'));
const DashboardRouter = lazy(() => import('./components/DashboardRouter'));
const MentorRouter = lazy(() => import('./components/MentorRouter'));

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
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <GlobalNotifications />
          <Toaster position="top-right" toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            }
          }} />
          <BrowserRouter>
            <Suspense fallback={<GlobalLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
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
                <Route path="/teams" element={
                  <ProtectedRoute>
                    <Layout><TeamsLayout /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/mentors" element={
                  <ProtectedRoute>
                    <Layout><Mentors /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/leaderboard" element={
                  <ProtectedRoute>
                    <Layout><Leaderboard /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/resume" element={
                  <ProtectedRoute>
                    <Layout><ResumeBuilder /></Layout>
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Layout><Notifications /></Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/*" element={
                  <ProtectedRoute requireOnboarding={false}>
                    <DashboardRouter />
                  </ProtectedRoute>
                } />

                <Route path="/mentor/login" element={<MentorLogin />} />
                <Route path="/mentor/*" element={
                  <ProtectedRoute requireOnboarding={false}>
                    <MentorRouter />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;