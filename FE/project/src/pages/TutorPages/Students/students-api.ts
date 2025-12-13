import axios from '@/config/axiosConfig';
import {
  ApiResponse,
  CourseStudent,
  CourseStudentDetail,
  BookingStudent,
} from './types';

export const studentsApi = {
  /**
   * Get all course students for the authenticated tutor
   * @returns Promise<CourseStudent[]>
   * @throws Error if the API request fails
   */
  getCourseStudents: async (): Promise<CourseStudent[]> => {
    try {
      const response = await axios.get<ApiResponse<CourseStudent[]>>(
        '/api/tutors/students'
      );
      return response.data.result;
    } catch (error) {
      console.error('Error fetching course students:', error);
      throw error;
    }
  },

  /**
   * Get detailed information for a specific course student
   * @param studentId - The ID of the student
   * @returns Promise<CourseStudentDetail>
   * @throws Error if the API request fails
   */
  getCourseStudentDetail: async (
    studentId: number
  ): Promise<CourseStudentDetail> => {
    try {
      const response = await axios.get<ApiResponse<CourseStudentDetail>>(
        `/api/tutors/students/${studentId}`
      );
      return response.data.result;
    } catch (error) {
      console.error('Error fetching course student detail:', error);
      throw error;
    }
  },

  /**
   * Get all booking students for the authenticated tutor
   * @returns Promise<BookingStudent[]>
   * @throws Error if the API request fails
   */
  getBookingStudents: async (): Promise<BookingStudent[]> => {
    try {
      const response = await axios.get<ApiResponse<BookingStudent[]>>(
        '/api/tutors/booking-students'
      );
      return response.data.result;
    } catch (error) {
      console.error('Error fetching booking students:', error);
      throw error;
    }
  },
};
