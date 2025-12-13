import axios from '@/config/axiosConfig';
import { AxiosError } from 'axios';
import { BookingPlanRequest, BookingPlanResponse, BookingPlansResponse, UpdateBookingPlanResponse, DeleteBookingPlanResponse } from '@/pages/TutorPages/Schedule/type';

const BASE_URL = '/tutor/booking-plan';

const handleApiError = (error: unknown): never => {
  if (error instanceof AxiosError) {
    const axiosError = error as AxiosError;

    // Network error
    if (!axiosError.response) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }

    // Server error responses
    const status = axiosError.response.status;
    const responseData = axiosError.response.data as any;

    // Check for specific database deadlock error
    if (responseData?.message && responseData.message.includes('Deadlock found')) {
      throw new Error('Hệ thống đang bận, vui lòng thử lại sau vài giây.');
    }

    if (responseData?.message && responseData.message.includes('Tutor schedule conflict at this time')) {
      throw new Error('Lịch làm việc bị trùng lặp thời gian hoặc ngày đã có lịch.');
    }

    switch (status) {
      case 400:
        throw new Error(responseData?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
      case 401:
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      case 403:
        throw new Error('Bạn không có quyền thực hiện thao tác này.');
      case 404:
        throw new Error('Không tìm thấy dữ liệu yêu cầu.');
      case 409:
        throw new Error(responseData?.message || 'Dữ liệu đã tồn tại hoặc xung đột.');
      case 422:
        throw new Error(responseData?.message || 'Dữ liệu không đúng định dạng yêu cầu.');
      case 500:
        throw new Error('Lỗi máy chủ nội bộ. Vui lòng thử lại sau.');
      case 503:
        throw new Error('Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.');
      default:
        throw new Error(responseData?.message || `Có lỗi xảy ra (${status}). Vui lòng thử lại.`);
    }
  }

  // Generic error
  throw new Error('Có lỗi không xác định xảy ra. Vui lòng thử lại.');
};

export const bookingPlanApi = {
  // Create a new booking plan with retry logic for deadlocks
  createBookingPlan: async (data: BookingPlanRequest, retryCount = 0): Promise<BookingPlanResponse> => {
    const maxRetries = 3;
    const retryDelay = 1000 + (retryCount * 500); // Increasing delay: 1s, 1.5s, 2s

    try {
      const response = await axios.post<BookingPlanResponse>(BASE_URL, data);
      return response.data;
    } catch (error) {
      // Check if it's a deadlock error and we haven't exceeded max retries
      if (error instanceof AxiosError &&
        error.response?.data?.message?.includes('Deadlock found') &&
        retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return bookingPlanApi.createBookingPlan(data, retryCount + 1);
      }

      return handleApiError(error);
    }
  },

  getBookingPlans: async (): Promise<BookingPlansResponse> => {
    try {
      const response = await axios.get<BookingPlansResponse>('/tutor/booking-plan/me');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateBookingPlan: async (bookingPlanId: number, data: BookingPlanRequest): Promise<UpdateBookingPlanResponse> => {
    try {
      const response = await axios.put<UpdateBookingPlanResponse>(`/tutor/booking-plan/${bookingPlanId}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteBookingPlan: async (bookingPlanId: number): Promise<DeleteBookingPlanResponse> => {
    try {
      const response = await axios.delete<DeleteBookingPlanResponse>(`/tutor/booking-plan/${bookingPlanId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
