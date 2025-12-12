import { useState, useCallback } from 'react';
import { User } from '../types';
import { userManagementApi } from '../api';

/**
 * Custom hook for managing user deletion operations
 * Requirements: 2.1, 2.2, 2.3, 2.4 - manage delete operation state, confirmation flow, optimistic updates with rollback
 */
export const useDeleteUser = () => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Delete user with optimistic updates and rollback on failure
   * Requirements: 2.2, 2.3, 2.4 - handle delete success and error scenarios
   * 
   * @param userID - ID of the user to delete
   * @param onOptimisticUpdate - Callback to remove user from UI immediately
   * @param onRollback - Callback to restore user in UI if deletion fails
   */
  const deleteUser = useCallback(async (
    userID: number,
    onOptimisticUpdate?: (userID: number) => void,
    onRollback?: (user: User) => void,
    userToDelete?: User
  ): Promise<void> => {
    setIsDeleting(true);
    setError(null);
    
    console.log('🗑️ useDeleteUser: Starting deletion for user:', userID);
    
    // Optimistic update - remove user from UI immediately
    if (onOptimisticUpdate) {
      onOptimisticUpdate(userID);
      console.log('✨ useDeleteUser: Optimistic update applied');
    }
    
    try {
      // Call API to delete user
      await userManagementApi.deleteUser(userID);
      
      console.log('✅ useDeleteUser: User deleted successfully');
      // Success - no error to throw
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to deactivate user';
      setError(errorMessage);
      console.error('❌ useDeleteUser: Error deactivating user:', errorMessage);
      
      // Rollback optimistic update - restore user in UI
      if (onRollback && userToDelete) {
        onRollback(userToDelete);
        console.log('🔄 useDeleteUser: Rollback applied');
      }
      
      // Re-throw error so calling component can handle it
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  /**
   * Clear any existing error state
   * Useful for resetting error state before new operations
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isDeleting,
    error,
    deleteUser,
    clearError,
  };
};

export default useDeleteUser;