import React, { useState, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { startOfMonth } from 'date-fns';
import { useDashboardData, useKeyboardShortcuts } from './hooks';
import { 
  ActionableItemsSection, 
  FinancialOverviewSection, 
  RevenueByLanguageSection, 
  GrowthMetricsSection, 
  RecentUsersTable, 
  RecentCoursesTable, 
  FullDashboardSkeleton,
  DashboardErrorState,
  ChartSkeleton
} from './components';
import { DashboardHeader } from '@/pages/TutorPages/Dashboard/components/DashboardHeader';
import type { AdminDashboardResponse } from './types';

const RevenueBreakdownChart = lazy(() => import('./components/RevenueBreakdownChart'));
const MonthlyGrowthChart = lazy(() => import('./components/MonthlyGrowthChart'));

const AdminDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDateChange = useCallback((start: Date, end: Date) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setStartDate(start);
      setEndDate(end);
    }, 500);
  }, []);

  const { data, isLoading, error, refetch } = useDashboardData(startDate, endDate) as {
    data: AdminDashboardResponse | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  useKeyboardShortcuts({
    onRefresh: handleRefresh,
  });

  const hasActionableItems = useMemo(() => !!data?.actionableItems, [data]);
  const hasFinancialOverview = useMemo(() => !!data?.financialOverview, [data]);
  const hasRevenueBreakdown = useMemo(() => !!data?.revenueBreakdown, [data]);
  const hasRevenueByLanguage = useMemo(() => !!data?.revenueByLanguage, [data]);
  const hasGrowthMetrics = useMemo(() => !!data?.growthMetrics, [data]);
  const hasMonthlyGrowth = useMemo(() => !!data?.monthlyGrowth, [data]);
  const hasRecentUsers = useMemo(() => !!data?.recentUsers, [data]);
  const hasRecentCourses = useMemo(() => !!data?.recentCourses, [data]);

  if (isLoading) {
    return <FullDashboardSkeleton />;
  }

  if (error) {
    return <DashboardErrorState error={error} onRetry={handleRefresh} />;
  }

  return (
    <>
      
      <main 
        id="dashboard-main-content"
        className="container mx-auto px-4 py-4 md:px-6 md:py-6 lg:px-8"
        role="main"
        aria-label="Admin Dashboard"
        tabIndex={-1}
      >
        <DashboardHeader
          userName="Quản trị viên"
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          subtitle="Quản lý và giám sát toàn bộ hoạt động của nền tảng."
          bgGradient="from-purple-600 to-purple-800"
        />
      
      {hasActionableItems && data && (
        <ActionableItemsSection actionableItems={data.actionableItems} />
      )}

      {hasFinancialOverview && data && (
        <FinancialOverviewSection financialOverview={data.financialOverview} />
      )}

      {hasRevenueBreakdown && data && (
        <section className="mt-4 md:mt-6" aria-labelledby="revenue-breakdown-heading">
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueBreakdownChart data={data.revenueBreakdown} />
          </Suspense>
        </section>
      )}

      {hasRevenueByLanguage && data && (
        <RevenueByLanguageSection revenueByLanguage={data.revenueByLanguage} />
      )}

      {hasGrowthMetrics && data && (
        <GrowthMetricsSection growthMetrics={data.growthMetrics} />
      )}

      {hasMonthlyGrowth && data && (
        <section className="mt-4 md:mt-6" aria-labelledby="monthly-growth-heading">
          <Suspense fallback={<ChartSkeleton />}>
            <MonthlyGrowthChart data={data.monthlyGrowth} />
          </Suspense>
        </section>
      )}

      {hasRecentUsers && data && (
        <section className="mt-4 md:mt-6" aria-labelledby="recent-users-heading">
          <RecentUsersTable users={data.recentUsers} />
        </section>
      )}

      {hasRecentCourses && data && (
        <section className="mt-4 md:mt-6" aria-labelledby="recent-courses-heading">
          <RecentCoursesTable courses={data.recentCourses} />
        </section>
      )}
      </main>
    </>
  );
};

export default AdminDashboard;
