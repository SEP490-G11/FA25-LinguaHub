import axios from '@/config/axiosConfig';
import { User, UsersResponse, DeleteUserResponse } from './types';

/**
 * Admin API for User Management
 * Following the same pattern as TutorApproval API
 */
export const userManagementApi = {
  /**
   * Get all users from the system
   * Endpoint: GET /users
   * Requirements: 1.1, 1.3 - retrieve all user records with proper error handling
   */
  getUsers: async (): Promise<User[]> => {
    try {
      // Backend endpoint: GET /users
      const response = await axios.get<UsersResponse>('/users');
      
      // Check if response indicates success (code 0)
      if (response?.data?.code !== 0) {
        throw new Error(response?.data?.message || 'Failed to fetch users');
      }
      
      // Backend returns array in result field
      const backendData = response?.data?.result || [];
      
      // Ensure it's an array
      if (!Array.isArray(backendData)) {
        throw new Error('Invalid response format: expected array of users');
      }
      
      // Transform backend data to match User interface
      const users: User[] = backendData.map((item: any) => ({
        userID: item.userID || 0,
        username: item.username || '',
        email: item.email || '',
        fullName: item.fullName || '',
        avatarURL: item.avatarURL || '',
        gender: item.gender || '',
        dob: item.dob || '',
        phone: item.phone || '',
        country: item.country || '',
        address: item.address || '',
        bio: item.bio || '',
        isActive: Boolean(item.isActive),
        role: item.role || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }));

      return users;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch users'
      );
    }
  },

  /**
   * Delete a specific user by userID
   * Endpoint: DELETE /users/{userID}
   * Requirements: 2.2, 2.3, 2.4 - delete user with proper error handling
   */
  deleteUser: async (userID: number): Promise<void> => {
    try {
      // Backend endpoint: DELETE /users/{userID}
      const response = await axios.delete<DeleteUserResponse>(`/users/${userID}`);
      
      // Check if response indicates success (code 0)
      if (response?.data?.code !== 0) {
        throw new Error(response?.data?.message || 'Failed to delete user');
      }
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to delete user'
      );
    }
  },
};

export default userManagementApi;