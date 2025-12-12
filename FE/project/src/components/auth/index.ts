// Export all authentication-related components and hooks
export { RequireAuth } from './RequireAuth';
export { useAuth } from '@/routes/hooks/use.auth';
export { 
  ProtectedRoute, 
  AdminRoute, 
  TutorRoute, 
  LearnerRoute, 
  PublicOrLearnerRoute 
} from '@/routes/ProtectedRoute';
