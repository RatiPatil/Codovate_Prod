import { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Lazy load all ecosystem dashboards to prevent downloading unnecessary code
const SuperAdminRouter = lazy(() => import('./SuperAdminRouter'));
const CollegeAdminRouter = lazy(() => import('./CollegeAdminRouter'));
const CompanyAdminRouter = lazy(() => import('./CompanyAdminRouter'));
const MentorDashboard = lazy(() => import('./dashboards/MentorDashboard'));

const Loader = () => (
  <div className="flex items-center justify-center h-screen bg-[#050510]">
    <div className="w-8 h-8 border-2 border-[#2015FF] border-t-transparent rounded-full animate-spin" />
  </div>
);

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/admin-login" replace />;

  const getDashboard = () => {
    switch (user.role) {
      case 'super_admin':
      case 'admin':
        return <SuperAdminRouter />;
      case 'college_admin':
        return <CollegeAdminRouter />;
      case 'company_admin':
        return <CompanyAdminRouter />;
      case 'mentor':
        return <MentorDashboard />;
      default:
        // If a non-admin role tries to access this router, kick them to the student login
        return <Navigate to="/login" replace />;
    }
  };

  return (
    <Suspense fallback={<Loader />}>
      {getDashboard()}
    </Suspense>
  );
};

export default DashboardRouter;
