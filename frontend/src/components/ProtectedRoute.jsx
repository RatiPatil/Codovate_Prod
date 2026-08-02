import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';

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
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin-login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Admin users (and new system roles) bypass onboarding
  const isAdmin = user?.role && user.role !== 'student';

  if (requireOnboarding && onboardingCompleted === false && !isAdmin) {
    if (location.pathname === '/onboarding') return children;
    return <Navigate to="/onboarding" replace />;
  }

  // Check specific role requirement if passed to the route
  if (requiredRole && !hasRole(requiredRole)) {
    // If they are not allowed, redirect to their default dashboard
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  // Check specific permission requirement if passed to the route
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  // If they are on the onboarding page but already completed it, kick them to dashboard
  if (!requireOnboarding && onboardingCompleted === true && (location.pathname === '/onboarding' || location.pathname === '/onboarding-success')) {
    // return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;