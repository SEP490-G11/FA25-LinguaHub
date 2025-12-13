import axios from '@/config/axiosConfig';
import type { Course } from './types';

export const coursesApi = {
  // Get all courses
  getAllCourses: async (): Promise<Course[]> => {
    try {
      const response = await axios.get('/admin/courses');
      return response?.data?.result || response?.data || [];
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch courses'
      );
    }
  },

  // Get courses by status
  getCoursesByStatus: async (status: string): Promise<Course[]> => {
    try {
      const response = await axios.get('/admin/courses/by-status', {
        params: { status }
      });
      return response?.data?.result || response?.data || [];
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch courses by status'
      );
    }
  },

  // Get course detail
  getCourseDetail: async (courseId: string): Promise<Course> => {
    try {
      const response = await axios.get(`/admin/courses/${courseId}/detail`);
      const data = response?.data?.result || response?.data || {};
      
      // Map objectives from string[] to Objective[]
      const objectives = (data.objectives || []).map((text: string, index: number) => ({
        objectiveID: index + 1,
        objectiveText: text,
        orderIndex: index,
      }));

      return {
        ...data,
        objectives,
        courseID: data.id || courseId,
        adminNotes: data.adminReviewNote || data.adminNotes, // Map backend field name
        adminReviewNote: data.adminReviewNote,
        section: data.sections || data.section || [], // Map sections field
        totalRatings: data.totalRatings ?? 0,
        avgRating: data.avgRating ?? 0,
        learnerCount: data.learnerCount ?? 0,
      };
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch course detail'
      );
    }
  },

  // Get pending courses count
  getPendingCount: async (): Promise<number> => {
    try {
      const response = await axios.get('/admin/courses/by-status', {
        params: { status: 'Pending' }
      });
      const courses = response?.data?.result || response?.data || [];
      return Array.isArray(courses) ? courses.length : 0;
    } catch (error: any) {
      return 0;
    }
  },

  // Approve course
  approveCourse: async (courseId: string, note?: string): Promise<void> => {
    try {
      const payload = note ? { note } : {};
      await axios.post(`/admin/courses/${courseId}/approve`, payload);
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to approve course'
      );
    }
  },

  // Reject course
  rejectCourse: async (courseId: string, note: string): Promise<void> => {
    try {
      await axios.post(`/admin/courses/${courseId}/reject`, { note });
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to reject course'
      );
    }
  },

  // Update review note
  updateReviewNote: async (courseId: string, note: string): Promise<void> => {
    try {
      await axios.put(`/admin/courses/${courseId}/review-note`, { note });
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to update review note'
      );
    }
  },
};
