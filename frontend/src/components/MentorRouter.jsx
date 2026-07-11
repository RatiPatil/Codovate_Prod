import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MentorLayout from './MentorLayout';

// Mentor Pages
import MentorDashboard from '../pages/mentor/MentorDashboard';
import MentorChat from '../pages/mentor/MentorChat';
import MentorStudents from '../pages/mentor/MentorStudents';
import MentorResources from '../pages/mentor/MentorResources';
import MentorProfile from '../pages/mentor/MentorProfile';

const MentorRouter = () => {
  const { user } = useAuth();

  // strict role isolation
  if (user?.role !== 'mentor') {
    return <Navigate to="/" replace />;
  }

  return (
    <MentorLayout>
      <Routes>
        <Route path="dashboard" element={<MentorDashboard />} />
        <Route path="chat" element={<MentorChat />} />
        <Route path="students" element={<MentorStudents />} />
        <Route path="resources" element={<MentorResources />} />
        <Route path="profile" element={<MentorProfile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </MentorLayout>
  );
};

export default MentorRouter;
