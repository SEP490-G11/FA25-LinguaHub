// API Response Types
export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

// Course Students
export interface CourseStudent {
  userId: number;
  fullName: string;
  email: string;
  avatarURL: string | null;
  totalCourses: number;
  completedCourses: number;
  averageProgress: number;
}

export interface CourseStudentDetail {
  studentId: number;
  fullName: string;
  email: string;
  phone: string | null;
  avatarURL: string | null;
  joinedAt: string; // ISO 8601 date-time
  lastActivity: string; // ISO 8601 date-time
  averageProgress: number;
  courses: EnrolledCourse[];
}

export interface EnrolledCourse {
  courseId: number;
  courseTitle: string;
  enrolledAt: string; // ISO 8601 date-time
  status: 'Active' | 'Completed' | 'Inactive';
  progress: number; // 0-100
}

// Booking Students
export interface BookingStudent {
  userId: number;
  fullName: string;
  email: string;
  avatarURL: string | null;
  totalPaidSlots: number;
  lastSlotTime: string; // ISO 8601 date-time
}

// Component State
export interface StudentsPageState {
  // Course Students
  courseStudents: CourseStudent[];
  courseStudentsLoading: boolean;
  courseStudentsError: string | null;

  // Booking Students
  bookingStudents: BookingStudent[];
  bookingStudentsLoading: boolean;
  bookingStudentsError: string | null;

  // UI State
  activeTab: 'courses' | 'bookings';
  searchQuery: string;

  // Detail Modals
  selectedCourseStudentId: number | null;
  selectedCourseStudentDetail: CourseStudentDetail | null;
  courseDetailLoading: boolean;
  showCourseDetailModal: boolean;

  selectedBookingStudentId: number | null;
  showBookingDetailModal: boolean;
}
