import axiosInstance from '@/config/axiosConfig';

// Interface for a single course in the list
export interface CourseListItem {
  id: number;
  title: string;
  description: string;
  duration: number; // in hours
  price: number;
  language: string;
  thumbnailURL: string;
  categoryName: string;
  status: string; // "Approved", "Pending", "Draft", "Rejected"
  isEnabled?: boolean; // Optional field for approved courses - indicates if course is visible to students
}

/**
 * Fetch all courses for the tutor
 * GET /tutor/courses/me
 */
export const getAllCourses = async (): Promise<CourseListItem[]> => {
  try {
    const response = await axiosInstance.get('/tutor/courses/me');

    // Validate response structure
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to fetch courses');
    }

    return response.data.result || [];
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch courses'
    );
  }
};

/**
 * Delete a course
 * DELETE /tutor/courses/{courseId}
 */
export const deleteCourse = async (courseId: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete(`/tutor/courses/${courseId}`);

    // Handle 204 No Content response (successful deletion with no body)
    if (response.status === 204) {
      return;
    }

    // Handle response with body
    if (response.data && response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to delete course');
    }
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to delete course'
    );
  }
};
