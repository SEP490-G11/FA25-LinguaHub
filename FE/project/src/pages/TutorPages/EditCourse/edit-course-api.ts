import axiosInstance from '@/config/axiosConfig';
import {
  CourseDetail,
  ApiResponse,
  UpdateCourseRequest,
  UpdateSectionRequest,
  UpdateLessonRequest,
  UpdateResourceRequest,
  Section,
  Lesson,
  Resource,
} from './types';

/**
 * API 1: Get course details with all sections, lessons, and resources
 * GET /tutor/courses/{courseId}
 */
export const getCourseDetail = async (courseId: number): Promise<CourseDetail> => {
  try {
    const response = await axiosInstance.get<ApiResponse<CourseDetail>>(
      `/tutor/courses/${courseId}`
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to fetch course details');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error fetching course details:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch course details'
    );
  }
};

/**
 * API 2: Update course basic information
 * PUT /tutor/courses/{courseId}
 */
export const updateCourse = async (
  courseId: number,
  data: UpdateCourseRequest
): Promise<CourseDetail> => {
  try {
    const response = await axiosInstance.put<ApiResponse<CourseDetail>>(
      `/tutor/courses/${courseId}`,
      data
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to update course');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error updating course:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to update course'
    );
  }
};

/**
 * API 3: Update section
 * PUT /tutor/courses/sections/{sectionID}
 */
export const updateSection = async (
  sectionID: number,
  data: UpdateSectionRequest
): Promise<Section> => {
  try {
    const response = await axiosInstance.put<ApiResponse<Section>>(
      `/tutor/courses/sections/${sectionID}`,
      data
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to update section');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error updating section:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to update section'
    );
  }
};

/**
 * API 4: Update lesson
 * PUT /tutor/courses/lessons/{lessonId}
 */
export const updateLesson = async (
  lessonId: number,
  data: UpdateLessonRequest
): Promise<Lesson> => {
  try {
    const response = await axiosInstance.put<ApiResponse<Lesson>>(
      `/tutor/courses/lessons/${lessonId}`,
      data
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to update lesson');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error updating lesson:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to update lesson'
    );
  }
};

/**
 * API 5: Update resource
 * PUT /tutor/resources/{resourceId}
 */
export const updateResource = async (
  resourceId: number,
  data: UpdateResourceRequest
): Promise<Resource> => {
  try {
    const response = await axiosInstance.put<ApiResponse<Resource>>(
      `/tutor/resources/${resourceId}`,
      data
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to update resource');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error updating resource:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to update resource'
    );
  }
};

/**
 * API 6: Delete section
 * DELETE /tutor/courses/sections/{sectionID}
 */
export const deleteSection = async (sectionID: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<ApiResponse<{}>>(
      `/tutor/courses/sections/${sectionID}`
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to delete section');
    }
  } catch (error: any) {
    console.error('Error deleting section:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to delete section'
    );
  }
};

/**
 * API 7: Delete lesson
 * DELETE /tutor/courses/lessons/{lessonId}
 */
export const deleteLesson = async (lessonId: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<ApiResponse<{}>>(
      `/tutor/courses/lessons/${lessonId}`
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to delete lesson');
    }
  } catch (error: any) {
    console.error('Error deleting lesson:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to delete lesson'
    );
  }
};

/**
 * API 8: Delete resource
 * DELETE /tutor/resources/{resourceId}
 */
export const deleteResource = async (resourceId: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<ApiResponse<{}>>(
      `/tutor/resources/${resourceId}`
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to delete resource');
    }
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to delete resource'
    );
  }
};

/**
 * API 9: Submit course for approval
 * PUT /tutor/courses/{courseID}/submit
 */
export const submitCourseForApproval = async (courseId: number): Promise<CourseDetail> => {
  try {
    const response = await axiosInstance.put<ApiResponse<CourseDetail>>(
      `/tutor/courses/${courseId}/submit`
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to submit course');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error submitting course:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to submit course'
    );
  }
};

/**
 * API 10: Get course objectives
 * GET /courses/{courseID}/objectives
 */
export const getObjectives = async (courseId: number): Promise<any[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `/courses/${courseId}/objectives`
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to fetch objectives');
    }

    return response.data.result || [];
  } catch (error: any) {
    console.error('Error fetching objectives:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch objectives'
    );
  }
};

/**
 * API 11: Create new objective
 * POST /courses/{courseID}/objectives
 */
export const createObjective = async (
  courseId: number,
  data: { objectiveText: string; orderIndex: number }
): Promise<any> => {
  try {
    const response = await axiosInstance.post<ApiResponse<any>>(
      `/courses/${courseId}/objectives`,
      data
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to create objective');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error creating objective:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to create objective'
    );
  }
};

/**
 * API 12: Update objective
 * PUT /course-objectives/{objectiveID}
 */
export const updateObjective = async (
  objectiveId: number,
  data: { objectiveText: string; orderIndex: number }
): Promise<any> => {
  try {
    // Validate objectiveId is a valid number
    if (!objectiveId || typeof objectiveId !== 'number' || objectiveId <= 0) {
      throw new Error(`Invalid objective ID: ${objectiveId}`);
    }

    const response = await axiosInstance.put<ApiResponse<any>>(
      `/course-objectives/${objectiveId}`,
      data
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to update objective');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error updating objective:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to update objective'
    );
  }
};

/**
 * API 13: Delete objective
 * DELETE /course-objectives/{objectiveID}
 */
export const deleteObjective = async (objectiveId: number): Promise<void> => {
  try {
    // Validate objectiveId is a valid number
    if (!objectiveId || typeof objectiveId !== 'number' || objectiveId <= 0) {
      throw new Error(`Invalid objective ID: ${objectiveId}`);
    }

    const response = await axiosInstance.delete<ApiResponse<{}>>(
      `/course-objectives/${objectiveId}`
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to delete objective');
    }
  } catch (error: any) {
    console.error('Error deleting objective:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to delete objective'
    );
  }
};
