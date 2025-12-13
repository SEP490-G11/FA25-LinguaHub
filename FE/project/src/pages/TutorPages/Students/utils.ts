import { CourseStudent, BookingStudent } from './types';

/**
 * Format date string to DD/MM/YYYY format
 * @param dateString - ISO 8601 date string
 * @returns Formatted date string or fallback message
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'Chưa có thông tin';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Chưa có thông tin';
    }
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'Chưa có thông tin';
  }
};

/**
 * Format date-time string to DD/MM/YYYY HH:mm format
 * @param dateString - ISO 8601 date-time string
 * @returns Formatted date-time string or fallback message
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'Chưa có thông tin';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Chưa có thông tin';
    }
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Chưa có thông tin';
  }
};

/**
 * Get progress bar color based on progress percentage
 * @param progress - Progress percentage (0-100)
 * @returns Tailwind CSS color class
 */
export const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 30) return 'bg-yellow-500';
  return 'bg-gray-400';
};

/**
 * Get course status badge configuration
 * @param status - Course status
 * @returns Badge configuration object or null
 */
export const getCourseStatusConfig = (status: string) => {
  const statusConfig = {
    Active: {
      label: 'Đang học',
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    Completed: {
      label: 'Hoàn thành',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    Inactive: {
      label: 'Không hoạt động',
      className: 'bg-gray-100 text-gray-800 border-gray-300',
    },
  };

  return statusConfig[status as keyof typeof statusConfig] || null;
};

/**
 * Filter students by search query (name or email)
 * @param students - Array of students
 * @param query - Search query string
 * @returns Filtered array of students
 */
export const filterStudents = <T extends { fullName: string; email: string }>(
  students: T[],
  query: string
): T[] => {
  if (!query.trim()) return students;

  const lowerQuery = query.toLowerCase();
  return students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(lowerQuery) ||
      student.email.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Calculate statistics for course students
 * @param students - Array of course students
 * @returns Statistics object
 */
export const calculateCourseStats = (students: CourseStudent[]) => {
  if (!students || students.length === 0) {
    return {
      totalStudents: 0,
      activeStudents: 0,
      totalEnrollments: 0,
      averageProgress: 0,
    };
  }

  return {
    totalStudents: students.length,
    activeStudents: students.filter(
      (s) => s.averageProgress > 0 && s.averageProgress < 100
    ).length,
    totalEnrollments: students.reduce((sum, s) => sum + (s.totalCourses || 0), 0),
    averageProgress: Math.round(
      students.reduce((sum, s) => sum + (s.averageProgress || 0), 0) /
        students.length
    ),
  };
};

/**
 * Calculate statistics for booking students
 * @param students - Array of booking students
 * @returns Statistics object
 */
export const calculateBookingStats = (students: BookingStudent[]) => {
  if (!students || students.length === 0) {
    return {
      totalStudents: 0,
      totalPaidSlots: 0,
      lastSlotTime: null,
    };
  }

  const totalSlots = students.reduce((sum, s) => sum + (s.totalPaidSlots || 0), 0);
  const mostRecentSlot = students.reduce((latest, s) => {
    try {
      return new Date(s.lastSlotTime) > new Date(latest)
        ? s.lastSlotTime
        : latest;
    } catch {
      return latest;
    }
  }, students[0].lastSlotTime);

  return {
    totalStudents: students.length,
    totalPaidSlots: totalSlots,
    lastSlotTime: mostRecentSlot,
  };
};
