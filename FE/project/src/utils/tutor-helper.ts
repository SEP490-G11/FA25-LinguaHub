/**
 * Simple helper to get tutorId from JWT token
 */

import { getTutorIdFromToken } from './jwt-decode';

/**
 * Get the current tutor's ID from the JWT token
 * @returns tutorId or null if not found
 */
export const getCurrentTutorId = (): number | null => {
  return getTutorIdFromToken();
};
