import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MentorLayout from './MentorLayout';

// Lazy load Mentor Pages
const MentorDashboard = lazy(() => import('../pages/mentor/MentorDashboard'));
const MentorChat = lazy(() => import('../pages/mentor/MentorChat'));
const MentorStudents = lazy(() => import('../pages/mentor/MentorStudents'));
const MentorProjects = lazy(() => import('../pages/mentor/MentorProjects'));
const MentorResources = lazy(() => import('../pages/mentor/MentorResources'));
const MentorProfile = lazy(() => import('../pages/mentor/MentorProfile'));

const MentorLoader = () => (
  <div className="flex items-center justify-center h-full bg-[#050510]">
    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const MentorRouter = () => {
  const { user } = useAuth();

  // strict role isolation
  if (user?.role !== 'mentor') {
    return <Navigate to="/" replace />;
  }

  return (
    <MentorLayout>
      <Suspense fallback={<MentorLoader />}>
        <Routes>
          <Route path="dashboard" element={<MentorDashboard />} />
          <Route path="chat" element={<MentorChat />} />
          <Route path="students" element={<MentorStudents />} />
          <Route path="projects" element={<MentorProjects />} />
          <Route path="resources" element={<MentorResources />} />
          <Route path="profile" element={<MentorProfile />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </MentorLayout>
  );
};

export default MentorRouter;
