import  { useState, useEffect } from 'react';
import HeroSection from './components/sections/hero-section';
import FiltersSection from './components/sections/filters-section';
import RefundList from './components/sections/refund-list';
import api from '@/config/axiosConfig.ts';
import Pagination from '@/pages/RefundRequests/components/sections/pagination.tsx';
import { useUser } from '@/contexts/UserContext';

interface RefundRequest {
  refundRequestId: number;
  bookingPlanId: number;
  slotId: number;
  userId: number;
  packageId: number | null;
  refundAmount: number;
  bankAccountNumber: string | null;
  bankOwnerName: string | null;
  bankName: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'SUBMITTED';
  createdAt: string;
  processedAt: string | null;
}

const RefundRequests = () => {
  const { user } = useUser();
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [allUserRequests, setAllUserRequests] = useState<RefundRequest[]>([]); // Tất cả đơn của user (để tính stats)
  const [allRefundRequests, setAllRefundRequests] = useState<RefundRequest[]>([]); // Các đơn cần hiển thị
  const [displayedRequests, setDisplayedRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const currentUserId = user?.userID || 0;
  const isStudentView = true;
  const itemsPerPage = 6;

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/refund/all');
      // Lọc tất cả các đơn của user hiện tại
      const userRequests = response.data.result.filter(
          (request: RefundRequest) => request.userId === currentUserId
      );
      setAllUserRequests(userRequests);
      
      // Hiển thị TẤT CẢ các đơn của user (không lọc gì cả)
      setAllRefundRequests(userRequests);
    } catch (error) {
      console.error('Lỗi khi tải danh sách yêu cầu hoàn tiền', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data once on component mount
  useEffect(() => {
    if (currentUserId) {
      fetchRefundRequests();
    }
  }, [currentUserId]);

  // Reset page to 1 when filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, sortOrder]);

  // Compute displayed requests and pagination whenever all data, filter, sort, or page changes
  useEffect(() => {
    let filteredByStatus = allRefundRequests.filter((r) => {
      if (activeFilter === 'all') return true;
      // Gộp APPROVED và PROCESSED thành "processed"
      if (activeFilter === 'processed') {
        return r.status === 'APPROVED' || r.status === 'PROCESSED';
      }
      return r.status.toLowerCase() === activeFilter;
    });

    // Sort by date
    filteredByStatus.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const total = filteredByStatus.length;
    setTotalPages(Math.ceil(total / itemsPerPage));
    const paged = filteredByStatus.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    setDisplayedRequests(paged);
  }, [allRefundRequests, activeFilter, sortOrder, currentPage]);

  // Stats calculated from all user requests (not just displayed ones)
  const stats = {
    pending: allUserRequests.filter((r) => r.status === 'PENDING').length,
    submitted: allUserRequests.filter((r) => r.status === 'SUBMITTED').length,
    // Gộp APPROVED và PROCESSED thành "Đã xử lý"
    processed: allUserRequests.filter((r) => r.status === 'APPROVED' || r.status === 'PROCESSED').length,
    rejected: allUserRequests.filter((r) => r.status === 'REJECTED').length,
    // Tiền đã nhận (APPROVED + PROCESSED)
    totalAmount: allUserRequests
        .filter((r) => r.status === 'APPROVED' || r.status === 'PROCESSED')
        .reduce((acc, r) => acc + r.refundAmount, 0),
    // Tiền đang đợi (PENDING + SUBMITTED)
    pendingAmount: allUserRequests
        .filter((r) => r.status === 'PENDING' || r.status === 'SUBMITTED')
        .reduce((acc, r) => acc + r.refundAmount, 0),
    // Tiền bị từ chối (REJECTED)
    rejectedAmount: allUserRequests
        .filter((r) => r.status === 'REJECTED')
        .reduce((acc, r) => acc + r.refundAmount, 0),
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <HeroSection stats={stats} />

          <FiltersSection 
            activeFilter={activeFilter} 
            onFilterChange={setActiveFilter}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />

          {loading ? (
              <div className="text-center py-16">
                <p>Đang tải danh sách yêu cầu hoàn tiền...</p>
              </div>
          ) : displayedRequests.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <p>Không có yêu cầu hoàn tiền nào.</p>
              </div>
          ) : (
              <RefundList
                  requests={displayedRequests}
                  currentUserId={currentUserId}
                  isStudentView={isStudentView}
                  onRefresh={fetchRefundRequests}
              />
          )}
          <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
  );
};

export default RefundRequests;