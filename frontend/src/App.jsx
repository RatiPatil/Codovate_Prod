import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/ui/ToastProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import DashboardRouter from './components/DashboardRouter';
import GlobalNotifications from './components/GlobalNotifications';
import MentorRouter from './components/MentorRouter';

import Home from './pages/Home';
import Login from './pages/Login';
import MentorLogin from './pages/MentorLogin';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Opportunities from './pages/Opportunities';
import Applications from './pages/Applications';
import Profile from './pages/Profile';

import AdminLogin from './pages/AdminLogin';
import TeamsLayout from './pages/teams/TeamsLayout';
import Mentors from './pages/Mentors';
import Leaderboard from './pages/Leaderboard';
import ResumeBuilder from './pages/ResumeBuilder';
import Notifications from './pages/Notifications';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

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
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;