import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/use.auth';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
  requiredRole?: 'Admin' | 'Tutor' | 'Learner';
  redirectTo?: string;
}

/**
 * Protected Route Component
 * 
 * Bảo vệ routes dựa trên authentication và role.
 * Redirect người dùng chưa đăng nhập về trang đăng nhập.
 * Redirect người dùng không đúng role về trang phù hợp.
 * 
 * @param requiredRole - Role yêu cầu để truy cập route này
 * @param redirectTo - Đường dẫn redirect tùy chỉnh
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredRole,
  redirectTo 
}) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Hiển thị loading khi đang kiểm tra authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Redirect về trang đăng nhập nếu chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to={redirectTo || ROUTES.SIGN_IN} replace />;
  }

  // Kiểm tra role nếu được chỉ định
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect về dashboard phù hợp dựa trên role thực tế
    if (user?.role === 'Admin') {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    } else if (user?.role === 'Tutor') {
      return <Navigate to={ROUTES.TUTOR_DASHBOARD} replace />;
    } else {
      return <Navigate to={redirectTo || ROUTES.HOME} replace />;
    }
  }

  // User đã đăng nhập và có đúng role
  return <Outlet />;
};

/**
 * Admin-only Protected Route
 * Route chỉ dành cho Admin
 */
export const AdminRoute: React.FC = () => {
  return <ProtectedRoute requiredRole="Admin" />;
};

/**
 * Tutor-only Protected Route
 * Route chỉ dành cho Tutor
 */
export const TutorRoute: React.FC = () => {
  return <ProtectedRoute requiredRole="Tutor" />;
};

/**
 * Learner-only Protected Route
 * Route chỉ dành cho Learner
 */
export const LearnerRoute: React.FC = () => {
  return <ProtectedRoute requiredRole="Learner" />;
};

/**
 * Public or Learner Route
 * Cho phép guest (chưa đăng nhập) và Learner truy cập
 * Redirect Tutor và Admin về dashboard của họ
 */
export const PublicOrLearnerRoute: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();

  // Hiển thị loading khi đang kiểm tra authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Cho phép người dùng chưa đăng nhập (guest)
  if (!isAuthenticated) {
    return <Outlet />;
  }

  // Redirect Tutor và Admin về dashboard của họ
  if (user?.role === 'Admin') {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  } else if (user?.role === 'Tutor') {
    return <Navigate to={ROUTES.TUTOR_DASHBOARD} replace />;
  }

  // Cho phép Learner
  return <Outlet />;
};
