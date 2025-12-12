import axios from '@/config/axiosConfig';
import { getTutorIdFromToken } from '@/utils/jwt-decode';
import { WithdrawalRequestPayload, WithdrawalResponse } from './types';

export const withdrawalApi = {
  createWithdrawal: async (data: WithdrawalRequestPayload): Promise<WithdrawalResponse> => {
    // Extract tutorId from JWT token
    const tutorId = getTutorIdFromToken();
    
    // Validate tutorId exists
    if (!tutorId) {
      throw new Error('Không tìm thấy thông tin tutor. Vui lòng đăng nhập lại.');
    }

    try {
      // Call backend API with tutorId as query parameter
      const response = await axios.post(
        '/tutor/withdraw/request',
        data,
        {
          params: { tutorId }
        }
      );
      
      // Handle different response structures
      const result = response.data?.result ?? response.data;
      
      return result;
    } catch (error: any) {
      // Handle backend error responses
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      // Handle network errors
      if (error.message) {
        throw new Error(error.message);
      }
      
      // Fallback error message
      throw new Error('Không thể kết nối đến server. Vui lòng thử lại.');
    }
  },

  getBalance: async (): Promise<number> => {
    // Extract tutorId from JWT token
    const tutorId = getTutorIdFromToken();
    
    // Validate tutorId exists
    if (!tutorId) {
      throw new Error('Không tìm thấy thông tin tutor. Vui lòng đăng nhập lại.');
    }

    try {
      // Call backend API with tutorId as query parameter
      const response = await axios.get('/tutor/withdraw/balance', {
        params: { tutorId }
      });
      
      // Response returns a string number like "943200.0000"
      const balanceString = response.data?.result ?? response.data;
      
      // Convert string to number
      const numericBalance = parseFloat(balanceString);
      
      if (isNaN(numericBalance)) {
        console.error('Invalid balance response:', response.data);
        throw new Error('Dữ liệu số dư không hợp lệ');
      }
      
      return numericBalance;
    } catch (error: any) {
      // Handle backend error responses
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      // Handle network errors
      if (error.message) {
        throw new Error(error.message);
      }
      
      // Fallback error message
      throw new Error('Không thể lấy thông tin số dư. Vui lòng thử lại.');
    }
  },
};
