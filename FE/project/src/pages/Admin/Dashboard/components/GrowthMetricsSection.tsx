import React from 'react';
import { Users, UserCheck, GraduationCap, BookOpen, TrendingUp, UserMinus, Target } from 'lucide-react';
import { MetricCard } from './';
import { GrowthMetrics } from '../types';
import { formatNumber, formatPercentage } from '../utils/formatters';

/**
 * GrowthMetricsSection Component
 * 
 * Displays platform-wide growth metrics including:
 * - Total Users & Active Users
 * - Total Tutors & Active Tutors
 * - Total Courses
 * - Total Enrollments
 * - Conversion Rate (users with enrollments / total users)
 * - Retention Rate (active users / total users)
 * - Churn Rate (100 - retention rate)
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10
 * - Displays system-wide statistics without date range filters
 * - Formats percentages with % symbol
 * - Responsive grid layout
 */

interface GrowthMetricsSectionProps {
  growthMetrics: GrowthMetrics;
}

export const GrowthMetricsSection: React.FC<GrowthMetricsSectionProps> = ({
  growthMetrics,
}) => {
  const {
    totalUsers,
    activeUsers,
    totalTutors,
    activeTutors,
    totalCourses,
    totalEnrollments,
    conversionRate,
    retentionRate,
    churnRate,
  } = growthMetrics;

  return (
    <section className="mb-6 md:mb-8" aria-labelledby="growth-metrics-heading">
      <h2 id="growth-metrics-heading" className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900 dark:text-gray-100">
        Chỉ số tăng trưởng
      </h2>
      
      {/* Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop for 9 cards */}
      {/* Requirements 12.1: Mobile - single column, Tablet - 2 columns, Desktop - full grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Users - Requirement 6.1 */}
        <MetricCard
          title="Tổng người dùng"
          value={formatNumber(totalUsers)}
          icon={Users}
          subtitle="Đã đăng ký"
        />
        
        {/* Active Users - Requirement 6.2 */}
        <MetricCard
          title="Người dùng hoạt động"
          value={formatNumber(activeUsers)}
          icon={UserCheck}
          subtitle={`${formatPercentage(retentionRate, 1, false)} tổng số`}
        />
        
        {/* Total Tutors - Requirement 6.3 */}
        <MetricCard
          title="Tổng giáo viên"
          value={formatNumber(totalTutors)}
          icon={GraduationCap}
          subtitle="Trong hệ thống"
        />
        
        {/* Active Tutors - Requirement 6.4 */}
        <MetricCard
          title="Giáo viên hoạt động"
          value={formatNumber(activeTutors)}
          icon={GraduationCap}
          subtitle="Đã phê duyệt"
        />
        
        {/* Total Courses - Requirement 6.5 */}
        <MetricCard
          title="Tổng khóa học"
          value={formatNumber(totalCourses)}
          icon={BookOpen}
          subtitle="Trên nền tảng"
        />
        
        {/* Total Enrollments - Requirement 6.6 */}
        <MetricCard
          title="Lượt ghi danh"
          value={formatNumber(totalEnrollments)}
          icon={Target}
          subtitle="Học viên đăng ký"
        />
        
        {/* Conversion Rate - Requirement 6.7 */}
        <MetricCard
          title="Tỷ lệ chuyển đổi"
          value={formatPercentage(conversionRate, 1, false)}
          icon={TrendingUp}
          subtitle="Có đăng ký khóa học"
        />
        
        {/* Retention Rate - Requirement 6.8 */}
        <MetricCard
          title="Tỷ lệ duy trì"
          value={formatPercentage(retentionRate, 1, false)}
          icon={UserCheck}
          subtitle="Tiếp tục sử dụng"
        />
        
        {/* Churn Rate - Requirement 6.9 */}
        <MetricCard
          title="Tỷ lệ rời bỏ"
          value={formatPercentage(churnRate, 1, false)}
          icon={UserMinus}
          subtitle="Ngừng sử dụng"
        />
      </div>
    </section>
  );
};

// Memoize to prevent unnecessary re-renders
export const MemoizedGrowthMetricsSection = React.memo(GrowthMetricsSection);
