import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, CreditCard, Filter } from 'lucide-react';
import { tutorPaymentApi } from './api';
import { Payment } from './types';
import { calculateStats } from './utils';
import { Filters, PaymentTable, PaymentStats } from './components';
import { StandardPageHeading } from '@/components/shared';

export default function TutorPaymentPage() {
  // State management
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  /**
   * Fetch payments from API
   */
  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await tutorPaymentApi.getTutorPayments();
      setPayments(data);
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
    fetchPayments();
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedStatus('all');
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'all' ||
    selectedStatus !== 'all';

  // Fetch payments on mount
  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter payments client-side
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          payment.orderCode.toLowerCase().includes(query) ||
          payment.userId.toString().includes(query) ||
          payment.description.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // Type filter
      if (selectedType !== 'all' && payment.paymentType !== selectedType) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && payment.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [payments, searchQuery, selectedType, selectedStatus]);

  // Calculate statistics from filtered payments
  const stats = calculateStats(filteredPayments);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== STICKY HEADER ========== */}
      <div>
        {/* Page Heading with Stats */}
        <StandardPageHeading
          title="Thu nhập của tôi"
          description="Theo dõi các giao dịch thanh toán"
          icon={CreditCard}
          gradientFrom="from-blue-600"
          gradientVia="via-blue-700"
          gradientTo="to-indigo-700"
        >
          <PaymentStats stats={stats} isLoading={isLoading} />
        </StandardPageHeading>

        {/* Filters Bar */}
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1">
                <Filters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                  selectedStatus={selectedStatus}
                  onStatusChange={setSelectedStatus}
                />
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
      <div className="max-w-[1600px] mx-auto px-6 py-6">
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
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Đang tải giao dịch...</p>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
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
          <PaymentTable payments={filteredPayments} />
        )}
      </div>
    </div>
  );
}
