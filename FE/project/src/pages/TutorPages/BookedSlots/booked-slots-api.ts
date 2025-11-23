import axios from '@/config/axiosConfig';
import { AxiosError } from 'axios';
import { BookedSlotsResponse, BookedSlot } from './types';

const handleApiError = (error: unknown): never => {
  // Log error to console for debugging
  console.error('[BookedSlots API Error]:', error);
  
  if (error instanceof AxiosError) {
    const axiosError = error as AxiosError;
    
    // Network error
    if (!axiosError.response) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
    
    // Server error responses
    const status = axiosError.response.status;
    const responseData = axiosError.response.data as any;
    
    switch (status) {
      case 401:
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      case 403:
        throw new Error('Bạn không có quyền xem thông tin này.');
      case 404:
        throw new Error('Không tìm thấy dữ liệu.');
      case 500:
        throw new Error('Lỗi máy chủ nội bộ. Vui lòng thử lại sau.');
      default:
        throw new Error(responseData?.message || `Có lỗi xảy ra (${status}). Vui lòng thử lại.`);
    }
  }
  
  // Generic error
  throw new Error('Có lỗi không xác định xảy ra. Vui lòng thử lại.');
};

export const bookedSlotsApi = {
  getMySlots: async (): Promise<BookedSlot[]> => {
    try {
      const response = await axios.get<BookedSlotsResponse>('/booking-slots/my-slots');
      
      // API returns code 1000 for success
      if (response.data.code === 1000) {
        return response.data.result;
      }
      
      throw new Error(response.data.message || 'Lỗi khi tải dữ liệu');
    } catch (error) {
      return handleApiError(error);
    }
  }
};
