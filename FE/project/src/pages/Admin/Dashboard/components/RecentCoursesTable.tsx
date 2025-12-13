import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Globe, BarChart3, User, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatRelativeTime } from '../utils/formatters';
import { routeHelpers } from '@/constants/routes';
import type { RecentCourseItem } from '../types';

interface RecentCoursesTableProps {
  courses: RecentCourseItem[];
}

/**
 * RecentCoursesTable Component
 * 
 * Displays the 5 most recently created courses with their details.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 * - Retrieves the 5 most recent courses ordered by created_at descending
 * - Includes courseId, title, language, level, tutorName, status, and createdAt
 * - Displays recent courses in a table format with status displayed as a colored badge
 * - Does not apply date range filters to recent courses
 * 
 * Features:
 * - Status badge with colors (Draft: gray, Pending: yellow, Active: green)
 * - Format created_at as relative time
 * - Click handler for row navigation to course detail
 * - Responsive table layout
 * - Empty state handling
 */
export const RecentCoursesTable: React.FC<RecentCoursesTableProps> = ({ courses }) => {
  const navigate = useNavigate();

  /**
   * Handle row click to navigate to admin course detail page
   * Requirement 9.3 - Click handler for row
   * Task 18.2: Memoize callback to prevent recreation on every render
   */
  const handleRowClick = React.useCallback((courseId: number) => {
    // Navigate to admin course detail page
    navigate(routeHelpers.adminCourseDetail(courseId));
  }, [navigate]);

  /**
   * Get badge color classes based on course status
   * Requirement 9.3 - Status badge with colors (Draft: gray, Pending: yellow, Active: green)
   */
  const getStatusBadgeClasses = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'draft') {
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
    if (statusLower === 'pending') {
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    }
    if (statusLower === 'active') {
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    }
    if (statusLower === 'inactive') {
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    }
    return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  /**
   * Get badge variant based on course status
   */
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active') return 'default';
    if (statusLower === 'pending') return 'secondary';
    return 'outline';
  };

  /**
   * Translate status to Vietnamese
   */
  const translateStatus = (status: string): string => {
    const statusLower = status.toLowerCase();
    const statusMap: Record<string, string> = {
      'draft': 'Bản nháp',
      'pending': 'Chờ duyệt',
      'active': 'Hoạt động',
      'inactive': 'Không hoạt động',
    };
    return statusMap[statusLower] || status;
  };

  // Empty state handling
  if (!courses || courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle id="recent-courses-heading" className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" aria-hidden="true" />
            Khóa học gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8" role="status" aria-label="No recent courses found">
            Không tìm thấy khóa học gần đây
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle id="recent-courses-heading" className="flex items-center gap-2 text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
          <BookOpen className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
          Khóa học gần đây
        </CardTitle>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          {courses.length} khóa học mới nhất
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <Table aria-label="Recent courses table">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">Tiêu đề</TableHead>
                <TableHead className="min-w-[120px]">Ngôn ngữ</TableHead>
                <TableHead className="min-w-[100px]">Cấp độ</TableHead>
                <TableHead className="min-w-[150px]">Giáo viên</TableHead>
                <TableHead className="min-w-[100px]">Trạng thái</TableHead>
                <TableHead className="min-w-[150px]">Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow
                  key={course.courseId}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(course.courseId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(course.courseId);
                    }
                  }}
                  aria-label={`View details for ${course.title}`}
                >
                  {/* Title - Requirement 9.2 */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <span className="font-medium line-clamp-2" title={course.title}>
                        {course.title}
                      </span>
                    </div>
                  </TableCell>

                  {/* Language - Requirement 9.2 */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm">{course.language}</span>
                    </div>
                  </TableCell>

                  {/* Level - Requirement 9.2 */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm">{course.level}</span>
                    </div>
                  </TableCell>

                  {/* Tutor - Requirement 9.2 */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm truncate max-w-[150px]" title={course.tutorName}>
                        {course.tutorName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status - Requirement 9.2, 9.3 (Status badge with colors) */}
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(course.status)}
                      className={getStatusBadgeClasses(course.status)}
                    >
                      {translateStatus(course.status)}
                    </Badge>
                  </TableCell>

                  {/* Created At - Requirement 9.2, 9.3 (Format created_at as relative time) */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(course.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Memoized version of RecentCoursesTable for performance optimization
 */
export const MemoizedRecentCoursesTable = React.memo(RecentCoursesTable);

export default RecentCoursesTable;
