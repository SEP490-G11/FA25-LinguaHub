/**
 * Utility functions for generating course-related routes
 */

/**
 * Generate the route for editing a regular course
 */
export const getCourseEditRoute = (courseId: number | string): string => {
  return `/tutor/courses/${courseId}/content`;
};

/**
 * Generate the route for editing a draft course
 */
export const getCourseDraftEditRoute = (courseId: number | string, draftId: number | string): string => {
  return `/tutor/courses/${courseId}/draft/${draftId}/content`;
};

/**
 * Generate the route for course details
 */
export const getCourseDetailRoute = (courseId: number | string): string => {
  return `/tutor/courses/${courseId}/details`;
};

/**
 * Generate the route for course list
 */
export const getCourseListRoute = (): string => {
  return '/tutor/courses';
};