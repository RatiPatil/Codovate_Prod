import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CollegeAdminLayout from './layouts/CollegeAdminLayout';

import CollegeAdminDashboard from './dashboards/CollegeAdminDashboard';
import CollegeAdminStudents from '../pages/admin/CollegeAdminStudents';
import CollegeAdminFaculty from '../pages/admin/CollegeAdminFaculty';
import CollegeAdminProjects from '../pages/admin/CollegeAdminProjects';
import CollegeAdminCertificates from '../pages/admin/CollegeAdminCertificates';
import CollegeAdminEvents from '../pages/admin/CollegeAdminEvents';
import CollegeAdminReports from '../pages/admin/CollegeAdminReports';
import CollegeAdminNotifications from '../pages/admin/CollegeAdminNotifications';

const CollegeAdminRouter = () => {
  return (
    <CollegeAdminLayout>
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
    </CollegeAdminLayout>
  );
};

export default CollegeAdminRouter;
