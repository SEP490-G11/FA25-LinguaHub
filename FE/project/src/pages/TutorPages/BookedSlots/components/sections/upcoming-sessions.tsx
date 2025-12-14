import { useState, useEffect } from 'react';
import { Calendar, Clock, User, ExternalLink, Upload, CheckCircle, AlertTriangle, XCircle, UserCheck, Image, CalendarX, Eye, MessageSquare, Loader2, X, Package } from 'lucide-react';
import api from '@/config/axiosConfig';
import { uploadFileToBackend } from '@/utils/fileUpload';
import { toast } from 'sonner';
import type { BookedSlot, UserPackageInfo } from '../../booked-slots';

// Modal xem ảnh bằng chứng
const ImagePreviewModal = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
        <h3 className="text-lg font-bold text-slate-900">Bằng chứng đã gửi</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-slate-50 rounded-b-2xl">
        <img
          src={imageUrl}
          alt="Bằng chứng"
          className="w-full h-auto object-contain rounded-2xl"
          style={{ maxHeight: '70vh' }}
        />
      </div>
    </div>
  </div>
);

interface UpcomingSessionsProps {
  bookings: BookedSlot[];
  selectedDate: string | null;
  onRefresh?: () => void;
}

// Interface cho refund request
interface RefundInfo {
  reason: string | null;
  status: string;
  refundType: string | null;
  createdAt: string;
  tutorAttend: boolean | null;
  tutorEvidence: string | null;
  tutorRespondedAt: string | null;
}

// Modal xem chi tiết khiếu nại
interface ComplaintModalProps {
  booking: BookedSlot;
  onClose: () => void;
  onSubmitEvidence: (file: File, tutorJoined: boolean) => void;
  onAgreeRefund: () => void;
  isUploading: boolean;
  isAgreeingRefund: boolean;
  isInSlotTimeWindow: boolean;
}

const ComplaintModal = ({ booking, onClose, onSubmitEvidence, onAgreeRefund, isUploading, isAgreeingRefund, isInSlotTimeWindow }: ComplaintModalProps) => {
  const [selectedResponse, setSelectedResponse] = useState<'joined' | 'not_joined' | null>(null);
  const [refundInfo, setRefundInfo] = useState<RefundInfo | null>(null);
  const [loadingRefund, setLoadingRefund] = useState(true);

  // Fetch refund info để lấy lý do khiếu nại
  useEffect(() => {
    const fetchRefundInfo = async () => {
      try {
        setLoadingRefund(true);
        const response = await api.get('/admin/refund/all');
        const refunds = response.data.result || [];
        
        // Tìm refund request khớp với slotId và userId
        const matchingRefund = refunds.find((r: any) => {
          const slotId = r.slotId ?? r.slot_id;
          const userId = r.userId ?? r.user_id;
          return slotId === booking.slotid && userId === booking.user_id;
        });

        if (matchingRefund) {
          setRefundInfo({
            reason: matchingRefund.reason,
            status: matchingRefund.status,
            refundType: matchingRefund.refundType ?? matchingRefund.refund_type,
            createdAt: matchingRefund.createdAt ?? matchingRefund.created_at,
            tutorAttend: matchingRefund.tutorAttend ?? matchingRefund.tutor_attend ?? null,
            tutorEvidence: matchingRefund.tutorEvidence ?? matchingRefund.tutor_evidence ?? null,
            tutorRespondedAt: matchingRefund.tutorRespondedAt ?? matchingRefund.tutor_responded_at ?? null,
          });
        }
      } catch (error) {
        console.error('Error fetching refund info:', error);
      } finally {
        setLoadingRefund(false);
      }
    };

    fetchRefundInfo();
  }, [booking.slotid, booking.user_id]);

  const handleFileSelect = (tutorJoined: boolean) => {
    setSelectedResponse(tutorJoined ? 'joined' : 'not_joined');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onSubmitEvidence(file, tutorJoined);
      }
    };
    input.click();
  };

  // Xác định trạng thái phản hồi của tutor dựa trên tutorAttend + evidence
  // Logic:
  // - có tutor_evidence → Tutor đã phản đối (gửi bằng chứng)
  // - tutorAttend = false + không có tutor_evidence → Tutor đã đồng ý hoàn tiền
  // - tutorAttend = null/undefined + không có tutor_evidence → Tutor chưa phản hồi
  const getTutorResponseStatus = () => {
    const hasTutorEvidence = !!booking.tutor_evidence || !!refundInfo?.tutorEvidence;
    const tutorAttendValue = refundInfo?.tutorAttend;
    
    // Tutor đã phản đối: có tutorEvidence
    if (hasTutorEvidence) {
      return { 
        status: 'rejected', 
        label: 'Đã phản đối khiếu nại - Đang chờ Admin xem xét', 
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      };
    }
    
    // Tutor đã đồng ý hoàn tiền: tutorAttend = false + không có tutorEvidence
    if (tutorAttendValue === false) {
      return { 
        status: 'accepted', 
        label: 'Đã đồng ý hoàn tiền - Đang chờ Admin xử lý', 
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }
    
    // Tutor chưa phản hồi (tutorAttend = null/undefined)
    return { 
      status: 'pending', 
      label: 'Chưa phản hồi', 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    };
  };

  const tutorResponse = getTutorResponseStatus();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-900">Chi tiết khiếu nại</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 pt-4">

          {/* Thông tin buổi học */}
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Học viên:</span> {booking.learner_name}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Thời gian:</span>{' '}
              {new Date(booking.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(booking.start_time).toLocaleDateString('vi-VN')}
            </p>
          </div>

          {/* Lý do khiếu nại */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Lý do khiếu nại
            </h4>
            {loadingRefund ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải...
              </div>
            ) : refundInfo?.reason ? (
              <div className="bg-orange-50 rounded-lg px-3 py-2 text-sm border border-orange-200">
                <span className="text-slate-700">{refundInfo.reason}</span>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Không có lý do được cung cấp</p>
            )}
          </div>

          {/* Bằng chứng của learner */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Bằng chứng từ học viên
            </h4>
            {booking.learner_evidence ? (
              <a
                href={booking.learner_evidence}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={booking.learner_evidence}
                  alt="Bằng chứng học viên"
                  className="w-full max-h-40 object-contain rounded-lg border border-slate-200 hover:border-blue-400 transition-colors"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden text-center py-4 bg-slate-100 rounded-lg">
                  <Eye className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                  <span className="text-sm text-blue-600">Xem file đính kèm</span>
                </div>
              </a>
            ) : (
              <p className="text-sm text-slate-500 italic">Không có bằng chứng</p>
            )}
          </div>

          {/* Trạng thái phản hồi của tutor */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Phản hồi của bạn
            </h4>
            
            {/* Hiển thị trạng thái */}
            <div className={`rounded-lg px-3 py-2 text-sm border mb-3 ${tutorResponse.bgColor} ${tutorResponse.borderColor}`}>
              <span className={`font-medium ${tutorResponse.color}`}>
                Trạng thái: {tutorResponse.label}
              </span>
            </div>

            {/* Logic phân biệt trạng thái tutor dựa trên tutorAttend + evidence + learner_join */}
            {(() => {
              const hasTutorEvidence = !!booking.tutor_evidence || !!refundInfo?.tutorEvidence;
              const tutorAttendValue = refundInfo?.tutorAttend;
              
              // Tutor đã phản đối: có tutorEvidence
              if (hasTutorEvidence) {
                return (
                  <div>
                    <a
                      href={booking.tutor_evidence || refundInfo?.tutorEvidence || ''}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={booking.tutor_evidence || refundInfo?.tutorEvidence || ''}
                        alt="Bằng chứng tutor"
                        className="w-full max-h-40 object-contain rounded-lg border border-purple-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden text-center py-4 bg-purple-50 rounded-lg">
                        <Eye className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                        <span className="text-sm text-purple-600">Xem file đính kèm</span>
                      </div>
                    </a>
                    <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Bạn đã gửi bằng chứng phản đối - Đang chờ Admin xem xét
                    </p>
                  </div>
                );
              }
              
              // Tutor đã đồng ý hoàn tiền: tutorAttend = false + không có tutorEvidence
              if (tutorAttendValue === false) {
                return (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Bạn đã đồng ý hoàn tiền - Đang chờ Admin xử lý
                    </p>
                  </div>
                );
              }
              
              // Tutor chưa phản hồi - chỉ hiển thị 2 nút trong khoảng thời gian slot
              if (!isInSlotTimeWindow) {
                return (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-sm text-slate-600 italic">
                      Chỉ có thể phản hồi trong khoảng thời gian buổi học
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-3">
                  <p className="text-sm text-orange-600">Bạn chưa phản hồi khiếu nại</p>
                  <p className="text-xs text-slate-500">Chọn một trong hai lựa chọn bên dưới:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFileSelect(true)}
                      disabled={isUploading || isAgreeingRefund}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isUploading && selectedResponse === 'joined' ? 'Đang tải...' : 'Tôi đã tham gia'}
                    </button>
                    <button
                      onClick={onAgreeRefund}
                      disabled={isUploading || isAgreeingRefund}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      {isAgreeingRefund ? 'Đang xử lý...' : 'Đồng ý hoàn tiền'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    • "Tôi đã tham gia": Bạn không đồng ý với khiếu nại, cần đính kèm bằng chứng, Admin sẽ xem xét<br/>
                    • "Đồng ý hoàn tiền": Bạn đồng ý với khiếu nại, học viên sẽ được hoàn tiền
                  </p>
                </div>
              );
            })()}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Admin sẽ xem xét bằng chứng từ cả hai bên để đưa ra quyết định cuối cùng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Interface cho refund info theo slot
interface SlotRefundInfo {
  tutorAttend: boolean | null;
  tutorEvidence: string | null;
  reason: string | null;
  tutorRespondedAt: string | null;
}

const UpcomingSessions = ({
  bookings,
  selectedDate,
  onRefresh,
}: UpcomingSessionsProps) => {
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<BookedSlot | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [agreeingRefund, setAgreeingRefund] = useState<number | null>(null);
  // Lưu thông tin refund theo slotId để biết tutor đã phản hồi chưa
  const [refundInfoMap, setRefundInfoMap] = useState<Record<number, SlotRefundInfo>>({});
  // State cho modal xem gói học
  const [selectedPackage, setSelectedPackage] = useState<UserPackageInfo | null>(null);
  const [openPackageDetail, setOpenPackageDetail] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState(false);
  
  // State để cập nhật thời gian thực mỗi 10 giây
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Cập nhật thời gian mỗi 10 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // 10 giây
    
    return () => clearInterval(interval);
  }, []);
  
  // Hàm kiểm tra thời gian hiện tại có nằm trong khoảng slot không (1 tiếng)
  const isWithinSlotTime = (startTime: Date, endTime: Date): boolean => {
    return currentTime >= startTime && currentTime <= endTime;
  };

  // Hàm mở modal xem gói học - fetch từ API
  const openPackageModal = async (userPackageId: number, tutorId: number) => {
    setOpenPackageDetail(true);
    setSelectedPackage(null);
    setLoadingPackage(true);
    try {
      // Gọi API lấy danh sách packages của tutor
      const res = await api.get(`/tutor/${tutorId}/packages`, { skipAuth: true });
      const packages = res.data.packages || [];
      
      // Tìm package có packageid bằng userPackageId
      const pkg = packages.find((p: any) => p.packageid === userPackageId);
      
      if (pkg) {
        const userPackage: UserPackageInfo = {
          userPackageID: userPackageId,
          tutorPackage: {
            packageid: pkg.packageid ?? 0,
            name: pkg.name ?? '',
            description: pkg.description ?? '',
            max_slots: pkg.max_slots ?? 0,
            requirement: pkg.requirement ?? '',
            objectives: pkg.objectives ?? '',
            slot_content: pkg.slot_content ?? [],
            is_active: pkg.is_active ?? false,
          },
          slotsRemaining: pkg.max_slots ?? 0,
          isActive: pkg.is_active ?? false,
        };
        setSelectedPackage(userPackage);
      } else {
        toast.error('Không tìm thấy thông tin gói học');
        setOpenPackageDetail(false);
      }
    } catch (err) {
      console.error('Failed to fetch package:', err);
      toast.error('Không thể tải thông tin gói học');
      setOpenPackageDetail(false);
    } finally {
      setLoadingPackage(false);
    }
  };

  // Hàm fetch thông tin refund - tách ra để có thể gọi lại
  const fetchRefundInfo = async () => {
    try {
      const response = await api.get('/admin/refund/all');
      const refunds = response.data.result || [];
      
      const infoMap: Record<number, SlotRefundInfo> = {};
      refunds.forEach((r: any) => {
        const slotId = r.slotId ?? r.slot_id;
        if (slotId) {
          infoMap[slotId] = {
            tutorAttend: r.tutorAttend ?? r.tutor_attend ?? null,
            tutorEvidence: r.tutorEvidence ?? r.tutor_evidence ?? null,
            reason: r.reason ?? null,
            tutorRespondedAt: r.tutorRespondedAt ?? r.tutor_responded_at ?? null,
          };
        }
      });
      setRefundInfoMap(infoMap);
    } catch (error) {
      console.error('Error fetching refund info:', error);
    }
  };

  // Fetch thông tin refund cho tất cả các slot có khiếu nại
  useEffect(() => {
    fetchRefundInfo();
  }, [bookings]);

  // Hàm gọi API đồng ý hoàn tiền
  const handleAgreeRefund = async (slotId: number, userId: number) => {
    try {
      setAgreeingRefund(slotId);
      
      // Tìm refund request ID từ API
      const response = await api.get('/admin/refund/all');
      const refunds = response.data.result || [];
      
      // Tìm refund khớp với slotId - ưu tiên COMPLAINT type và status PENDING/SUBMITTED
      const matchingRefund = refunds.find((r: any) => {
        const rSlotId = r.slotId ?? r.slot_id;
        const rUserId = r.userId ?? r.user_id;
        const refundType = r.refundType ?? r.refund_type;
        return rSlotId === slotId && rUserId === userId && refundType === 'COMPLAINT';
      });

      if (!matchingRefund) {
        toast.error('Không tìm thấy yêu cầu hoàn tiền cho buổi học này');
        return;
      }

      // Kiểm tra xem tutor đã phản đối (gửi evidence) chưa - chỉ chặn nếu đã gửi evidence
      const tutorEvidence = matchingRefund.tutorEvidence ?? matchingRefund.tutor_evidence;
      
      if (tutorEvidence) {
        toast.error('Bạn đã gửi bằng chứng phản đối khiếu nại này rồi');
        onRefresh?.();
        setSelectedComplaint(null);
        return;
      }
      
      // Không chặn nếu tutorAttend = false vì có thể cần gọi lại API để set learnerJoin = true

      const refundId = matchingRefund.refundRequestId ?? matchingRefund.refund_request_id ?? matchingRefund.id;
      
      if (!refundId) {
        toast.error('Không thể xác định ID yêu cầu hoàn tiền');
        return;
      }
      
      // Gọi API đồng ý hoàn tiền
      await api.patch(`/tutor/refunds/${refundId}/agree-refund`);
      
      toast.success('Đã đồng ý hoàn tiền cho học viên');
      // Fetch lại refund info để cập nhật UI ngay lập tức
      await fetchRefundInfo();
      onRefresh?.();
      setSelectedComplaint(null);
    } catch (error: any) {
      console.error('Agree refund error:', error);
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      
      if (errorCode === 1001 || errorMessage === 'Invalid key') {
        toast.error('Bạn đã phản hồi khiếu nại này rồi hoặc khiếu nại không hợp lệ');
      } else if (errorCode === 9999 || errorMessage?.includes('UNAUTHORIZED')) {
        toast.error('Bạn không có quyền thực hiện thao tác này');
      } else {
        toast.error(errorMessage || 'Có lỗi xảy ra khi đồng ý hoàn tiền');
      }
      onRefresh?.();
    } finally {
      setAgreeingRefund(null);
    }
  };

  const handleFileUpload = async (slotId: number, file: File, tutorJoined: boolean = true) => {
    try {
      setUploadingSlot(slotId);
      
      // Upload file to get URL
      const { downloadUrl } = await uploadFileToBackend(file);
      
      // Send attendance with evidence - chỉ dùng cho "Tôi đã tham gia"
      await api.patch(`/booking-slots/${slotId}/tutor-join`, {
        evidenceUrl: downloadUrl,
        tutorJoin: tutorJoined,
      });
      
      // Fetch lại refund info để cập nhật UI ngay lập tức
      await fetchRefundInfo();
      // Refresh data
      onRefresh?.();
      setSelectedComplaint(null);
      toast.success('Đã gửi bằng chứng phản hồi');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tải file');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleFileSelect = (slotId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(slotId, file);
      }
    };
    input.click();
  };

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center py-8">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">Vui lòng chọn ngày</p>
      </div>
    );
  }

  const filteredBookings = bookings.filter((b) => {
    if (!b.start_time) return false;
    try {
      const bookingDateStr = b.start_time.split('T')[0];
      return bookingDateStr === selectedDate;
    } catch {
      return false;
    }
  });

  if (filteredBookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center py-8">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">Không có buổi học nào trong ngày này</p>
      </div>
    );
  }

  const now = new Date();

  // Kiểm tra xem slot bị reject do tutor cập nhật lịch hay do khiếu nại
  const isCancelledByTutorUpdate = (booking: BookedSlot) => {
    const isRejected = booking.original_status === 'Rejected';
    // Nếu rejected và không có evidence nào + không có join nào => do tutor cập nhật lịch
    return isRejected && 
           !booking.learner_evidence && 
           !booking.tutor_evidence && 
           !booking.learner_join && 
           !booking.tutor_join;
  };

  const hasLearnerComplaint = (booking: BookedSlot) => {
    // Khiếu nại = có learner_evidence + CÓ reason (lý do khiếu nại)
    // Khi tutor đồng ý hoàn tiền, BE set learner_join = true, nhưng vẫn phải hiển thị khiếu nại
    // để cả người học và tutor có thể xem lại lý do và bằng chứng
    const slotRefund = refundInfoMap[booking.slotid];
    const hasReason = !!slotRefund?.reason;
    // Có khiếu nại nếu: có learner_evidence + có reason (bất kể learner_join là gì)
    const hasComplaint = !!booking.learner_evidence && hasReason;
    const isRejectedNotByTutor = booking.original_status === 'Rejected' && !isCancelledByTutorUpdate(booking);
    return hasComplaint || isRejectedNotByTutor;
  };

  const getStatusInfo = (booking: BookedSlot) => {
    const isRejected = booking.original_status === 'Rejected';
    const tutorJoined = booking.tutor_join === true;
    const learnerJoined = booking.learner_join === true;
    const isTutorCancelled = isCancelledByTutorUpdate(booking);
    const hasTutorEvidence = !!booking.tutor_evidence;
    const hasLearnerEvidence = !!booking.learner_evidence;
    
    // Lấy thông tin refund để kiểm tra reason
    const slotRefund = refundInfoMap[booking.slotid];
    const hasReason = !!slotRefund?.reason;
    
    if (isRejected) {
      if (isTutorCancelled) {
        return { color: 'text-slate-600', label: 'Đã hủy do cập nhật lịch', type: 'tutor_cancelled' };
      }
      return { color: 'text-red-600', label: 'Đã bị từ chối/hoàn tiền', type: 'rejected' };
    }
    
    // Logic phân biệt các trạng thái dựa trên learner_join, tutor_join, evidence, reason:
    // 1. learner_join=true + learner_evidence + reason + !tutor_evidence + tutorJoin=false → Gia sư đã đồng ý hoàn tiền
    // 2. learner_join=false + learner_evidence + reason + !tutor_evidence + tutorJoin=false → Chờ gia sư phản hồi
    // 3. learner_join=true + learner_evidence + !reason + tutor_evidence + tutorJoin=true → Cả 2 đã tham gia
    // 4. learner_join=false + learner_evidence + reason + tutor_evidence + tutorJoin=true → Tutor đang phản đối khiếu nại
    
    // Gia sư đã đồng ý hoàn tiền
    if (learnerJoined && hasLearnerEvidence && hasReason && !hasTutorEvidence && !tutorJoined) {
      return { color: 'text-blue-600', label: 'Đã đồng ý hoàn tiền - Chờ Admin xử lý', type: 'tutor_agreed_refund' };
    }
    
    // Gia sư đang phản đối khiếu nại
    if (!learnerJoined && hasLearnerEvidence && hasReason && hasTutorEvidence && tutorJoined) {
      return { color: 'text-purple-600', label: 'Đã phản đối - Chờ Admin xem xét', type: 'waiting_admin' };
    }
    
    // Chờ gia sư phản hồi khiếu nại
    if (!learnerJoined && hasLearnerEvidence && hasReason && !hasTutorEvidence && !tutorJoined) {
      return { color: 'text-orange-600', label: 'Người học khiếu nại - Chờ phản hồi', type: 'complaint' };
    }
    
    // Cả hai đã điểm danh (không có reason = không phải khiếu nại)
    if (learnerJoined && hasLearnerEvidence && !hasReason && hasTutorEvidence && tutorJoined) {
      return { color: 'text-emerald-600', label: 'Hoàn thành - Cả hai đã điểm danh', type: 'completed' };
    }
    
    // Gia sư đã điểm danh, chờ người học
    if (tutorJoined && !learnerJoined && !hasReason) {
      return { color: 'text-blue-600', label: 'Gia sư đã điểm danh - Chờ người học', type: 'tutor_joined' };
    }
    
    // Người học đã điểm danh (không có reason = không phải khiếu nại)
    if (learnerJoined && !tutorJoined && !hasReason) {
      return { color: 'text-yellow-600', label: 'Người học đã điểm danh - Chờ gia sư', type: 'learner_joined' };
    }
    
    return { color: 'text-blue-600', label: 'Đã đặt - Chờ điểm danh', type: 'pending' };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-h-[500px] flex flex-col">
      <h3 className="text-xl font-bold text-slate-900 mb-4 flex-shrink-0">
        Buổi học ngày {selectedDate}
      </h3>

      <div className="space-y-3 overflow-y-auto flex-1 pr-1">
        {filteredBookings.map((booking) => {
          const startTime = new Date(booking.start_time);
          const endTime = new Date(booking.end_time);
          
          // Validate dates
          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            return null;
          }
          
          const isPast = endTime < now;
          const isRejected = booking.original_status === 'Rejected';
          const isPaid = booking.original_status === 'Paid';
          const tutorJoined = booking.tutor_join === true;
          const learnerJoined = booking.learner_join === true;
          const isComplaint = hasLearnerComplaint(booking);
          const isTutorCancelled = isCancelledByTutorUpdate(booking);
          
          // Kiểm tra tutor đã phản hồi khiếu nại chưa
          const slotRefund = refundInfoMap[booking.slotid];
          const hasTutorEvidence = !!booking.tutor_evidence || !!slotRefund?.tutorEvidence;
          const tutorAttendValue = slotRefund?.tutorAttend;
          // Tutor đã phản hồi nếu: có evidence HOẶC tutorAttend có giá trị (true hoặc false, không phải null/undefined)
          // tutorAttend = null → chưa phản hồi
          // tutorAttend = false → đã đồng ý hoàn tiền
          // tutorAttend = true hoặc có evidence → đã phản đối
          const hasTutorResponded = hasTutorEvidence || (tutorAttendValue !== null && tutorAttendValue !== undefined);
          
          // Chỉ cho phép thao tác trong khoảng thời gian của slot (1 tiếng)
          const isInSlotTimeWindow = isWithinSlotTime(startTime, endTime);
          // Tutor có thể điểm danh nếu: slot đã Paid, chưa bị reject, tutor chưa join, đang trong thời gian slot
          // VÀ không có khiếu nại (nếu có khiếu nại thì phải xử lý qua modal khiếu nại)
          const canTutorJoin = isPaid && !isRejected && !tutorJoined && isInSlotTimeWindow && !isComplaint && !hasTutorResponded;
          
          const statusInfo = getStatusInfo(booking);

          return (
            <div
              key={booking.slotid}
              className={`rounded-xl p-4 border ${
                isTutorCancelled
                  ? 'bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-300'
                  : isRejected
                    ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'
                    : isComplaint
                      ? 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200'
                      : isPast
                        ? 'bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-300'
                        : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock
                  className={`w-4 h-4 ${isPast ? 'text-slate-500' : 'text-blue-600'}`}
                />
                <span
                  className={`font-semibold ${isPast ? 'text-slate-600' : 'text-slate-900'}`}
                >
                  {startTime.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}{' '}
                  -{' '}
                  {endTime.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </span>
              </div>

              <div className="text-sm text-slate-600 space-y-1">
                {booking.learner_name && (
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-900">
                      Học viên:
                    </span>
                    <span className="text-slate-700">
                      {booking.learner_name}
                    </span>
                  </div>
                )}

                {/* Nút xem gói học */}
                {booking.tutor_package_id && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">Gói học:</span>
                    <button
                      onClick={() => openPackageModal(booking.tutor_package_id!, booking.tutor_id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Xem chi tiết gói học
                    </button>
                  </div>
                )}
                
                {/* Trạng thái tổng quan */}
                <div>
                  Trạng thái:{' '}
                  <span className={`font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Hiển thị trạng thái điểm danh chi tiết - ẩn nếu bị hủy do tutor update */}
                {!isTutorCancelled && (
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                    <div className="flex items-center gap-2">
                      {tutorJoined ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                      <span className={tutorJoined ? 'text-emerald-600' : 'text-slate-500'}>
                        Gia sư: {tutorJoined ? 'Đã điểm danh' : 'Chưa điểm danh'}
                      </span>
                    </div>
                    {/* Logic hiển thị trạng thái người học dựa trên learner_join, tutor_join, evidence, reason */}
                    {(() => {
                      const slotRefund = refundInfoMap[booking.slotid];
                      const hasReason = !!slotRefund?.reason;
                      const hasLearnerEvidence = !!booking.learner_evidence;
                      const slotHasTutorEvidence = !!booking.tutor_evidence;
                      
                      // Logic phân biệt các trạng thái:
                      // 1. learner_join=true + learner_evidence + reason + !tutor_evidence + tutorJoin=false → Gia sư đã đồng ý hoàn tiền
                      // 2. learner_join=false + learner_evidence + reason + !tutor_evidence + tutorJoin=false → Chờ gia sư phản hồi
                      // 3. learner_join=true + learner_evidence + !reason + tutor_evidence + tutorJoin=true → Cả 2 đã tham gia
                      // 4. learner_join=false + learner_evidence + reason + tutor_evidence + tutorJoin=true → Tutor đang phản đối
                      
                      // Gia sư đã đồng ý hoàn tiền
                      if (learnerJoined && hasLearnerEvidence && hasReason && !slotHasTutorEvidence && !tutorJoined) {
                        return (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-blue-500" />
                            <span className="text-blue-600">
                              Người học: Đã khiếu nại (Gia sư đồng ý hoàn tiền)
                            </span>
                          </div>
                        );
                      }
                      
                      // Gia sư đang phản đối khiếu nại
                      if (!learnerJoined && hasLearnerEvidence && hasReason && slotHasTutorEvidence && tutorJoined) {
                        return (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-purple-500" />
                            <span className="text-purple-600">
                              Người học: Đã khiếu nại (Gia sư phản đối)
                            </span>
                          </div>
                        );
                      }
                      
                      // Chờ gia sư phản hồi khiếu nại
                      if (!learnerJoined && hasLearnerEvidence && hasReason && !slotHasTutorEvidence && !tutorJoined) {
                        return (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="text-orange-600">
                              Người học: Đã khiếu nại - Chờ phản hồi
                            </span>
                          </div>
                        );
                      }
                      
                      // Cả hai đã điểm danh
                      if (learnerJoined && hasLearnerEvidence && !hasReason && slotHasTutorEvidence && tutorJoined) {
                        return (
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600">
                              Người học: Đã điểm danh
                            </span>
                          </div>
                        );
                      }
                      
                      // Người học đã điểm danh (không có reason)
                      if (learnerJoined && hasLearnerEvidence && !hasReason) {
                        return (
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600">
                              Người học: Đã điểm danh
                            </span>
                          </div>
                        );
                      }
                      
                      // Chưa điểm danh
                      return (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-500">
                            Người học: Chưa điểm danh
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Thông báo hủy do tutor cập nhật lịch */}
                {isTutorCancelled && (
                  <div className="mt-2 p-3 bg-slate-100 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700">
                      <CalendarX className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Buổi học đã bị hủy do cập nhật lịch
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Bạn đã thay đổi lịch dạy và buổi học này đã được hoàn tiền tự động cho học viên.
                    </p>
                  </div>
                )}

                {/* Hiển thị khi tutor đã đồng ý hoàn tiền:
                    - learner_join = true
                    - có learner_evidence
                    - CÓ reason
                    - KHÔNG có tutor_evidence
                    - tutor_join = false
                */}
                {(() => {
                  const slotRefund = refundInfoMap[booking.slotid];
                  const hasReason = !!slotRefund?.reason;
                  const slotHasTutorEvidence = !!booking.tutor_evidence;
                  // Tutor đã đồng ý hoàn tiền theo logic mới
                  const isTutorAgreedRefund = learnerJoined && 
                                              !!booking.learner_evidence && 
                                              hasReason &&
                                              !slotHasTutorEvidence &&
                                              !tutorJoined;
                  
                  if (isTutorAgreedRefund && !isTutorCancelled) {
                    return (
                      <div className="mt-2 p-3 bg-blue-100 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Bạn đã đồng ý hoàn tiền - Đang chờ Admin xử lý
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Cảnh báo khiếu nại - cho phép xem chi tiết và phản hồi */}
                {isComplaint && !isTutorCancelled && (
                  <div className="mt-2 p-3 bg-orange-100 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-orange-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Người học đã khiếu nại buổi học này
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedComplaint(booking)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        Xem lý do
                      </button>
                    </div>
                    
                    {/* Hiển thị nút phản hồi hoặc trạng thái đã phản hồi */}
                    {(() => {
                      const slotRefund = refundInfoMap[booking.slotid];
                      const hasReason = !!slotRefund?.reason;
                      const slotHasTutorEvidence = !!booking.tutor_evidence;
                      const hasLearnerEvidence = !!booking.learner_evidence;
                      
                      // Logic phân biệt các trạng thái dựa trên learner_join, tutor_join, evidence, reason:
                      // 1. learner_join=true + learner_evidence + reason + !tutor_evidence + tutorJoin=false → Gia sư đã đồng ý hoàn tiền
                      // 2. learner_join=false + learner_evidence + reason + !tutor_evidence + tutorJoin=false → Chờ gia sư phản hồi (hiện nút)
                      // 3. learner_join=false + learner_evidence + reason + tutor_evidence + tutorJoin=true → Tutor đang phản đối
                      
                      // Tutor đã phản đối: learner_join=false + learner_evidence + reason + tutor_evidence + tutorJoin=true
                      if (!learnerJoined && hasLearnerEvidence && hasReason && slotHasTutorEvidence && tutorJoined) {
                        return (
                          <p className="text-xs text-purple-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Bạn đã gửi bằng chứng phản đối - Đang chờ Admin xem xét
                          </p>
                        );
                      }
                      
                      // Tutor đã đồng ý hoàn tiền: learner_join=true + learner_evidence + reason + !tutor_evidence + tutorJoin=false
                      if (learnerJoined && hasLearnerEvidence && hasReason && !slotHasTutorEvidence && !tutorJoined) {
                        return (
                          <p className="text-xs text-blue-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Bạn đã đồng ý hoàn tiền - Đang chờ Admin xử lý
                          </p>
                        );
                      }
                      
                      // Tutor chưa phản hồi - chỉ hiển thị 2 nút trong khoảng thời gian slot
                      // learner_join=false + learner_evidence + reason + !tutor_evidence + tutorJoin=false
                      if (!isInSlotTimeWindow) {
                        return (
                          <p className="text-xs text-slate-500 italic">
                            Chỉ có thể phản hồi trong khoảng thời gian buổi học
                          </p>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-600">Chọn phản hồi:</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*,.pdf';
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) handleFileUpload(booking.slotid, file, true);
                                };
                                input.click();
                              }}
                              disabled={uploadingSlot === booking.slotid || agreeingRefund === booking.slotid}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {uploadingSlot === booking.slotid ? 'Đang tải...' : 'Tôi đã tham gia'}
                            </button>
                            <button
                              onClick={() => handleAgreeRefund(booking.slotid, booking.user_id)}
                              disabled={uploadingSlot === booking.slotid || agreeingRefund === booking.slotid}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                              {agreeingRefund === booking.slotid ? 'Đang xử lý...' : 'Đồng ý hoàn tiền'}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Meeting URL */}
                {booking.meeting_url && !isRejected && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <a
                      href={booking.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isPast
                          ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                      onClick={(e) => {
                        if (isPast) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      {isPast ? 'Buổi học đã kết thúc' : 'Tham gia Google Meet'}
                    </a>
                  </div>
                )}

                {/* Attendance Action - Tutor điểm danh */}
                {canTutorJoin && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">
                        Gửi bằng chứng để xác nhận tham gia buổi học
                      </p>
                      <button
                        onClick={() => handleFileSelect(booking.slotid)}
                        disabled={uploadingSlot === booking.slotid}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingSlot === booking.slotid
                          ? 'Đang tải...'
                          : 'Đính kèm bằng chứng & Điểm danh'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Đã điểm danh */}
                {tutorJoined && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Bạn đã xác nhận tham gia buổi học này</span>
                    </div>
                    {booking.tutor_evidence && (
                      <button 
                        onClick={() => setPreviewImage(booking.tutor_evidence)}
                        className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Xem bằng chứng đã gửi
                      </button>
                    )}
                  </div>
                )}

                {/* Slot bị reject (không phải do tutor update) */}
                {isRejected && !isTutorCancelled && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Buổi học đã bị từ chối/hoàn tiền</span>
                    </div>
                  </div>
                )}

                {!booking.meeting_url && !isRejected && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-500 italic">
                      Link họp chưa có sẵn
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal xem chi tiết khiếu nại */}
      {selectedComplaint && (() => {
        const complaintStartTime = new Date(selectedComplaint.start_time);
        const complaintEndTime = new Date(selectedComplaint.end_time);
        const isComplaintInSlotTime = isWithinSlotTime(complaintStartTime, complaintEndTime);
        return (
          <ComplaintModal
            booking={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
            onSubmitEvidence={(file, tutorJoined) => handleFileUpload(selectedComplaint.slotid, file, tutorJoined)}
            onAgreeRefund={() => handleAgreeRefund(selectedComplaint.slotid, selectedComplaint.user_id)}
            isUploading={uploadingSlot === selectedComplaint.slotid}
            isAgreeingRefund={agreeingRefund === selectedComplaint.slotid}
            isInSlotTimeWindow={isComplaintInSlotTime}
          />
        );
      })()}

      {/* Modal xem ảnh bằng chứng */}
      {previewImage && (
        <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
      )}

      {/* Modal xem chi tiết gói học */}
      {openPackageDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {loadingPackage ? 'Đang tải...' : selectedPackage?.tutorPackage?.name || 'Chi tiết gói học'}
                  </h3>
                  <p className="text-sm text-slate-500">Chi tiết gói học</p>
                </div>
              </div>
              <button
                onClick={() => setOpenPackageDetail(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingPackage ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !selectedPackage?.tutorPackage ? (
                <div className="text-center py-12 text-slate-500">
                  Không tìm thấy thông tin gói học
                </div>
              ) : (
                <>
                  {/* Mô tả */}
                  {selectedPackage.tutorPackage.description && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <span>📝</span> Mô tả
                      </h4>
                      <p className="text-slate-600 text-sm">
                        {selectedPackage.tutorPackage.description}
                      </p>
                    </div>
                  )}

                  {/* Yêu cầu */}
                  {selectedPackage.tutorPackage.requirement && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                        <span>⚠️</span> Yêu cầu
                      </h4>
                      <p className="text-amber-800 text-sm">
                        {selectedPackage.tutorPackage.requirement}
                      </p>
                    </div>
                  )}

                  {/* Mục tiêu */}
                  {selectedPackage.tutorPackage.objectives && (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <span>🎯</span> Mục tiêu
                      </h4>
                      <p className="text-green-800 text-sm">
                        {selectedPackage.tutorPackage.objectives}
                      </p>
                    </div>
                  )}

                  {/* Thông tin số buổi */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                    <h4 className="font-semibold text-blue-900 mb-1 text-sm">Số buổi học</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedPackage.tutorPackage.max_slots ?? 0} buổi
                    </p>
                  </div>

                  {/* Nội dung các buổi học */}
                  {selectedPackage.tutorPackage.slot_content && 
                   selectedPackage.tutorPackage.slot_content.length > 0 && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <span>📚</span> Nội dung các buổi học
                      </h4>
                      <div className="space-y-2">
                        {selectedPackage.tutorPackage.slot_content.map((slot) => (
                          <div 
                            key={slot.slot_number} 
                            className="flex items-start gap-3 bg-white rounded-lg p-3 border border-purple-100"
                          >
                            <span className="flex-shrink-0 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {slot.slot_number}
                            </span>
                            <p className="text-slate-700 text-sm pt-1">{slot.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setOpenPackageDetail(false)}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingSessions;
