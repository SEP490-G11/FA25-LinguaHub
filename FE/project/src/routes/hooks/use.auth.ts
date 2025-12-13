import { useUser } from '@/contexts/UserContext';

/**
 * Custom hook for authentication
 * Provides user authentication state and utilities
 */
export const useAuth = () => {
  const { user, loading, refreshUser } = useUser();
  
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'Admin';
  const isTutor = user?.role === 'Tutor';
  const isLearner = user?.role === 'Learner';
  
  return {
    data: {
      session: user ? { user } : null,
      user,
    },
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isTutor,
    isLearner,
    refreshUser,
  };
};
