import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import SuperAdminLayout from './layouts/SuperAdminLayout';

const SuperAdminDashboard = lazy(() => import('./dashboards/SuperAdminDashboard'));
const SuperAdminUsers = lazy(() => import('../pages/admin/SuperAdminUsers'));
const SuperAdminStudents = lazy(() => import('../pages/admin/SuperAdminStudents'));
const SuperAdminColleges = lazy(() => import('../pages/admin/SuperAdminColleges'));
const SuperAdminCompanies = lazy(() => import('../pages/admin/SuperAdminCompanies'));
const SuperAdminMentors = lazy(() => import('../pages/admin/SuperAdminMentors'));
const SuperAdminOpportunities = lazy(() => import('../pages/admin/SuperAdminOpportunities'));
const SuperAdminProjects = lazy(() => import('../pages/admin/SuperAdminProjects'));
const SuperAdminCertificates = lazy(() => import('../pages/admin/SuperAdminCertificates'));
const SuperAdminAnalytics = lazy(() => import('../pages/admin/SuperAdminAnalytics'));
const SuperAdminSystem = lazy(() => import('../pages/admin/SuperAdminSystem'));
const SuperAdminSettings = lazy(() => import('../pages/admin/SuperAdminSettings'));
const SuperAdminNotifications = lazy(() => import('../pages/admin/SuperAdminNotifications'));

const Loader = () => (
  <div className="flex items-center justify-center h-full min-h-[50vh] bg-[#030308]">
    <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
  </div>
);

const SuperAdminRouter = () => {
  return (
    <SuperAdminLayout>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<SuperAdminDashboard />} />
          <Route path="users" element={<SuperAdminUsers />} />
          <Route path="students" element={<SuperAdminStudents />} />
          <Route path="colleges" element={<SuperAdminColleges />} />
          <Route path="companies" element={<SuperAdminCompanies />} />
          <Route path="mentors" element={<SuperAdminMentors />} />
          <Route path="opportunities" element={<SuperAdminOpportunities />} />
          <Route path="projects" element={<SuperAdminProjects />} />
          <Route path="certificates" element={<SuperAdminCertificates />} />
          <Route path="analytics" element={<SuperAdminAnalytics />} />
          <Route path="notifications" element={<SuperAdminNotifications />} />
          <Route path="system" element={<SuperAdminSystem />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Routes>
      </Suspense>
    </SuperAdminLayout>
  );
};

export default SuperAdminRouter;
