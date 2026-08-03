import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';

const GlobalLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#F8FAFC] gap-4">
    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ 
  children, 
  requireOnboarding = true,
  requiredRole = null,
  requiredPermission = null
}) => {
  const { user, token, loading: authLoading, onboardingCompleted } = useAuth();
  const { hasRole, hasPermission, loading: roleLoading } = useRole();
  const location = useLocation();

  if (authLoading || (token && roleLoading && !user?.role)) {
    return <GlobalLoader />;
  }

  if (!token) {
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin-login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Admin users (and non-student system roles) bypass student onboarding
  const isAdmin = user?.role && user.role !== 'student';

  if (requireOnboarding && onboardingCompleted === false && !isAdmin) {
    if (location.pathname === '/onboarding') return children;
    return <Navigate to="/onboarding" replace />;
  }

  // If user has already completed onboarding and tries to access /onboarding or /onboarding-success
  if (!requireOnboarding && onboardingCompleted === true && (location.pathname === '/onboarding' || location.pathname === '/onboarding-success')) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  // Check specific role requirement if passed to the route
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  // Check specific permission requirement if passed to the route
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return children;
};

export default ProtectedRoute;