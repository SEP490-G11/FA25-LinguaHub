import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { coursesApi } from './api';
import { CourseCard, Pagination } from './components';
import type { Course, CoursesFilters } from './types';
import { routeHelpers } from '@/constants/routes';
import { StandardPageHeading, StandardFilters } from '@/components/shared';
import { useLanguages } from '@/hooks/useLanguages';

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { languages } = useLanguages();

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CoursesFilters>({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch all courses and categories
  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const coursesData = await coursesApi.getAllCourses();
      setCourses(coursesData);
      setFilteredCourses(coursesData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const axios = (await import('@/config/axiosConfig')).default;
      const response = await axios.get('/categories');
      
      let rawData = [];
      if (response?.data?.result) {
        rawData = response.data.result;
      } else if (Array.isArray(response?.data)) {
        rawData = response.data;
      } else if (response?.data?.data) {
        rawData = response.data.data;
      }
      
      const categoriesData = rawData.map((cat: any) => ({
        id: cat.categoryId || cat.id,
        name: cat.categoryName || cat.name,
      }));
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Apply filters
  useEffect(() => {
    let result = [...courses];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(course =>
        course.title?.toLowerCase().includes(searchLower) ||
        course.shortDescription?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      result = result.filter(course => 
        course.categoryID?.toString() === filters.category ||
        course.categoryName === filters.category
      );
    }

    // Status filter (case-insensitive)
    if (filters.status) {
      result = result.filter(course => 
        course.status?.toUpperCase() === filters.status?.toUpperCase()
      );
    }

    // Sort
    if (filters.sortBy) {
      result.sort((a, b) => {
        switch (filters.sortBy) {
          case 'newest':
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          case 'oldest':
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          case 'price':
            return (b.price || 0) - (a.price || 0);
          case 'rating':
            // Rating is not available in CourseDetail type, skip sorting
            return 0;
          default:
            return 0;
        }
      });
    }
    
    setFilteredCourses(result);
    setCurrentPage(1);
  }, [filters, courses]);

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

  const handleCourseClick = (courseId: string | number) => {
    navigate(routeHelpers.adminCourseDetail(courseId));
  };

  // Convert Course to PendingCourse format for CourseCard
  const convertToPendingCourse = (course: Course) => {
    const converted = {
      id: course.id,
      title: course.title,
      shortDescription: course.shortDescription || '',
      description: course.description || '',
      requirement: course.requirement || '',
      level: course.level || 'BEGINNER',
      categoryID: course.categoryID || 0,
      categoryName: course.categoryName || 'Unknown',
      language: course.language || 'English',
      duration: course.duration || 0,
      price: course.price || 0,
      thumbnailURL: course.thumbnailURL || '',
      status: course.status || 'Pending',
      tutorID: course.tutorID || 0,
      tutorName: course.tutorName || 'Unknown',
      tutorEmail: course.tutorEmail || '',
      createdAt: course.createdAt || new Date().toISOString(),
      updatedAt: course.updatedAt || new Date().toISOString(),
      isDraft: false,
    };
    
    return converted;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Prepare filter configurations for StandardFilters
  const filterConfigs = [
    {
      id: 'search',
      type: 'search' as const,
      placeholder: 'Tìm theo tên khóa học...',
      value: filters.search || '',
      onChange: (value: string) => setFilters({ ...filters, search: value }),
    },
    {
      id: 'category',
      type: 'select' as const,
      placeholder: 'Danh mục',
      value: filters.category || 'all',
      onChange: (value: string) => 
        setFilters({ ...filters, category: value === 'all' ? undefined : value }),
      options: [
        { value: 'all', label: 'Tất cả danh mục' },
        ...categories.map((cat) => ({
          value: cat.id.toString(),
          label: cat.name,
        })),
      ],
    },
    {
      id: 'status',
      type: 'select' as const,
      placeholder: 'Trạng thái',
      value: filters.status || 'all',
      onChange: (value: string) =>
        setFilters({ ...filters, status: value === 'all' ? undefined : value as any }),
      options: [
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'PENDING', label: 'Chờ duyệt' },
        { value: 'APPROVED', label: 'Đã duyệt' },
        { value: 'REJECTED', label: 'Từ chối' },
        { value: 'DRAFT', label: 'Nháp' },
        { value: 'DISABLED', label: 'Vô hiệu' },
      ],
    },
    {
      id: 'sort',
      type: 'select' as const,
      placeholder: 'Sắp xếp',
      value: filters.sortBy || 'newest',
      onChange: (value: string) =>
        setFilters({ ...filters, sortBy: value as any }),
      options: [
        { value: 'newest', label: 'Mới nhất' },
        { value: 'oldest', label: 'Cũ nhất' },
        { value: 'price', label: 'Giá cao nhất' },
        { value: 'rating', label: 'Đánh giá cao' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with StandardPageHeading */}
      <StandardPageHeading
        title="Quản lý khóa học"
        description="Quản lý và theo dõi tất cả khóa học trên hệ thống"
        icon={BookOpen}
        gradientFrom="from-purple-600"
        gradientVia="via-purple-600"
        gradientTo="to-purple-500"
        statistics={[
          {
            label: 'Tổng khóa học',
            value: courses.length,
          },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <StandardFilters filters={filterConfigs} />
        </div>

      {/* Course Grid */}
      {paginatedCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Không tìm thấy khóa học nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {paginatedCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={convertToPendingCourse(course)}
                onClick={() => handleCourseClick(course.id)}
                variant="management"
                showPendingBadge={true}
                showDraftBadge={false}
                buttonText="Xem chi tiết"
                languages={languages}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={filteredCourses.length}
              limit={itemsPerPage}
              isLoading={loading}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
      </div>
    </div>
  );
}
