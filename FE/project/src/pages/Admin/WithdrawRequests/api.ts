import axios from '@/config/axiosConfig';
import { WithdrawRequest, ApiResponse } from './types';

/**
 * Admin API for Withdraw Requests Management
 */
export const withdrawRequestApi = {
  /**
   * Get all withdrawal requests from tutors
   * GET /admin/withdraw/all
   */
  getAllWithdrawRequests: async (): Promise<WithdrawRequest[]> => {
    try {
      const response = await axios.get('/admin/withdraw/all');
      
      // Handle different response structures
      const data = response?.data?.result || response?.data || [];
      
      // Ensure we return an array
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      
      // Handle specific error cases
      if (error?.response?.status === 403) {
        throw new Error('You do not have permission to view withdrawal requests');
      }
      
      // Network or other errors
      if (!error?.response) {
        throw new Error('Network error: Unable to connect to server');
      }
      
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch withdrawal requests'
      );
    }
  },

  /**
   * Approve a withdrawal request
   * PUT /admin/withdraw/{id}/approve
   */
  approveWithdrawRequest: async (withdrawId: number): Promise<ApiResponse> => {
    try {
      await axios.put(`/admin/withdraw/${withdrawId}/approve`);
      
      return {
        success: true,
        message: 'Withdrawal request approved successfully',
      };
    } catch (error: any) {
      
      // Handle specific error cases
      if (error?.response?.status === 404) {
        throw new Error('Withdrawal request not found or already processed');
      }
      
      if (error?.response?.status === 403) {
        throw new Error('You do not have permission to approve this withdrawal request');
      }
      
      if (error?.response?.status === 409) {
        throw new Error('Withdrawal request has already been processed');
      }
      
      // Network or other errors
      if (!error?.response) {
        throw new Error('Network error: Unable to approve withdrawal request');
      }
      
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to approve withdrawal request'
      );
    }
  },

  /**
   * Reject a withdrawal request
   * PUT /admin/withdraw/{id}/reject
   */
  rejectWithdrawRequest: async (withdrawId: number): Promise<ApiResponse> => {
    try {
      await axios.put(`/admin/withdraw/${withdrawId}/reject`);
      
      return {
        success: true,
        message: 'Withdrawal request rejected successfully',
      };
    } catch (error: any) {
      
      // Handle specific error cases
      if (error?.response?.status === 404) {
        throw new Error('Withdrawal request not found or already processed');
      }
      
      if (error?.response?.status === 403) {
        throw new Error('You do not have permission to reject this withdrawal request');
      }
      
      if (error?.response?.status === 409) {
        throw new Error('Withdrawal request has already been processed');
      }
      
      // Network or other errors
      if (!error?.response) {
        throw new Error('Network error: Unable to reject withdrawal request');
      }
      
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to reject withdrawal request'
      );
    }
  },
};

export default withdrawRequestApi;
