import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import CompanyAdminLayout from './layouts/CompanyAdminLayout';

const CompanyAdminDashboard = lazy(() => import('./dashboards/CompanyAdminDashboard'));
const CompanyAdminJobs = lazy(() => import('../pages/admin/CompanyAdminJobs'));
const CompanyAdminInternships = lazy(() => import('../pages/admin/CompanyAdminInternships'));
const CompanyAdminApplications = lazy(() => import('../pages/admin/CompanyAdminApplications'));
const CompanyAdminCandidates = lazy(() => import('../pages/admin/CompanyAdminCandidates'));
const CompanyAdminInterviews = lazy(() => import('../pages/admin/CompanyAdminInterviews'));
const CompanyAdminHiring = lazy(() => import('../pages/admin/CompanyAdminHiring'));
const CompanyAdminNotifications = lazy(() => import('../pages/admin/CompanyAdminNotifications'));
const CompanyAdminTalent = lazy(() => import('../pages/admin/CompanyAdminTalent'));

const Loader = () => (
  <div className="flex items-center justify-center h-full min-h-[50vh] bg-transparent">
    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const CompanyAdminRouter = () => {
  return (
    <CompanyAdminLayout>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<CompanyAdminDashboard />} />
          <Route path="jobs" element={<CompanyAdminJobs />} />
          <Route path="internships" element={<CompanyAdminInternships />} />
          <Route path="applications" element={<CompanyAdminApplications />} />
          <Route path="candidates" element={<CompanyAdminCandidates />} />
          <Route path="interviews" element={<CompanyAdminInterviews />} />
          <Route path="hiring" element={<CompanyAdminHiring />} />
          <Route path="notifications" element={<CompanyAdminNotifications />} />
          <Route path="talent" element={<CompanyAdminTalent />} />
        </Routes>
      </Suspense>
    </CompanyAdminLayout>
  );
};

export default CompanyAdminRouter;
