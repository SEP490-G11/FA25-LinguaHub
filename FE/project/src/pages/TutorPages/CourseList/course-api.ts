import axios from '@/config/axiosConfig';

/**
 * Enable a course - makes it visible to students
 * PUT /tutor/courses/{courseId}/enable
 */
export const enableCourse = async (courseId: number): Promise<void> => {
  try {
    const response = await axios.put(`/tutor/courses/${courseId}/enable`);

    // Handle both 200 and 204 status codes as success
    if (response.status !== 200 && response.status !== 204) {
      throw new Error('Failed to enable course');
    }
  } catch (error: any) {
    console.error('Error enabling course:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to enable course'
    );
  }
};

/**
 * Disable a course - hides it from students
 * PUT /tutor/courses/{courseId}/disable
 */
export const disableCourse = async (courseId: number): Promise<void> => {
  try {
    const response = await axios.put(`/tutor/courses/${courseId}/disable`);

    // Handle both 200 and 204 status codes as success
    if (response.status !== 200 && response.status !== 204) {
      throw new Error('Failed to disable course');
    }
  } catch (error: any) {
    console.error('Error disabling course:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to disable course'
    );
  }
};
