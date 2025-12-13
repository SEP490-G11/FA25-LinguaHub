import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/routes/hooks/use.auth';
import { ROUTES } from '@/constants/routes';
import { ReactNode } from 'react';

interface RequireAuthProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Component wrapper để bảo vệ nội dung cần authentication
 * Cách dùng: <RequireAuth><YourComponent /></RequireAuth>
 * 
 * Sẽ redirect về trang đăng nhập nếu chưa đăng nhập,
 * và lưu lại trang đích để redirect sau khi đăng nhập
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  redirectTo = ROUTES.SIGN_IN 
}) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Lưu lại trang họ đang cố truy cập
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
