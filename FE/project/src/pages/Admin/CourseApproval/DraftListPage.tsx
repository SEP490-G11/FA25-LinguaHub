import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, CheckCircle2, FileEdit, ArrowLeft } from 'lucide-react';
import axios from '@/config/axiosConfig';
import { PendingCourse, PaginatedResponse, ApprovalFilters } from './types';
import { CourseCard, Pagination } from './components';
import { ROUTES, routeHelpers } from '@/constants/routes';
import { StandardPageHeading, StandardFilters } from '@/components/shared';

export default function DraftListPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<PendingCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchDrafts = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch draft courses with PENDING_REVIEW status
      const response = await axios.get('/admin/courses/drafts', {
        params: { status: 'PENDING_REVIEW' }
      });

      let draftCourses = response?.data?.result || [];

      // Map to PendingCourse format
      let allDrafts: PendingCourse[] = draftCourses.map((draft: any) => ({
        id: draft.draftID,
        title: draft.title,
        shortDescription: draft.shortDescription || '',
        description: draft.description || '',
        requirement: draft.requirement || '',
        level: draft.level || 'BEGINNER',
        categoryID: 0,
        categoryName: draft.categoryName || 'Unknown',
        language: draft.language || 'English',
        duration: draft.duration || 0,
        price: draft.price || 0,
        thumbnailURL: draft.thumbnailURL || '',
        status: 'Pending Review', // Draft courses have "Pending Review" status
        tutorID: 0,
        tutorName: draft.tutorName,
        tutorEmail: draft.tutorEmail,
        createdAt: draft.createdAt || new Date().toISOString(),
        updatedAt: draft.updatedAt || new Date().toISOString(),
        isDraft: true,
      }));

      // Apply filters
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        allDrafts = allDrafts.filter(
          (draft) =>
            draft.title.toLowerCase().includes(searchLower) ||
            draft.tutorName?.toLowerCase().includes(searchLower)
        );
      }

      if (selectedCategory && selectedCategory !== 'all') {
        allDrafts = allDrafts.filter(
          (draft) => draft.categoryID === parseInt(selectedCategory)
        );
      }

      // Sort by createdAt (newest first)
      allDrafts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply pagination
      const totalCount = allDrafts.length;
      const pages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const paginatedDrafts = allDrafts.slice(startIndex, startIndex + limit);

      setDrafts(paginatedDrafts);
      setTotalPages(pages);
      setTotal(totalCount);
      setCurrentPage(page);
    } catch (err: any) {
      
      // Handle specific error cases
      if (err?.response?.status === 403) {
        setError('Bạn không có quyền truy cập trang này');
        // Redirect to dashboard after showing error
        setTimeout(() => navigate(ROUTES.ADMIN_DASHBOARD), 2000);
      } else if (err?.response?.status === 404) {
        setError('Không tìm thấy danh sách khóa học cập nhật');
      } else if (!err?.response) {
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn');
      } else {
        setError(err?.response?.data?.message || err.message || 'Không thể tải danh sách khóa học cập nhật');
      }
      
      setDrafts([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts(1);
  }, [searchQuery, selectedCategory]);

  const handleDraftClick = (draftId: number) => {
    navigate(routeHelpers.adminCourseApprovalDraftDetail(draftId));
  };

  // Prepare filter configurations for StandardFilters
  const filterConfigs = [
    {
      id: 'search',
      type: 'search' as const,
      placeholder: 'Tìm theo tên khóa học hoặc giảng viên...',
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'category',
      type: 'select' as const,
      placeholder: 'Danh mục',
      value: selectedCategory,
      onChange: setSelectedCategory,
      options: [
        { value: 'all', label: 'Tất cả' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Button
            onClick={() => navigate(ROUTES.ADMIN_COURSE_APPROVAL)}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>

      {/* Header with StandardPageHeading */}
      <StandardPageHeading
        title="Phê duyệt cập nhật khóa học"
        description="Xem xét các bản cập nhật từ giảng viên"
        icon={FileEdit}
        gradientFrom="from-purple-600"
        gradientVia="via-purple-600"
        gradientTo="to-purple-500"
        statistics={[
          {
            label: 'Chờ xem xét',
            value: total,
          },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <StandardFilters filters={filterConfigs} />
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3 justify-between">
              <div className="flex items-start gap-3 flex-1">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 mb-1">Lỗi tải dữ liệu</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
              <button 
                onClick={() => setError(null)} 
                className="text-red-600 hover:text-red-800 flex-shrink-0"
                aria-label="Đóng thông báo lỗi"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => fetchDrafts(currentPage)}
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Thử lại
              </Button>
              <Button
                onClick={() => navigate(ROUTES.ADMIN_COURSE_APPROVAL)}
                size="sm"
                variant="ghost"
                className="text-red-700 hover:bg-red-100"
              >
                Quay lại trang chính
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Đang tải khóa học cập nhật...</p>
            </div>
          </div>
        ) : drafts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không có khóa học cập nhật nào đang chờ xem xét
            </h3>
            <p className="text-gray-500 text-sm">
              {searchQuery || selectedCategory !== 'all'
                ? 'Không tìm thấy khóa học phù hợp'
                : 'Tất cả bản cập nhật đã được xem xét'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6">
              {drafts.map((draft) => (
                <CourseCard 
                  key={draft.id} 
                  course={draft} 
                  onClick={() => handleDraftClick(draft.id)}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              limit={limit}
              isLoading={isLoading}
              onPageChange={fetchDrafts}
            />
          </>
        )}
      </div>
    </div>
  );
}
