// Admin Dashboard Data Types

export interface DashboardParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface AdminDashboardResponse {
  actionableItems: ActionableItems;
  financialOverview: FinancialOverview;
  revenueBreakdown: DailyRevenuePoint[];
  revenueByLanguage: LanguageRevenueItem[];
  growthMetrics: GrowthMetrics;
  monthlyGrowth: MonthlyGrowthPoint[];
  recentUsers: RecentUserItem[];
  recentCourses: RecentCourseItem[];
}

// Actionable Items
export interface ActionableItems {
  pendingTutors: number;
  pendingCourses: number;
  pendingRefundRequests: number;
  pendingWithdraws: number;
  reportedContents: number;
}

// Financial Overview
export interface FinancialOverview {
  totalGMV: number;
  totalCommission: number;
  totalPayout: number;
  avgOrderValue: number;
  totalPaidOrders: number;
}

// Revenue Breakdown
export interface DailyRevenuePoint {
  date: string; // YYYY-MM-DD
  gmv: number;
  commission: number;
  payout: number;
}

// Revenue by Language
export interface LanguageRevenueItem {
  language: string;
  gmv: number;
  commission: number;
  payout: number;
  courseCount: number;
  percentGMV: number; // 0-100
}

// Growth Metrics
export interface GrowthMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTutors: number;
  activeTutors: number;
  totalCourses: number;
  totalEnrollments: number;
  conversionRate: number; // 0-100
  retentionRate: number; // 0-100
  churnRate: number; // 0-100
}

// Monthly Growth
export interface MonthlyGrowthPoint {
  year: number;
  month: number; // 1-12
  newUsers: number;
  newTutors: number;
  newEnrollments: number;
}

// Recent Users
export interface RecentUserItem {
  userId: number;
  fullName: string;
  email: string;
  roleName?: string; // Optional to handle cases where role data is missing
  createdAt: string; // ISO datetime
}

// Recent Courses
export interface RecentCourseItem {
  courseId: number;
  title: string;
  language: string;
  level: string;
  tutorName: string;
  status: 'Draft' | 'Pending' | 'Active' | 'Inactive';
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

export interface ActionableItemCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

export interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
}
