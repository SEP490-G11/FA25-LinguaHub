import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ApplicationList } from './components/application-list';
import { Application } from './types';
import { tutorApprovalApi as tutorApi } from './api';
import { routeHelpers } from '@/constants/routes';
import { StandardPageHeading, StandardFilters } from '@/components/shared';

export default function TutorApproval() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Query: Fetch all applications (not just pending)
  const {
    data: applicationsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tutor-applications', searchQuery, statusFilter],
    queryFn: () =>
      tutorApi.getAllApplications(1, 100, {
        search: searchQuery,
        status: statusFilter,
      }),
  });

  const applications = applicationsData?.data || [];
  const pendingCount = applications.filter((app) => app.status === 'pending').length;
  const approvedCount = applications.filter((app) => app.status === 'approved').length;
  const rejectedCount = applications.filter((app) => app.status === 'rejected').length;
  const totalCount = applications.length;

  const handleViewDetail = (application: Application) => {
    // Navigate to detail page instead of opening modal
    navigate(routeHelpers.adminTutorApprovalDetail(application.id));
  };

  // Prepare filter configurations for StandardFilters
  const filterConfigs = [
    {
      id: 'search',
      type: 'search' as const,
      placeholder: 'Tìm theo tên hoặc ngôn ngữ...',
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'status',
      type: 'select' as const,
      placeholder: 'Trạng thái',
      value: statusFilter || 'all',
      onChange: (value: string) => setStatusFilter(value === 'all' ? '' : value),
      options: [
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'pending', label: 'Chờ duyệt' },
        { value: 'approved', label: 'Đã duyệt' },
        { value: 'rejected', label: 'Từ chối' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with StandardPageHeading */}
      <StandardPageHeading
        title="Quản lý đơn đăng ký giảng viên"
        description="Xem xét và phê duyệt đơn đăng ký trở thành giảng viên"
        icon={Users}
        gradientFrom="from-purple-600"
        gradientVia="via-purple-600"
        gradientTo="to-purple-500"
        statistics={[
          {
            label: 'Tổng đơn',
            value: totalCount,
          },
          {
            label: 'Chờ duyệt',
            value: pendingCount,
          },
          {
            label: 'Đã duyệt',
            value: approvedCount,
          },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <StandardFilters filters={filterConfigs} />
        </div>

        {/* ========== APPLICATION LIST SECTION ========== */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
              <p className="text-gray-700 font-semibold text-lg">Đang tải đơn đăng ký...</p>
              <p className="text-gray-500 text-sm mt-2">Vui lòng đợi trong khi chúng tôi tải dữ liệu</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-md border border-red-100 p-16 text-center hover:shadow-lg transition-all">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 via-red-100 to-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Lỗi tải đơn đăng ký</h3>
            <p className="text-gray-600 text-lg">{(error as Error).message}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-purple-100 p-16 text-center hover:shadow-lg transition-all">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-purple-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Không tìm thấy đơn đăng ký</h3>
            <p className="text-gray-600 text-lg">
              {searchQuery || statusFilter
                ? 'Thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc'
                : 'Tất cả đơn đăng ký đã được xem xét!'}
            </p>
          </div>
        ) : (
          <ApplicationList
            applications={applications}
            onViewDetails={handleViewDetail}
          />
        )}
      </div>
    </div>
  );
}
