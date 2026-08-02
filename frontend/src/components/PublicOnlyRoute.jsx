import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GlobalLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#050510] gap-4">
    <div className="w-8 h-8 border-2 border-[#2015FF] border-t-transparent rounded-full animate-spin" />
  </div>
);

/**
 * PublicOnlyRoute — Restricts access to public-only pages (Home, Login, Signup) for logged-in users.
 * Redirects logged-in students to /dashboard (or /onboarding if incomplete).
 */
const PublicOnlyRoute = ({ children }) => {
  const { user, token, loading: authLoading, onboardingCompleted } = useAuth();

  if (authLoading) {
    return <GlobalLoader />;
  }

  if (token) {
    const isAdmin = user?.role && user.role !== 'student';
    if (onboardingCompleted === false && !isAdmin) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
