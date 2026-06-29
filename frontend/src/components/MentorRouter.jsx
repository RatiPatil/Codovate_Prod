import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MentorDashboard from './dashboards/MentorDashboard';
import MentorQueries from '../pages/admin/MentorQueries';
import MentorAvailability from '../pages/admin/MentorAvailability';
import MentorFeedback from '../pages/admin/MentorFeedback';

const MentorRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<MentorDashboard />} />
      <Route path="/queries" element={<MentorQueries />} />
      <Route path="/availability" element={<MentorAvailability />} />
      <Route path="/feedback" element={<MentorFeedback />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default MentorRouter;
