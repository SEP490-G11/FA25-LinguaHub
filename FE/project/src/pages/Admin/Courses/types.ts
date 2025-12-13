// Reuse types from CourseApproval
export type {
  CourseDetail as Course,
  Section,
  Lesson,
  Resource,
  Objective,
} from '../CourseApproval/types';

export type CourseStatus = 
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISABLED';

export interface CoursesFilters {
  search?: string;
  category?: string;
  status?: CourseStatus;
  sortBy?: 'newest' | 'oldest' | 'price' | 'rating';
}

export interface PendingCoursesCount {
  count: number;
}
