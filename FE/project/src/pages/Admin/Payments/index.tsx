import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, CreditCard, Filter, DollarSign, CheckCircle } from 'lucide-react';
import { StandardPageHeading, PageHeadingStatistic, StandardFilters, FilterConfig } from '@/components/shared';
import { paymentApi } from './api';
import { Payment, PaymentFilters } from './types';
import { calculateStats, formatCurrency } from './utils';
import { PaymentTable, Pagination } from './components';

export default function PaymentManagementPage() {

  // State management
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  /**
   * Fetch payments from API with pagination and filters
   */
  const fetchPayments = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      // Build filter object
      const filters: PaymentFilters = {};

      if (searchQuery.trim()) {
        filters.search = searchQuery;
      }
      if (selectedType && selectedType !== 'all') {
        filters.type = selectedType as any;
      }
      if (selectedStatus && selectedStatus !== 'all') {
        filters.status = selectedStatus as any;
      }
      if (selectedMethod && selectedMethod !== 'all') {
        filters.method = selectedMethod as any;
      }

      const response = await paymentApi.getPayments(page, limit, filters);

      setPayments(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách giao dịch');
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    fetchPayments(currentPage);
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedMethod('all');
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'all' ||
    selectedStatus !== 'all' ||
    selectedMethod !== 'all';

  // Fetch payments on mount and when filters change
  useEffect(() => {
    fetchPayments(1);
  }, [searchQuery, selectedType, selectedStatus, selectedMethod]);

  // Calculate statistics from current payments
  const stats = calculateStats(payments);

  // Prepare statistics for StandardPageHeading
  const headingStatistics: PageHeadingStatistic[] = [
    {
      label: 'Tổng giao dịch',
      value: stats.totalPayments.toString(),
      icon: CreditCard,
    },
    {
      label: 'Tổng doanh thu',
      value: formatCurrency(stats.totalAmount),
      icon: DollarSign,
    },
    {
      label: 'Đã thanh toán',
      value: stats.paidCount.toString(),
      icon: CheckCircle,
    },
  ];

  // Configure filters for StandardFilters component
  const filterConfigs: FilterConfig[] = [
    {
      id: 'search',
      type: 'search',
      placeholder: 'Tìm theo mã đơn, ID người dùng, mô tả...',
      value: searchQuery,
      onChange: setSearchQuery,
    },
    {
      id: 'payment-type',
      type: 'select',
      placeholder: 'Loại thanh toán',
      value: selectedType,
      onChange: setSelectedType,
      options: [
        { value: 'all', label: 'Tất cả' },
        { value: 'Course', label: 'Khóa học' },
        { value: 'Booking', label: 'Đặt lịch' },
        { value: 'Subscription', label: 'Đăng ký' },
      ],
    },
    {
      id: 'payment-status',
      type: 'select',
      placeholder: 'Trạng thái',
      value: selectedStatus,
      onChange: setSelectedStatus,
      options: [
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'PAID', label: 'Đã thanh toán' },
        { value: 'PENDING', label: 'Chờ thanh toán' },
        { value: 'REFUNDED', label: 'Đã hoàn tiền' },
        { value: 'FAILED', label: 'Thất bại' },
      ],
    },
    {
      id: 'payment-method',
      type: 'select',
      placeholder: 'Phương thức',
      value: selectedMethod,
      onChange: setSelectedMethod,
      options: [
        { value: 'all', label: 'Tất cả' },
        { value: 'PAYOS', label: 'PayOS' },
        { value: 'MOMO', label: 'MoMo' },
        { value: 'VNPAY', label: 'VNPay' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== STICKY HEADER ========== */}
      <div>
        {/* Page Heading with Statistics */}
        <StandardPageHeading
          title="Quản lý thanh toán"
          description="Theo dõi và quản lý giao dịch thanh toán"
          icon={CreditCard}
          gradientFrom="from-purple-600"
          gradientVia="via-purple-600"
          gradientTo="to-purple-500"
          statistics={headingStatistics}
        />

        {/* Filters Bar */}
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1">
                <StandardFilters filters={filterConfigs} />
              </div>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                size="sm"
                disabled={!hasActiveFilters}
              >
                Đặt lại
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Error State */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <Button
                onClick={handleRetry}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-800"
              >
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Đang tải giao dịch...</p>
            </div>
          </div>
        ) : payments.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không có giao dịch
            </h3>
            <p className="text-gray-500 text-sm">
              {hasActiveFilters
                ? 'Không tìm thấy giao dịch phù hợp với bộ lọc'
                : 'Chưa có giao dịch thanh toán nào'}
            </p>
          </div>
        ) : (
          /* Payment Table */
          <>
            <PaymentTable payments={payments} />

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                limit={limit}
                isLoading={isLoading}
                onPageChange={fetchPayments}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
