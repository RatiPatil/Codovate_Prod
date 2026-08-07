import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GlobalLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#F8FAFC] gap-4">
    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const PublicOnlyRoute = ({ children }) => {
  const { user, token, loading: authLoading } = useAuth();

  if (authLoading) {
    return <GlobalLoader />;
  }

  if (token) {
    const isAdmin = user?.role && user.role !== 'student';
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
