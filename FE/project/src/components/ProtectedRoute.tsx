import { Navigate } from 'react-router-dom';
import { useUserInfo } from '@/hooks/useUserInfo';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Admin' | 'Tutor' | 'Learner')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useUserInfo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  if (!user) {
    return <Navigate to={ROUTES.SIGN_IN} replace />;
  }


  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }


  return <>{children}</>;
};
