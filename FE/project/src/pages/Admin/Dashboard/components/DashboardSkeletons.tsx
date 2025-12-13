import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard Skeleton Components
 * 
 * Provides loading skeleton components for the Admin Dashboard.
 * These components maintain the layout structure while data is being fetched,
 * improving perceived performance and user experience.
 * 
 * Task: 15.2 - Implement loading skeletons
 * - Skeleton components for cards
 * - Skeleton components for charts
 * - Skeleton components for tables
 */

/**
 * MetricCardSkeleton
 * 
 * Skeleton for MetricCard component used in Financial Overview and Growth Metrics sections.
 * Matches the structure of MetricCard with icon, title, value, and optional subtitle.
 */
export const MetricCardSkeleton: React.FC = () => {
  return (
    <Card className="hover:shadow-md transition-shadow" role="status" aria-label="Loading metric card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
};

/**
 * ActionableItemCardSkeleton
 * 
 * Skeleton for ActionableItemCard component.
 * Matches the structure with icon, title, count, and badge.
 */
export const ActionableItemCardSkeleton: React.FC = () => {
  return (
    <Card role="status" aria-label="Loading actionable item card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24 mt-2" />
      </CardContent>
    </Card>
  );
};

/**
 * ChartSkeleton
 * 
 * Skeleton for chart components (RevenueBreakdownChart, MonthlyGrowthChart).
 * Provides a placeholder with appropriate height for chart visualization.
 * 
 * @param height - Optional height for the chart skeleton (default: 300px)
 */
interface ChartSkeletonProps {
  height?: number;
  title?: string;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ 
  height = 300,
  title = 'Loading chart...'
}) => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="pt-4">
        <div 
          className="w-full flex items-center justify-center"
          style={{ height: `${height}px` }}
          role="status"
          aria-label={title}
        >
          <div className="space-y-3 w-full">
            {/* Simulate chart bars/lines */}
            <div className="flex items-end justify-between gap-2 h-48">
              {[...Array(7)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="flex-1" 
                  style={{ 
                    height: `${Math.random() * 60 + 40}%`,
                    minWidth: '20px'
                  }} 
                />
              ))}
            </div>
            {/* Simulate x-axis labels */}
            <div className="flex justify-between gap-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-3 flex-1" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * TableSkeleton
 * 
 * Skeleton for table components (RecentUsersTable, RecentCoursesTable).
 * Simulates table structure with header and rows.
 * 
 * @param rows - Number of skeleton rows to display (default: 5)
 * @param columns - Number of columns in the table (default: 4)
 * @param title - Optional title for the table
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  title?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5,
  columns = 4,
  title = 'Loading table...'
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto" role="status" aria-label={title}>
          <div className="space-y-3">
            {/* Table header */}
            <div className="flex gap-4 pb-2 border-b">
              {[...Array(columns)].map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            
            {/* Table rows */}
            {[...Array(rows)].map((_, rowIndex) => (
              <div key={rowIndex} className="flex gap-4 py-2">
                {[...Array(columns)].map((_, colIndex) => (
                  <Skeleton 
                    key={colIndex} 
                    className="h-5 flex-1"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * DashboardHeaderSkeleton
 * 
 * Skeleton for the dashboard header with date picker.
 */
export const DashboardHeaderSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 mb-6" role="status" aria-label="Loading dashboard header">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
    </div>
  );
};

/**
 * FullDashboardSkeleton
 * 
 * Complete skeleton for the entire dashboard layout.
 * Used when the dashboard is initially loading.
 */
export const FullDashboardSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6" role="status" aria-live="polite" aria-label="Loading dashboard">
      {/* Header Skeleton */}
      <DashboardHeaderSkeleton />

      {/* Actionable Items Skeleton - 5 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <ActionableItemCardSkeleton key={`actionable-${i}`} />
        ))}
      </div>

      {/* Financial Overview Skeleton - 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <MetricCardSkeleton key={`financial-${i}`} />
        ))}
      </div>

      {/* Revenue Breakdown Chart Skeleton */}
      <ChartSkeleton height={300} title="Loading revenue breakdown chart" />

      {/* Revenue by Language Table Skeleton */}
      <TableSkeleton 
        rows={5} 
        columns={6} 
        title="Loading revenue by language table" 
      />

      {/* Growth Metrics Skeleton - 7 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => (
          <MetricCardSkeleton key={`growth-${i}`} />
        ))}
      </div>

      {/* Monthly Growth Chart Skeleton */}
      <ChartSkeleton height={300} title="Loading monthly growth chart" />

      {/* Recent Users Table Skeleton */}
      <TableSkeleton 
        rows={5} 
        columns={4} 
        title="Loading recent users table" 
      />

      {/* Recent Courses Table Skeleton */}
      <TableSkeleton 
        rows={5} 
        columns={6} 
        title="Loading recent courses table" 
      />
    </div>
  );
};

// Export all skeleton components
export default {
  MetricCardSkeleton,
  ActionableItemCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  DashboardHeaderSkeleton,
  FullDashboardSkeleton,
};
