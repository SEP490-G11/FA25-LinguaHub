/**
 * Admin Dashboard Components
 * 
 * This module exports all components used in the Admin Dashboard.
 * Components are organized by functionality and reuse strategy.
 */

// Custom Admin Dashboard Components
export { MemoizedActionableItemCard as ActionableItemCard } from './ActionableItemCard';
export { MemoizedActionableItemsSection as ActionableItemsSection } from './ActionableItemsSection';
export { MemoizedFinancialOverviewSection as FinancialOverviewSection } from './FinancialOverviewSection';
// Task 18.1: Removed static exports for lazy-loaded components to enable code splitting
// export { default as RevenueBreakdownChart } from './RevenueBreakdownChart';
export { MemoizedRevenueByLanguageSection as RevenueByLanguageSection } from './RevenueByLanguageSection';
export { MemoizedGrowthMetricsSection as GrowthMetricsSection } from './GrowthMetricsSection';
// Task 18.1: Removed static exports for lazy-loaded components to enable code splitting
// export { default as MonthlyGrowthChart } from './MonthlyGrowthChart';
export { MemoizedRecentUsersTable as RecentUsersTable } from './RecentUsersTable';
export { MemoizedRecentCoursesTable as RecentCoursesTable } from './RecentCoursesTable';

// Re-export shared components from Tutor Dashboard for convenience
export { MemoizedMetricCard as MetricCard } from '@/pages/TutorPages/Dashboard/components/MetricCard';

// Skeleton Components for Loading States
export {
  MetricCardSkeleton,
  ActionableItemCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  DashboardHeaderSkeleton,
  FullDashboardSkeleton,
} from './DashboardSkeletons';

// Error State Components
export { 
  DashboardErrorState,
  MemoizedDashboardErrorState,
  type DashboardErrorStateProps,
  type DashboardErrorType,
} from './DashboardErrorState';
