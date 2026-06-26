import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import CollegeAdminLayout from './layouts/CollegeAdminLayout';

const CollegeAdminDashboard = lazy(() => import('./dashboards/CollegeAdminDashboard'));
const CollegeAdminStudents = lazy(() => import('../pages/admin/CollegeAdminStudents'));
const CollegeAdminFaculty = lazy(() => import('../pages/admin/CollegeAdminFaculty'));
const CollegeAdminProjects = lazy(() => import('../pages/admin/CollegeAdminProjects'));
const CollegeAdminCertificates = lazy(() => import('../pages/admin/CollegeAdminCertificates'));
const CollegeAdminEvents = lazy(() => import('../pages/admin/CollegeAdminEvents'));
const CollegeAdminReports = lazy(() => import('../pages/admin/CollegeAdminReports'));
const CollegeAdminNotifications = lazy(() => import('../pages/admin/CollegeAdminNotifications'));

const Loader = () => (
  <div className="flex items-center justify-center h-full min-h-[50vh] bg-transparent">
    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const CollegeAdminRouter = () => {
  return (
    <CollegeAdminLayout>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<CollegeAdminDashboard />} />
          <Route path="students" element={<CollegeAdminStudents />} />
          <Route path="faculty" element={<CollegeAdminFaculty />} />
          <Route path="projects" element={<CollegeAdminProjects />} />
          <Route path="certificates" element={<CollegeAdminCertificates />} />
          <Route path="events" element={<CollegeAdminEvents />} />
          <Route path="reports" element={<CollegeAdminReports />} />
          <Route path="notifications" element={<CollegeAdminNotifications />} />
        </Routes>
      </Suspense>
    </CollegeAdminLayout>
  );
};

export default CollegeAdminRouter;
