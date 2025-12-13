import axios from '@/config/axiosConfig';
import { getTutorIdFromToken } from '@/utils/jwt-decode';
import { WithdrawalHistoryItem } from './types';

export const withdrawalHistoryApi = {
  getMyWithdrawals: async (): Promise<WithdrawalHistoryItem[]> => {
    // Extract tutorId from JWT token
    const tutorId = getTutorIdFromToken();
    
    if (!tutorId) {
      throw new Error('Không tìm thấy thông tin tutor. Vui lòng đăng nhập lại.');
    }

    try {
      // Call backend API with tutorId as query parameter
      const response = await axios.get('/tutor/withdraw/history', {
        params: { tutorId }
      });

      // Return the result array from response
      return Array.isArray(response?.data?.result)
        ? response.data.result
        : Array.isArray(response?.data)
        ? response.data
        : [];
    } catch (error: any) {
      if (error.response) {
        const message = error.response.data?.message;
        throw new Error(message || 'Không thể tải lịch sử rút tiền');
      }
      throw new Error('Không thể kết nối đến server');
    }
  },
};
