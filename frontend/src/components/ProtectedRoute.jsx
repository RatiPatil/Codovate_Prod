import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { token, loading, onboardingCompleted } = useAuth();

  if (loading || (token && onboardingCompleted === null)) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  if (requireOnboarding && onboardingCompleted === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;