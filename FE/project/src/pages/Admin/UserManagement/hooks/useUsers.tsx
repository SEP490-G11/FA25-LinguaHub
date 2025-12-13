import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { User } from '../types';
import { userManagementApi } from '../api';

/**
 * Custom hook for managing user list data
 * Requirements: 1.1, 1.5, 4.1 - manage users state, loading, error states and provide refresh functionality
 */
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetch users from API
   * Handles loading states and error recovery
   */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedUsers = await userManagementApi.getUsers();
      
      setUsers(fetchedUsers);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load users';
      setError(errorMessage);
      
      // Show error toast for refresh operations (not initial load)
      if (!loading) {
        toast({
          title: "Failed to refresh users",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh function to reload user data
   * Requirement 1.5 - provide refresh functionality for user list
   */
  const refresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Update users list after external changes (e.g., after deletion)
   * Used by other hooks to maintain data consistency
   */
  const updateUsers = useCallback((updatedUsers: User[]) => {
    setUsers(updatedUsers);
  }, []);

  /**
   * Remove a user from the local state (for optimistic updates)
   */
  const removeUser = useCallback((userID: number) => {
    setUsers(prevUsers => prevUsers.filter(user => user.userID !== userID));
  }, []);

  /**
   * Add a user back to the local state (for rollback on failure)
   */
  const addUser = useCallback((user: User) => {
    setUsers(prevUsers => [...prevUsers, user]);
  }, []);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refresh,
    updateUsers,
    removeUser,
    addUser,
  };
};

export default useUsers;