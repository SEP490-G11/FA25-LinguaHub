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
  reason: string | null;
  refundType: 'COMPLAINT' | 'TUTOR_RESCHEDULE' | 'SLOT_REJECT' | null;
  learnerJoin: boolean | null;
  tutorJoin: boolean | null;
  learnerEvidence: string | null;
  tutorEvidence: string | null;
}

interface UserInfo {
  userID: number;
  fullName: string;
  avatarURL: string | null;
  email: string;
}

interface TutorInfo {
  tutorID: number;
  fullName: string;
  avatarURL: string | null;
  email: string;
}

interface SlotInfo {
  slotID: number;
  startTime: string;
  endTime: string;
  // Thêm các trường để lấy từ API slots/paid
  learnerJoin: boolean | null;
  tutorJoin: boolean | null;
  learnerEvidence: string | null;
  tutorEvidence: string | null;
  reason: string | null;
}

type FilterStatus = 'ALL' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
type SortOrder = 'newest' | 'oldest';

const AdminRefundManagement = () => {
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RefundRequest[]>([]);
  const [displayedRequests, setDisplayedRequests] = useState<RefundRequest[]>([]);
  const [usersMap, setUsersMap] = useState<Map<number, UserInfo>>(new Map());
  const [tutorsMap, setTutorsMap] = useState<Map<number, TutorInfo>>(new Map());
  const [slotsMap, setSlotsMap] = useState<Map<number, SlotInfo>>(new Map());
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

  const fetchTutors = async () => {
    try {
      // Gọi API /admin/tutors/all để lấy tất cả tutors (bao gồm cả suspended)
      const response = await api.get('/admin/tutors/all');
      const tutors = response.data || [];
      const map = new Map<number, TutorInfo>();
      tutors.forEach((tutor: any) => {
        const tutorId = tutor.tutorId ?? tutor.tutorID ?? tutor.tutor_id;
        if (tutorId) {
          map.set(tutorId, {
            tutorID: tutorId,
            fullName: tutor.userName || tutor.fullName || tutor.user?.fullName || 'Tutor',
            avatarURL: tutor.avatarURL || tutor.avatar_url || tutor.user?.avatarURL || null,
            email: tutor.userEmail || tutor.email || tutor.user?.email || '',
          });
        }
      });
      setTutorsMap(map);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      // Fallback: thử gọi /tutors/approved nếu admin API không hoạt động
      try {
        const fallbackResponse = await api.get('/tutors/approved');
        const tutors = fallbackResponse.data || [];
        const map = new Map<number, TutorInfo>();
        tutors.forEach((tutor: any) => {
          const tutorId = tutor.tutorId ?? tutor.tutorID ?? tutor.tutor_id;
          if (tutorId) {
            map.set(tutorId, {
              tutorID: tutorId,
              fullName: tutor.userName || tutor.fullName || 'Tutor',
              avatarURL: tutor.avatarURL || tutor.avatar_url || null,
              email: tutor.userEmail || tutor.email || '',
            });
          }
        });
        setTutorsMap(map);
      } catch (fallbackError) {
        console.error('Error fetching tutors (fallback):', fallbackError);
      }
    }
  };

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/refund/all');
      const rawRefunds = response.data.result || response.data || [];
      
      console.log('[Admin Refund] Raw API response:', response.data);
      console.log('[Admin Refund] Raw refunds count:', rawRefunds.length);
      
      // Transform API response để handle cả camelCase và snake_case
      const refunds: RefundRequest[] = rawRefunds.map((r: any) => ({
        refundRequestId: r.refundRequestId ?? r.refund_request_id ?? 0,
        bookingPlanId: r.bookingPlanId ?? r.booking_plan_id ?? 0,
        slotId: r.slotId ?? r.slot_id ?? 0,
        userId: r.userId ?? r.user_id ?? 0,
        packageId: r.packageId ?? r.package_id ?? null,
        refundAmount: r.refundAmount ?? r.refund_amount ?? 0,
        bankAccountNumber: r.bankAccountNumber ?? r.bank_account_number ?? null,
        bankOwnerName: r.bankOwnerName ?? r.bank_owner_name ?? null,
        bankName: r.bankName ?? r.bank_name ?? null,
        status: r.status ?? 'PENDING',
        createdAt: r.createdAt ?? r.created_at ?? '',
        processedAt: r.processedAt ?? r.processed_at ?? null,
        tutorId: r.tutorId ?? r.tutor_id ?? 0,
        reason: r.reason ?? null,
        refundType: r.refundType ?? r.refund_type ?? null,
        learnerJoin: r.learnerAttend ?? r.learner_attend ?? r.learnerJoin ?? r.learner_join ?? null,
        tutorJoin: r.tutorAttend ?? r.tutor_attend ?? r.tutorJoin ?? r.tutor_join ?? null,
        learnerEvidence: r.learnerEvidence ?? r.learner_evidence ?? null,
        tutorEvidence: r.tutorEvidence ?? r.tutor_evidence ?? null,
      }));
      
      console.log('[Admin Refund] Transformed refunds:', refunds);
      
      setRefundRequests(refunds);
      filterRequests(refunds, activeFilter);
      
      // Fetch slot info cho các refund requests
      await fetchSlotsInfo(refunds);
    } catch (error: any) {
      console.error('[Admin Refund] Error fetching refund requests:', error);
      console.error('[Admin Refund] Error response:', error.response?.data);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải danh sách yêu cầu hoàn tiền',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch thông tin slots từ API /booking-slots/public/tutors/{tutorId}/slots/paid
  // Mỗi refund sẽ call API riêng để lấy đúng dữ liệu slot tương ứng
  const fetchSlotsInfo = async (refunds: RefundRequest[]) => {
    try {
      const map = new Map<number, SlotInfo>();
      
      // Lấy danh sách unique tutorIds từ refunds
      const tutorIds = [...new Set(refunds.map(r => r.tutorId))];
      
      console.log('[Admin Refund] Fetching slots for tutors:', tutorIds);
      
      // Fetch slots cho từng tutor từ API /booking-slots/public/tutors/{tutorId}/slots/paid
      for (const tutorId of tutorIds) {
        try {
          const paidResponse = await api.get(`/booking-slots/public/tutors/${tutorId}/slots/paid`);
          const paidSlots = paidResponse.data || [];
          
          console.log(`[Admin Refund] Tutor ${tutorId} paid slots:`, paidSlots);
          
          paidSlots.forEach((slot: any) => {
            const slotId = slot.slotID ?? slot.slotId ?? slot.slot_id;
            if (slotId) {
              // Lấy đầy đủ thông tin từ slot bao gồm learnerJoin, tutorJoin, evidence
              map.set(slotId, {
                slotID: slotId,
                startTime: slot.startTime ?? slot.start_time ?? '',
                endTime: slot.endTime ?? slot.end_time ?? '',
                // Lấy thông tin điểm danh và bằng chứng từ slot
                learnerJoin: slot.learnerAttend ?? slot.learner_attend ?? slot.learnerJoin ?? slot.learner_join ?? null,
                tutorJoin: slot.tutorAttend ?? slot.tutor_attend ?? slot.tutorJoin ?? slot.tutor_join ?? null,
                learnerEvidence: slot.learnerEvidence ?? slot.learner_evidence ?? null,
                tutorEvidence: slot.tutorEvidence ?? slot.tutor_evidence ?? null,
                reason: slot.reason ?? slot.complaintReason ?? slot.complaint_reason ?? null,
              });
              
              console.log(`[Admin Refund] Slot ${slotId} info:`, {
                learnerJoin: slot.learnerAttend ?? slot.learner_attend ?? slot.learnerJoin,
                tutorJoin: slot.tutorAttend ?? slot.tutor_attend ?? slot.tutorJoin,
                learnerEvidence: slot.learnerEvidence ?? slot.learner_evidence,
                tutorEvidence: slot.tutorEvidence ?? slot.tutor_evidence,
              });
            }
          });
        } catch (err) {
          console.error(`[Admin Refund] Error fetching paid slots for tutor ${tutorId}:`, err);
        }
      }
      
      setSlotsMap(map);
      
      // Cập nhật refund requests với dữ liệu từ slots
      const updatedRefunds = refunds.map(refund => {
        const slotData = map.get(refund.slotId);
        if (slotData) {
          return {
            ...refund,
            // Override với dữ liệu từ slot API (nguồn chính xác hơn)
            learnerJoin: slotData.learnerJoin,
            tutorJoin: slotData.tutorJoin,
            learnerEvidence: slotData.learnerEvidence ?? refund.learnerEvidence,
            tutorEvidence: slotData.tutorEvidence ?? refund.tutorEvidence,
            reason: slotData.reason ?? refund.reason,
          };
        }
        return refund;
      });
      
      console.log('[Admin Refund] Updated refunds with slot data:', updatedRefunds);
      
      setRefundRequests(updatedRefunds);
      filterRequests(updatedRefunds, activeFilter);
      
    } catch (error) {
      console.error('[Admin Refund] Error fetching slots info:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTutors();
    fetchRefundRequests();
  }, []);

  const filterRequests = (requests: RefundRequest[], filter: FilterStatus) => {
    // Hiển thị tất cả refund requests, không loại trừ gì
    console.log('[Admin Refund] Total requests:', requests.length);
    
    if (filter === 'ALL') {
      setFilteredRequests(requests);
    } else {
      const filtered = requests.filter(req => req.status === filter);
      console.log(`[Admin Refund] After status filter (${filter}):`, filtered.length);
      setFilteredRequests(filtered);
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

  // Tính stats từ tất cả refund requests
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
                  tutorInfo={tutorsMap.get(request.tutorId)}
                  slotInfo={slotsMap.get(request.slotId)}
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
