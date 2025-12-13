import api from '@/config/axiosConfig';
import { SectionData } from '../pages/CreateCourse/course-api';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface PendingCourse {
  id: string;
  courseId: string;
  title: string;
  description: string;
  category_id: string;
  category?: { id: string; name: string };
  tutor_id: string;
  tutor?: { id: string; name: string; email: string };
  status: 'pending' | 'published' | 'rejected';
  thumbnail?: string;
  created_at: string;
  duration_hours: number;
  price_vnd: number;
  languages?: string[];
}

export interface CourseDetail extends PendingCourse {
  sections?: SectionData[];
  admin_notes?: string;
  rejection_reason?: string;
}

export interface ApprovalPayload {
  status: 'published' | 'rejected';
  admin_notes?: string;
  rejection_reason?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// API METHODS
// ============================================================================

export const adminApi = {
  /**
   * Fetch pending courses with pagination and filtering
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @param filters - Search and category filters
   * @returns Paginated list of pending courses
   */
  getPendingCourses: async (
    page: number = 1,
    limit: number = 10,
    filters?: { search?: string; category_id?: string }
  ): Promise<PaginatedResponse<PendingCourse>> => {
    try {
      const params = {
        status: 'pending',
        page,
        limit,
        ...filters,
      };

      console.log('📤 Fetching pending courses:', params);

      const response = await api.get('/courses', { params });
      
      // Handle different response formats
      const data = response?.data || response || {};

      console.log('✅ Pending courses fetched:', data);

      return {
        data: Array.isArray(data) ? data : data.data || [],
        total: data.total || 0,
        page: data.page || page,
        limit: data.limit || limit,
        totalPages: data.totalPages || Math.ceil((data.total || 0) / limit),
      };
    } catch (error: any) {
      console.error('❌ Error fetching pending courses:', error);
      const message =
        error?.response?.data?.message ||
        error.message ||
        'Failed to fetch pending courses';
      throw new Error(message);
    }
  },

  /**
   * Get full course details including sections and lessons
   * @param courseId - Course ID to fetch
   * @returns Complete course details
   */
  getCourseDetail: async (courseId: string): Promise<CourseDetail> => {
    try {
      console.log('📤 Fetching course detail:', courseId);

      const response = await api.get(`/courses/${courseId}`);
      const data = response?.data || response || {};

      console.log('✅ Course detail fetched:', data);

      return data;
    } catch (error: any) {
      console.error('❌ Error fetching course detail:', error);
      const message =
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch course details';
      throw new Error(message);
    }
  },

  /**
   * Approve a pending course (change status to published)
   * @param courseId - Course ID to approve
   * @param adminNotes - Optional notes for the tutor
   * @returns Success response
   */
  approveCourse: async (
    courseId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('📤 Approving course:', courseId);

      const payload: ApprovalPayload = {
        status: 'published',
        admin_notes: adminNotes,
      };

      const response = await api.patch(`/courses/${courseId}`, payload);
      
      console.log('✅ Course approved:', response);

      return {
        success: true,
        message: 'Course approved successfully',
      };
    } catch (error: any) {
      console.error('❌ Error approving course:', error);
      const message =
        error?.response?.data?.message || 
        error.message || 
        'Failed to approve course';
      throw new Error(message);
    }
  },

  /**
   * Reject a pending course with reason
   * @param courseId - Course ID to reject
   * @param rejectionReason - Reason for rejection (will be sent to tutor)
   * @returns Success response
   */
  rejectCourse: async (
    courseId: string,
    rejectionReason: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('📤 Rejecting course:', courseId);

      const payload: ApprovalPayload = {
        status: 'rejected',
        rejection_reason: rejectionReason,
      };

      const response = await api.patch(`/courses/${courseId}`, payload);
      
      console.log('✅ Course rejected:', response);

      return {
        success: true,
        message: 'Course rejected successfully',
      };
    } catch (error: any) {
      console.error('❌ Error rejecting course:', error);
      const message =
        error?.response?.data?.message || 
        error.message || 
        'Failed to reject course';
      throw new Error(message);
    }
  },
};

export default adminApi;
