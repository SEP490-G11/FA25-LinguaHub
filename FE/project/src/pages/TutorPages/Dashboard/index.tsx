import React, { useState, useCallback, lazy, Suspense } from 'react';
import { subDays } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  Users,
  BookOpen,
  CheckCircle,
  Star,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useDashboardData } from './hooks/useDashboardData';
import {
  UpcomingSessionsList,
  RecentReviewsList,
} from './components';
import { DateRangeFilter } from './components/DateRangeFilter';
import { StandardPageHeading, StandardStatisticsCards } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Lazy load chart components for code splitting
const RevenueTrendChart = lazy(() => import('./components/RevenueTrendChart'));
const SalesByCourseChart = lazy(() => import('./components/SalesByCourseChart'));
const RatingDistributionChart = lazy(() => import('./components/RatingDistributionChart'));
const StudentEngagementChart = lazy(() => import('./components/StudentEngagementChart'));

/**
 * TutorDashboard - Trang dashboard chính cho giảng viên
 */
const TutorDashboard: React.FC = () => {
  const { user } = useUser();

  // Mặc định: 30 ngày gần nhất
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Lấy dữ liệu dashboard
  const { data, isLoading, isError, error, refetch } = useDashboardData(startDate, endDate);

  // Xử lý thay đổi ngày với debouncing
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleDateChange = useCallback((newStartDate: Date, newEndDate: Date) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      setStartDate(newStartDate);
      setEndDate(newEndDate);
    }, 500);

    setDebounceTimer(timer);
  }, [debounceTimer]);

  const userName = user?.fullName || user?.username || 'Giảng viên';

  // Trạng thái đang tải
  if (isLoading) {
    return (
      <div className="space-y-6 p-6" role="status" aria-live="polite" aria-label="Đang tải dữ liệu dashboard">
        <span className="sr-only">Đang tải dữ liệu dashboard, vui lòng đợi...</span>
        <DashboardLoadingSkeleton />
      </div>
    );
  }

  // Trạng thái lỗi
  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <DashboardErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { performanceMetrics } = data;

  // Prepare stats data for StandardStatisticsCards
  const statsData = [
    {
      label: 'Tổng doanh thu',
      value: `${performanceMetrics.totalRevenue.toLocaleString()} ₫`,
      icon: DollarSign,
      iconColor: '#10b981', // emerald-500
      bgColor: '#ecfdf5', // emerald-50
    },
    {
      label: 'Doanh thu ròng',
      value: `${performanceMetrics.netRevenue.toLocaleString()} ₫`,
      icon: TrendingUp,
      iconColor: '#3b82f6', // blue-500
      bgColor: '#eff6ff', // blue-50
    },
    {
      label: 'Học viên đang học',
      value: performanceMetrics.activeStudents,
      icon: Users,
      iconColor: '#8b5cf6', // violet-500
      bgColor: '#f5f3ff', // violet-50
    },
    {
      label: 'Tổng số đăng ký',
      value: performanceMetrics.totalEnrollments,
      icon: BookOpen,
      iconColor: '#f59e0b', // amber-500
      bgColor: '#fffbeb', // amber-50
    },
    {
      label: 'Tỷ lệ hoàn thành',
      value: `${performanceMetrics.completionRate.toFixed(1)}%`,
      icon: CheckCircle,
      iconColor: '#ec4899', // pink-500
      bgColor: '#fdf2f8', // pink-50
    },
    {
      label: 'Đánh giá giảng viên',
      value: performanceMetrics.instructorRating.toFixed(1),
      icon: Star,
      iconColor: '#eab308', // yellow-500
      bgColor: '#fefce8', // yellow-50
    },
    {
      label: 'Tổng số đánh giá',
      value: performanceMetrics.totalReviews,
      icon: MessageSquare,
      iconColor: '#6366f1', // indigo-500
      bgColor: '#eef2ff', // indigo-50
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Premium Unified Header */}
      <StandardPageHeading
        title={`Xin chào, ${userName}!`}
        description="Chào mừng bạn quay trở lại. Dưới đây là tổng quan hiệu suất giảng dạy và doanh thu của bạn."
        icon={LayoutDashboard}
        gradientFrom="from-indigo-600"
        gradientVia="via-purple-600"
        gradientTo="to-indigo-600"
      >
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
        />
      </StandardPageHeading>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* Các chỉ số hiệu suất */}
        <section aria-label="Chỉ số hiệu suất">
          <StandardStatisticsCards stats={statsData} />
        </section>

        {/* Biểu đồ doanh thu và đánh giá */}
        <section aria-label="Biểu đồ doanh thu và đánh giá">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<ChartLoadingSkeleton />}>
              <RevenueTrendChart data={data.revenueTrend} />
            </Suspense>
            <Suspense fallback={<ChartLoadingSkeleton />}>
              <RatingDistributionChart data={data.ratingDistribution} />
            </Suspense>
          </div>
        </section>

        {/* Doanh thu theo khóa học */}
        <section aria-label="Doanh thu theo khóa học">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <Suspense fallback={<ChartLoadingSkeleton />}>
              <SalesByCourseChart data={data.salesByCourse} />
            </Suspense>
          </div>
        </section>

        {/* Hoạt động học viên */}
        <section aria-label="Hoạt động học viên">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <Suspense fallback={<ChartLoadingSkeleton />}>
              <StudentEngagementChart data={data.studentEngagement} />
            </Suspense>
          </div>
        </section>

        {/* Buổi học sắp tới và đánh giá gần đây */}
        <section aria-label="Buổi học sắp tới và đánh giá gần đây">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <UpcomingSessionsList sessions={data.upcomingSessions} />
            <RecentReviewsList reviews={data.recentReviews} />
          </div>
        </section>
      </div>
    </div>
  );
};

/**
 * ChartLoadingSkeleton - Skeleton loading cho biểu đồ
 */
const ChartLoadingSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
};

/**
 * DashboardLoadingSkeleton - Skeleton loading cho dashboard
 */
const DashboardLoadingSkeleton: React.FC = () => {
  return (
    <>
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-10 w-full sm:w-48" />
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Lists skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

/**
 * DashboardErrorState - Trạng thái lỗi với nút thử lại
 */
interface DashboardErrorStateProps {
  error: any;
  onRetry: () => void;
}

const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({ error, onRetry }) => {
  let errorTitle = 'Lỗi tải Dashboard';
  let errorMessage = 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';

  if (error?.response) {
    const status = error.response.status;

    if (status === 401) {
      errorTitle = 'Yêu cầu xác thực';
      errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    } else if (status === 403) {
      errorTitle = 'Truy cập bị từ chối';
      errorMessage = 'Bạn không có quyền xem dashboard này.';
    } else if (status === 404) {
      errorTitle = 'Không tìm thấy Dashboard';
      errorMessage = 'Không tìm thấy dữ liệu dashboard. Vui lòng liên hệ hỗ trợ.';
    } else if (status >= 500) {
      errorTitle = 'Lỗi máy chủ';
      errorMessage = 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.';
    }
  } else if (error?.message === 'Network Error' || !error?.response) {
    errorTitle = 'Lỗi kết nối';
    errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  } else if (error?.code === 'ECONNABORTED') {
    errorTitle = 'Hết thời gian chờ';
    errorMessage = 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.';
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]" role="alert" aria-live="assertive">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription className="mt-2">
          {errorMessage}
        </AlertDescription>
        <div className="mt-4">
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            aria-label="Thử lại tải dữ liệu dashboard"
          >
            Thử lại
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default TutorDashboard;
