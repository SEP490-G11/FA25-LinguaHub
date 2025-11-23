import  { useState, useEffect } from 'react';
import HeroSection from './components/sections/hero-section';
import FiltersSection from './components/sections/filters-section';
import RefundList from './components/sections/refund-list';
import api from '@/config/axiosConfig.ts';
import Pagination from '@/pages/RefundRequests/components/sections/pagination.tsx';

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
  const [activeFilter, setActiveFilter] = useState('all'); // bộ lọc mặc định là 'all'
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest'); // Sắp xếp theo ngày
  const [allRefundRequests, setAllRefundRequests] = useState<RefundRequest[]>([]);
  const [displayedRequests, setDisplayedRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const currentUserId = 3; // User ID from the logged-in context
  const isStudentView = true;
  const itemsPerPage = 6;

  // Fetch all data once on component mount
  useEffect(() => {
    const fetchRefundRequests = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/refund/all'); // Fetch all without params for client-side filtering
        const filteredByUser = response.data.result.filter(
            (request: RefundRequest) => request.userId === currentUserId
        );
        setAllRefundRequests(filteredByUser);
      } catch (error) {
        console.error('Error fetching refund requests', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRefundRequests();
  }, []);

  // Reset page to 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // Compute displayed requests and pagination whenever all data, filter, sort, or page changes
  useEffect(() => {
    const filteredByStatus = allRefundRequests.filter(
        (r) => activeFilter === 'all' || r.status.toLowerCase() === activeFilter
    );
    
    // Sắp xếp theo ngày
    const sorted = [...filteredByStatus].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    const total = sorted.length;
    setTotalPages(Math.ceil(total / itemsPerPage));
    const paged = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    setDisplayedRequests(paged);
  }, [allRefundRequests, activeFilter, sortOrder, currentPage]);

  // Stats calculated from all requests (overall, not filtered)
  const stats = {
    pending: allRefundRequests.filter((r) => r.status === 'PENDING').length,
    submitted: allRefundRequests.filter((r) => r.status === 'SUBMITTED').length,
    approved: allRefundRequests.filter((r) => r.status === 'APPROVED').length,
    rejected: allRefundRequests.filter((r) => r.status === 'REJECTED').length,
    approvedAmount: allRefundRequests
        .filter((r) => r.status === 'APPROVED')
        .reduce((acc, r) => acc + r.refundAmount, 0),
    rejectedAmount: allRefundRequests
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
                <p>Loading refund requests...</p>
              </div>
          ) : displayedRequests.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <p>No refund requests found for this filter.</p>
              </div>
          ) : (
              <RefundList
                  requests={displayedRequests}
                  currentUserId={currentUserId}
                  isStudentView={isStudentView}
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