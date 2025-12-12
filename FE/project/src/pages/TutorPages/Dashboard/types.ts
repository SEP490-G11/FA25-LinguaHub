// Dashboard Data Types

export interface DashboardData {
  performanceMetrics: PerformanceMetrics;
  ratingDistribution: RatingDistribution[];
  revenueTrend: RevenueTrendItem[];
  salesByCourse: SalesByCourseItem[];
  studentEngagement: StudentEngagementItem[];
  upcomingSessions: UpcomingSession[];
  pendingRefundRequests: number;
  recentReviews: Review[];
}

export interface PerformanceMetrics {
  totalRevenue: number;
  netRevenue: number;
  activeStudents: number;
  totalEnrollments: number;
  completionRate: number; // 0-100
  instructorRating: number; // 0-5
  totalReviews: number;
}

export interface RatingDistribution {
  stars: number; // 1-5
  count: number;
  percent: number; // 0-100
}

export interface RevenueTrendItem {
  date: string; // ISO date string
  amount: number;
}

export interface SalesByCourseItem {
  courseId: number;
  courseTitle: string;
  revenue: number;
  percent: number; // 0-100
}

export interface StudentEngagementItem {
  weekIndex: number; // ISO week number
  hours: number; // decimal hours
  lessonCount: number;
}

export interface UpcomingSession {
  slotId: number;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  studentName: string;
  studentEmail: string;
  title: string;
  status: 'Paid' | 'Locked';
}

export interface Review {
  reviewId: number;
  studentName: string;
  courseTitle: string;
  rating: number; // 0-5
  comment: string;
  createdAt: string; // ISO datetime
}

// Component Props Types

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
}

export interface DashboardParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
