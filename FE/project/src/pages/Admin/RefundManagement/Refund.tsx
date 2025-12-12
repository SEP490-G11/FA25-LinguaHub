import { useState, useEffect } from 'react';
import { Filter, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/config/axiosConfig';
import { useToast } from '@/components/ui/use-toast';
import RefundRequestCard from './components/RefundRequestCard';

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
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  createdAt: string;
  processedAt: string | null;
  tutorId: number;
}

interface UserInfo {
  userID: number;
  fullName: string;
  avatarURL: string | null;
  email: string;
}

type FilterStatus = 'ALL' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
type SortOrder = 'newest' | 'oldest';

const AdminRefundManagement = () => {
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RefundRequest[]>([]);
  const [displayedRequests, setDisplayedRequests] = useState<RefundRequest[]>([]);
  const [usersMap, setUsersMap] = useState<Map<number, UserInfo>>(new Map());
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const itemsPerPage = 6;

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const users: UserInfo[] = response.data.result || [];
      const map = new Map<number, UserInfo>();
      users.forEach((user) => map.set(user.userID, user));
      setUsersMap(map);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/refund/all');
      setRefundRequests(response.data.result);
      filterRequests(response.data.result, activeFilter);
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách yêu cầu hoàn tiền',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRefundRequests();
  }, []);

  const filterRequests = (requests: RefundRequest[], filter: FilterStatus) => {
    if (filter === 'ALL') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(req => req.status === filter));
    }
  };

  const handleFilterChange = (filter: FilterStatus) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    filterRequests(refundRequests, filter);
  };

  const handleSortChange = (order: SortOrder) => {
    setSortOrder(order);
    setCurrentPage(1);
  };

  // Apply sorting and pagination
  useEffect(() => {
    let sorted = [...filteredRequests];
    
    // Sort by date
    sorted.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Paginate
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedRequests(sorted.slice(startIndex, endIndex));
  }, [filteredRequests, sortOrder, currentPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handleApprove = async (id: number) => {
    try {
      const response = await api.put(`/admin/refund/${id}/approve`);
      if (response.data.code === 0) {
        toast({
          title: 'Hoàn thành',
          description: 'Đã xác nhận chuyển tiền hoàn thành công',
        });
        fetchRefundRequests();
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xác nhận hoàn thành',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: number) => {
    try {
      const response = await api.put(`/admin/refund/${id}/reject`);
      if (response.data.code === 0) {
        toast({
          title: 'Đã xác nhận',
          description: 'Đã xác nhận chuyển tiền thất bại',
        });
        fetchRefundRequests();
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xác nhận thất bại',
        variant: 'destructive',
      });
    }
  };

  const stats = {
    pending: refundRequests.filter(r => r.status === 'PENDING').length,
    submitted: refundRequests.filter(r => r.status === 'SUBMITTED').length,
    approved: refundRequests.filter(r => r.status === 'APPROVED').length,
    rejected: refundRequests.filter(r => r.status === 'REJECTED').length,
    // Tiền đã duyệt (APPROVED)
    approvedAmount: refundRequests
      .filter(r => r.status === 'APPROVED')
      .reduce((acc, r) => acc + r.refundAmount, 0),
    // Tiền đang đợi (PENDING + SUBMITTED)
    pendingAmount: refundRequests
      .filter(r => r.status === 'PENDING' || r.status === 'SUBMITTED')
      .reduce((acc, r) => acc + r.refundAmount, 0),
    // Tiền bị hủy (REJECTED)
    rejectedAmount: refundRequests
      .filter(r => r.status === 'REJECTED')
      .reduce((acc, r) => acc + r.refundAmount, 0),
  };

  const filters: { value: FilterStatus; label: string }[] = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'SUBMITTED', label: 'Đã gửi' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Từ chối' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-600 to-purple-500 rounded-2xl shadow-lg p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Quản lý hoàn tiền</h1>
          <p className="text-purple-100 text-lg">Xem xét và xử lý các yêu cầu hoàn tiền từ học viên</p>

          {/* Stats - Số lượng */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-300" />
                <span className="text-sm text-purple-100 font-medium">Chờ xử lý</span>
              </div>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-purple-300" />
                <span className="text-sm text-purple-100 font-medium">Đã gửi</span>
              </div>
              <p className="text-3xl font-bold">{stats.submitted}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                <span className="text-sm text-purple-100 font-medium">Đã duyệt</span>
              </div>
              <p className="text-3xl font-bold">{stats.approved}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-300" />
                <span className="text-sm text-purple-100 font-medium">Từ chối</span>
              </div>
              <p className="text-3xl font-bold">{stats.rejected}</p>
            </div>
          </div>

          {/* Stats - Tiền */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-400/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-200" />
                <span className="text-sm text-green-100 font-medium">Tiền đã duyệt</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.approvedAmount.toLocaleString()} đ</p>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-200" />
                <span className="text-sm text-amber-100 font-medium">Tiền đang đợi</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.pendingAmount.toLocaleString()} đ</p>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-400/30">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-200" />
                <span className="text-sm text-red-100 font-medium">Tiền bị hủy</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.rejectedAmount.toLocaleString()} đ</p>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Filter className="w-5 h-5 text-purple-600" />
                <span>Lọc theo trạng thái:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.value}
                    onClick={() => handleFilterChange(filter.value)}
                    variant={activeFilter === filter.value ? 'default' : 'outline'}
                    className={activeFilter === filter.value ? 'bg-purple-600 hover:bg-purple-700' : ''}
                    size="sm"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort by Date */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 font-medium">Sắp xếp:</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSortChange('newest')}
                  variant={sortOrder === 'newest' ? 'default' : 'outline'}
                  className={sortOrder === 'newest' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  size="sm"
                >
                  Mới nhất
                </Button>
                <Button
                  onClick={() => handleSortChange('oldest')}
                  variant={sortOrder === 'oldest' ? 'default' : 'outline'}
                  className={sortOrder === 'oldest' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  size="sm"
                >
                  Cũ nhất
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-slate-600">Đang tải danh sách yêu cầu hoàn tiền...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p>Không có yêu cầu hoàn tiền nào.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {displayedRequests.map((request) => (
                <RefundRequestCard
                  key={request.refundRequestId}
                  request={request}
                  userInfo={usersMap.get(request.userId)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Trước
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      variant={currentPage === page ? 'default' : 'outline'}
                      className={currentPage === page ? 'bg-purple-600 hover:bg-purple-700' : ''}
                      size="sm"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminRefundManagement;
