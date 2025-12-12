import axios from '@/config/axiosConfig';
import { PendingCourse, CourseDetail, PaginatedResponse, ApprovalFilters, CourseChangeData } from './types';

/**
 * Admin API for Course Approval Management
 */
export const courseApprovalApi = {
  /**
   * Get pending courses (only live courses with Pending status, NOT draft updates)
   */
  getPendingCourses: async (
    page: number = 1,
    limit: number = 10,
    filters?: ApprovalFilters
  ): Promise<PaginatedResponse<PendingCourse>> => {
    try {
      // Fetch only live pending courses (NOT draft courses)
      const liveCoursesResponse = await axios.get('/admin/courses/by-status', { 
        params: { status: 'Pending' } 
      });

      const liveCourses = liveCoursesResponse?.data?.result || [];

      // Map to PendingCourse format (only live courses)
      let allCourses: PendingCourse[] = liveCourses.map((course: any) => {
        return {
          id: course.id, // AdminCourseResponse uses 'id' field
          title: course.title,
          shortDescription: course.shortDescription || '',
          description: course.description || '',
          requirement: course.requirement || '',
          level: course.level || 'BEGINNER',
          categoryID: 0, // Not provided in response
          categoryName: course.categoryName || 'Unknown',
          language: course.language || 'English',
          duration: course.duration || 0,
          price: course.price || 0,
          thumbnailURL: course.thumbnailURL || '',
          status: 'Pending', // Live courses have "Pending" status
          tutorID: 0, // Not provided in response
          tutorName: course.tutorName,
          tutorEmail: course.tutorEmail,
          createdAt: course.createdAt || new Date().toISOString(),
          updatedAt: course.updatedAt || new Date().toISOString(),
          isDraft: false,
        };
      });

      // Apply filters
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        allCourses = allCourses.filter(
          (course) =>
            course.title.toLowerCase().includes(searchLower) ||
            course.tutorName?.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.categoryID) {
        allCourses = allCourses.filter(
          (course) => course.categoryID === filters.categoryID
        );
      }

      // Sort by createdAt (newest first)
      allCourses.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply pagination
      const total = allCourses.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedCourses = allCourses.slice(startIndex, startIndex + limit);

      return {
        data: paginatedCourses,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error: any) {
      console.error('❌ Error fetching pending courses:', error);
      
      // Handle specific error cases
      if (error?.response?.status === 403) {
        throw new Error('You do not have permission to view pending courses');
      }
      
      // Network or other errors
      if (!error?.response) {
        throw new Error('Network error: Unable to fetch pending courses');
      }
      
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch pending courses'
      );
    }
  },

  /**
   * Get full course details including sections, lessons, and objectives
   */
  getCourseDetail: async (courseId: number, isDraft: boolean = false): Promise<CourseDetail> => {
    try {
      const endpoint = isDraft
        ? `/admin/courses/drafts/${courseId}/detail`
        : `/admin/courses/${courseId}/detail`;
      
      const response = await axios.get(endpoint);
      const data = response?.data?.result || response?.data || {};

      // Map objectives from string[] to Objective[]
      const objectives = (data.objectives || []).map((text: string, index: number) => ({
        objectiveID: index + 1,
        objectiveText: text,
        orderIndex: index,
      }));

      // Map response to CourseDetail format
      return {
        id: data.id || courseId, // AdminCourseDetailResponse uses 'id' field
        title: data.title,
        shortDescription: data.shortDescription || '',
        description: data.description || '',
        requirement: data.requirement || '',
        level: data.level || 'BEGINNER',
        categoryID: 0, // Not provided in response
        categoryName: data.categoryName,
        language: data.language || 'English',
        duration: data.duration || 0,
        price: data.price || 0,
        thumbnailURL: data.thumbnailURL || '',
        status: data.status || 'Pending',
        tutorID: 0, // Not provided in response
        tutorName: data.tutorName,
        tutorEmail: data.tutorEmail,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        section: data.section || data.sections || [],
        objectives: objectives,
        adminNotes: data.adminReviewNote,
        adminReviewNote: data.adminReviewNote,
        rejectionReason: data.adminReviewNote,
        isDraft: data.draft || isDraft,
        totalRatings: data.totalRatings ?? 0,
        avgRating: data.avgRating ?? 0,
        learnerCount: data.learnerCount ?? 0,
      };
    } catch (error: any) {
      console.error('❌ Error fetching course detail:', error);
      
      // Handle specific error cases
      if (error?.response?.status === 404) {
        throw new Error('Course not found or has been already processed');
      }
      
      if (error?.response?.status === 403) {
        throw new Error('You do not have permission to view this course');
      }
      
      // Network or other errors
      if (!error?.response) {
        throw new Error('Network error: Unable to fetch course details');
      }
      
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch course details'
      );
    }
  },

  /**
   * Approve a pending course (live or draft)
   */
  approveCourse: async (
    courseId: number,
    isDraft: boolean = false,
    adminNotes?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const endpoint = isDraft
        ? `/admin/courses/drafts/${courseId}/approve`
        : `/admin/courses/${courseId}/approve`;

      const payload = adminNotes ? { note: adminNotes } : {};
      await axios.post(endpoint, payload);

      return {
        success: true,
        message: 'Course approved successfully',
      };
    } catch (error: any) {
      console.error('❌ Error approving course:', error);
      
      // Handle specific error cases
      if (error?.response?.status === 404) {
        throw new Error('Course not found or has already been processed');
      }
      
      if (error?.response?.status === 403) {
        throw new Error('You do not have permission to approve this course');
      }
      
      if (error?.response?.status === 409) {
        throw new Error('Course has already been approved or rejected');
      }
      
      // Network or other errors
      if (!error?.response) {
        throw new Error('Network error: Unable to approve course');
      }
      
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to approve course'
      );
    }
  },

  /**
   * Reject a pending course with reason (live or draft)
   */
  rejectCourse: async (
    courseId: number,
    isDraft: boolean = false,
    rejectionReason: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const endpoint = isDraft
        ? `/admin/courses/drafts/${courseId}/reject`
        : `/admin/courses/${courseId}/reject`;

      await axios.post(endpoint, { note: rejectionReason });

      return {
        success: true,
        message: 'Course rejected successfully',
      };
    } catch (error: any) {
      console.error('❌ Error rejecting course:', error);
      
      // Handle specific error cases
      if (error?.response?.status === 404) {
        throw new Error('Course not found or has already been processed');
      }
      
      if (error?.response?.status === 403) {
        throw new Error('You do not have permission to reject this course');
      }
      
      if (error?.response?.status === 409) {
        throw new Error('Course has already been approved or rejected');
      }
      
      // Network or other errors
      if (!error?.response) {
        throw new Error('Network error: Unable to reject course');
      }
      
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to reject course'
      );
    }
  },

  /**
   * Get change comparison between original course and draft
   */
  getDraftChanges: async (draftID: number): Promise<CourseChangeData> => {
    try {
      const response = await axios.get(`/admin/courses/drafts/${draftID}/changes`);
      const data = response?.data?.result || response?.data || {};

      return {
        courseId: data.courseId || 0,
        draftId: data.draftId || draftID,
        courseChanges: data.courseChanges || [],
        objectives: data.objectives || [],
        sections: data.sections || [],
        lessons: data.lessons || [],
        resources: data.resources || [],
      };
    } catch (error: any) {
      console.error('❌ Error fetching draft changes:', error);
      
      // Handle specific error cases
      if (error?.response?.status === 404) {
        throw new Error('Draft not found or has been already processed');
      }
      
      if (error?.response?.status === 403) {
        throw new Error('You do not have permission to view this draft');
      }
      
      // Network or other errors
      if (!error?.response) {
        throw new Error('Network error: Unable to fetch draft changes');
      }
      
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch draft changes'
      );
    }
  },
};

export default courseApprovalApi;
