import axios from '@/config/axiosConfig';
import { TutorApplicationRequest, ApplicationStatusResponse } from './types';

/**
 * Submit a tutor application
 * @param data - The tutor application data
 * @returns Success response with message
 */
export const submitTutorApplication = async (
  data: TutorApplicationRequest
): Promise<{ success: boolean; message: string }> => {
  await axios.post('/tutors/apply', data);
  return {
    success: true,
    message: 'Application submitted successfully',
  };
};

/**
 * Get the current application status
 * @returns Application status data or null if no application exists
 */
export const getApplicationStatus = async (): Promise<ApplicationStatusResponse | null> => {
  try {
    const response = await axios.get('/tutors/apply/status');
    return response?.data?.result || response?.data;
  } catch (error: any) {
    // Return null if no application exists (404)
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
