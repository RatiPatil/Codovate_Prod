import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { user, token, loading, onboardingCompleted } = useAuth();

  const location = useLocation();

  if (loading || (token && onboardingCompleted === null)) {
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

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'college_admin' || user?.role === 'company_admin' || user?.role === 'mentor';

  if (requireOnboarding && onboardingCompleted === false && !isAdmin) {
    return <Navigate to="/onboarding" replace />;
  }

  // If they are on the onboarding page but already completed it, kick them to dashboard
  if (!requireOnboarding && onboardingCompleted === true && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;