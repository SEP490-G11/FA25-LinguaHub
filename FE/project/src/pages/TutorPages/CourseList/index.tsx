/**
 * CourseList Page - Tutor Course Management
 * 
 * Migration Notes:
 * - Migrated to use StandardPageHeading with blue-purple gradient
 * - Migrated to use StandardStatisticsCards with default variant (4 stats)
 * - Migrated to use StandardFilters for search and select dropdowns
 * - Removed custom StatsCards and CourseFilters components
 * - All functionality preserved: filtering, pagination, course actions
 * 
 * @see .kiro/specs/tutor-pages-migration/design.md
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, AlertCircle, Loader2, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguages } from '@/hooks/useLanguages';
import { getAllCourses, CourseListItem } from './course-list-api';
import { CourseCard, CoursePagination } from './components';
import { CourseStats } from './types';
import { StandardPageHeading } from '@/components/shared/StandardPageHeading';
import { StandardStatisticsCards } from '@/components/shared/StandardStatisticsCards';
import { StandardFilters } from '@/components/shared/StandardFilters';
import { StatCardData, FilterConfig } from '@/components/shared/types/standard-components';

const CourseList = () => {
  const { languages } = useLanguages();
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // State for API data
  const [allCourses, setAllCourses] = useState<CourseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const coursesData = await getAllCourses();
      setAllCourses(coursesData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khóa học');
      setAllCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Client-side filtering
  const filteredCourses = allCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || course.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || course.categoryName === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

  // Calculate stats from all courses
  const stats: CourseStats = {
    total: allCourses.length,
    approved: allCourses.filter(c => c.status === 'Approved').length,
    pending: allCourses.filter(c => c.status === 'Pending').length,
    rejected: allCourses.filter(c => c.status === 'Rejected').length,
  };

  // Map stats data to StatCardData interface for StandardStatisticsCards
  const statsData: StatCardData[] = [
    {
      label: 'Tổng khóa học',
      value: stats.total,
      icon: BookOpen,
      iconColor: '#3b82f6', // blue-500
    },
    {
      label: 'Đã duyệt',
      value: stats.approved,
      icon: CheckCircle,
      iconColor: '#10b981', // green-500
    },
    {
      label: 'Chờ duyệt',
      value: stats.pending,
      icon: Clock,
      iconColor: '#f59e0b', // amber-500
    },
    {
      label: 'Từ chối',
      value: stats.rejected,
      icon: XCircle,
      iconColor: '#ef4444', // red-500
    },
  ];

  // Get unique categories from courses
  const categories = Array.from(new Set(allCourses.map(c => c.categoryName)));

  // Configure filters for StandardFilters component
  const filtersConfig: FilterConfig[] = [
    {
      id: 'search',
      type: 'search',
      placeholder: 'Tìm kiếm khóa học...',
      value: searchTerm,
      onChange: setSearchTerm,
    },
    {
      id: 'status',
      type: 'select',
      placeholder: 'Trạng thái',
      value: selectedStatus,
      onChange: setSelectedStatus,
      options: [
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'Draft', label: 'Bản nháp' },
        { value: 'Pending', label: 'Chờ duyệt' },
        { value: 'Approved', label: 'Đã duyệt' },
        { value: 'Rejected', label: 'Từ chối' },
      ],
    },
    {
      id: 'category',
      type: 'select',
      placeholder: 'Danh mục',
      value: selectedCategory,
      onChange: setSelectedCategory,
      options: [
        { value: 'all', label: 'Tất cả danh mục' },
        ...categories.map(cat => ({ value: cat, label: cat })),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Migrated from custom header to StandardPageHeading */}
      {/* Gradient colors match the original design */}
      <StandardPageHeading
        title="Quản lý khóa học"
        description="Quản lý và theo dõi tất cả các khóa học của bạn"
        icon={BookOpen}
        gradientFrom="from-blue-600"
        gradientVia="via-purple-600"
        gradientTo="to-purple-600"
        actionButtons={
          <Button asChild size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
            <Link to="/create-courses">
              <Plus className="w-5 h-5" />
              Tạo khóa học mới
            </Link>
          </Button>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          {/* Migrated from custom StatsCards to StandardStatisticsCards */}
          {/* Using default variant with 4 stat cards */}
          <StandardStatisticsCards stats={statsData} variant="default" />

          {/* Migrated from custom CourseFilters to StandardFilters */}
          {/* Configured with search and select dropdowns */}
          <div className="mt-6">
            <StandardFilters filters={filtersConfig} />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8 bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCourses}
                  className="ml-auto"
                >
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Đang tải khóa học...</p>
            </div>
          </div>
        )}

        {/* Course Grid */}
        {!isLoading && paginatedCourses.length === 0 ? (
          <Card className="p-12 shadow-lg">
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Không tìm thấy khóa học
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedStatus !== 'all' || selectedCategory !== 'all'
                  ? 'Không có khóa học nào phù hợp với bộ lọc của bạn'
                  : 'Bạn chưa có khóa học nào'}
              </p>
              <Button asChild className="gap-2">
                <Link to="/create-courses">
                  <Plus className="w-4 h-4" />
                  Tạo khóa học đầu tiên
                </Link>
              </Button>
            </div>
          </Card>
        ) : !isLoading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedCourses.map((course, index) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  index={index}
                  languages={languages}
                />
              ))}
            </div>

            {/* Pagination */}
            <CoursePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCourses.length}
              onPageChange={setCurrentPage}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};

export default CourseList;
