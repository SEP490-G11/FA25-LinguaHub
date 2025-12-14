import { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Upload,
  Image,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/config/axiosConfig';
import { uploadFile } from '@/utils/fileUpload';
import { useToast } from '@/components/ui/use-toast';
import type { BookingSlot, UserPackage } from '@/types/MyBooking';

interface UpcomingSessionsProps {
  bookings: BookingSlot[];
  selectedDate: string | null;
  userID: number | null;
  onRefresh?: () => void;
}

type ModalType = 'confirm' | 'complain' | null;

interface ModalState {
  type: ModalType;
  slotId: number | null;
}

interface EvidenceModalState {
  isOpen: boolean;
  imageUrl: string | null;
  title: string;
  reason?: string | null;
}

interface PackageModalState {
  isOpen: boolean;
  userPackage: UserPackage | null;
  loading: boolean;
}

const UpcomingSessions = ({
  bookings,
  selectedDate,
  userID,
  onRefresh,
}: UpcomingSessionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modal, setModal] = useState<ModalState>({ type: null, slotId: null });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [complainReason, setComplainReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evidenceModal, setEvidenceModal] = useState<EvidenceModalState>({
    isOpen: false,
    imageUrl: null,
    title: '',
    reason: null,
  });
  const [packageModal, setPackageModal] = useState<PackageModalState>({
    isOpen: false,
    userPackage: null,
    loading: false,
  });
  // Lưu lý do khiếu nại theo slotID để hiển thị khi xem bằng chứng
  const [complaintReasons, setComplaintReasons] = useState<Record<number, string>>({});
  
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

  // Fetch lý do khiếu nại từ API refund khi có booking có learnerEvidence
  // Cần fetch cho TẤT CẢ slot có learnerEvidence (không chỉ những slot có !learnerJoin)
  // vì khi tutor đồng ý hoàn tiền, BE set learnerJoin = true nhưng vẫn là khiếu nại
  useEffect(() => {
    const fetchComplaintReasons = async () => {
      // Lấy danh sách slotID có learnerEvidence và chưa có reason trong state
      const slotsWithEvidence = bookings.filter(
        (b) => !!b.learnerEvidence && !complaintReasons[b.slotID]
      );
      
      if (slotsWithEvidence.length === 0) return;
      
      try {
        const response = await api.get('/admin/refund/all');
        const refunds = response.data.result || [];
        
        const newReasons: Record<number, string> = {};
        slotsWithEvidence.forEach((slot) => {
          const matchingRefund = refunds.find((r: any) => {
            const slotId = r.slotId ?? r.slot_id;
            const uId = r.userId ?? r.user_id;
            return slotId === slot.slotID && uId === userID;
          });
          if (matchingRefund?.reason) {
            newReasons[slot.slotID] = matchingRefund.reason;
          }
        });
        
        if (Object.keys(newReasons).length > 0) {
          setComplaintReasons((prev) => ({ ...prev, ...newReasons }));
        }
      } catch (error) {
        console.error('Error fetching complaint reasons:', error);
      }
    };
    
    fetchComplaintReasons();
  }, [bookings, userID]);

  const openEvidenceModal = (imageUrl: string, title: string, reason?: string | null) => {
    setEvidenceModal({ isOpen: true, imageUrl, title, reason });
  };

  const closeEvidenceModal = () => {
    setEvidenceModal({ isOpen: false, imageUrl: null, title: '', reason: null });
  };

  const openPackageModal = async (userPackageId: number, tutorId: number) => {
    setPackageModal({ isOpen: true, userPackage: null, loading: true });
    try {
      // Gọi API lấy danh sách packages của tutor
      const res = await api.get(`/tutor/${tutorId}/packages`, { skipAuth: true });
      const packages = res.data.packages || [];
      
      // Tìm package có packageid bằng userPackageId
      const pkg = packages.find((p: any) => p.packageid === userPackageId);
      
      if (pkg) {
        // Transform API response to UserPackage format
        const userPackage: UserPackage = {
          userPackageID: userPackageId,
          tutorPackage: {
            packageID: pkg.packageid ?? 0,
            name: pkg.name ?? '',
            description: pkg.description ?? '',
            maxSlots: pkg.max_slots ?? 0,
            requirement: pkg.requirement ?? '',
            objectives: pkg.objectives ?? '',
            slotContent: pkg.slot_content ?? [],
          },
          slotsRemaining: pkg.max_slots ?? 0, // API không trả về slotsRemaining, dùng max_slots
          isActive: pkg.is_active ?? false,
        };
        setPackageModal({ isOpen: true, userPackage, loading: false });
      } else {
        toast({
          title: 'Thông báo',
          description: 'Không tìm thấy thông tin gói học',
        });
        setPackageModal({ isOpen: false, userPackage: null, loading: false });
      }
    } catch (err) {
      console.error('Failed to fetch package:', err);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin gói học',
        variant: 'destructive',
      });
      setPackageModal({ isOpen: false, userPackage: null, loading: false });
    }
  };

  const closePackageModal = () => {
    setPackageModal({ isOpen: false, userPackage: null, loading: false });
  };

  const openModal = (type: ModalType, slotId: number) => {
    setModal({ type, slotId });
    setEvidenceFile(null);
    setEvidencePreview(null);
    setComplainReason('');
  };

  const closeModal = () => {
    setModal({ type: null, slotId: null });
    setEvidenceFile(null);
    setEvidencePreview(null);
    setComplainReason('');
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng chọn file ảnh',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Lỗi',
          description: 'File ảnh không được vượt quá 5MB',
          variant: 'destructive',
        });
        return;
      }
      setEvidenceFile(file);
      setEvidencePreview(URL.createObjectURL(file));
    }
  };

  const handleConfirmSubmit = async () => {
    if (!modal.slotId) return;

    setUploading(true);
    try {
      let evidenceUrl: string | null = null;

      if (evidenceFile) {
        evidenceUrl = await uploadFile(evidenceFile);
      }

      await api.patch(`/booking-slots/${modal.slotId}/learner-join`, {
        evidenceUrl,
      });

      toast({
        title: 'Thành công',
        description: 'Xác nhận tham gia thành công!',
      });
      closeModal();
      onRefresh?.();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast({
        title: 'Lỗi',
        description:
          error.response?.data?.message || error.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleComplainSubmit = async () => {
    if (!modal.slotId) return;

    if (!complainReason.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập lý do khiếu nại',
        variant: 'destructive',
      });
      return;
    }

    if (!evidenceFile) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng upload ảnh bằng chứng để khiếu nại',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const evidenceUrl = await uploadFile(evidenceFile);

      await api.post(`/booking-slots/${modal.slotId}/complain`, {
        evidenceUrl,
        reason: complainReason.trim(),
      });

      // Lưu lý do khiếu nại để hiển thị khi xem bằng chứng
      setComplaintReasons(prev => ({
        ...prev,
        [modal.slotId!]: complainReason.trim(),
      }));

      toast({
        title: 'Thành công',
        description: 'Gửi khiếu nại thành công! Hệ thống sẽ xem xét và phản hồi.',
      });
      closeModal();
      onRefresh?.();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast({
        title: 'Lỗi',
        description:
          error.response?.data?.message || error.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
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
    try {
      const date = new Date(b.startTime);
      if (isNaN(date.getTime())) return false;
      const bookingDate = date.toISOString().split('T')[0];
      return bookingDate === selectedDate && b.userID === userID;
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


  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-h-[500px] flex flex-col">
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex-shrink-0">
          Buổi học ngày {selectedDate}
        </h3>

        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {filteredBookings.map((booking) => {
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            const isPast = endTime < now;
            const isRejected = booking.status === 'Rejected';
            
            // Lấy các giá trị cần thiết
            const hasReason = !!complaintReasons[booking.slotID];
            const hasLearnerEvidence = !!booking.learnerEvidence;
            const hasTutorEvidence = !!booking.tutorEvidence;
            const learnerJoined = booking.learnerJoin === true;
            const tutorJoined = booking.tutorJoin === true;
            
            // Logic phân biệt các trạng thái chi tiết:
            // 1. learner_join=true + learner_evidence + reason + !tutor_evidence + tutorJoin=false → Gia sư đã đồng ý hoàn tiền
            // 2. learner_join=false + learner_evidence + reason + !tutor_evidence + tutorJoin=false → Chờ gia sư phản hồi
            // 3. learner_join=true + learner_evidence + !reason + tutor_evidence + tutorJoin=true → Cả 2 đã tham gia
            // 4. learner_join=false + learner_evidence + reason + tutor_evidence + tutorJoin=true → Tutor đang phản đối khiếu nại
            
            const isTutorAgreedRefund = learnerJoined && hasLearnerEvidence && hasReason && !hasTutorEvidence && !tutorJoined;
            const isWaitingTutorResponse = !learnerJoined && hasLearnerEvidence && hasReason && !hasTutorEvidence && !tutorJoined;
            const isBothAttended = learnerJoined && hasLearnerEvidence && !hasReason && hasTutorEvidence && tutorJoined;
            const isTutorDisputing = !learnerJoined && hasLearnerEvidence && hasReason && hasTutorEvidence && tutorJoined;
            
            // Tổng hợp: có khiếu nại nếu có reason
            const hasComplained = hasLearnerEvidence && hasReason;
            // Đã điểm danh bình thường: learnerJoin + evidence + không có reason
            const hasConfirmed = learnerJoined && hasLearnerEvidence && !hasReason;
            
            // Phân biệt các trường hợp Rejected:
            // - Tutor hủy lịch: Rejected + không có learnerEvidence
            // - Learner khiếu nại bị từ chối: Rejected + có learnerEvidence + learnerJoin = false
            const isTutorCancelled = isRejected && !hasLearnerEvidence;
            const isComplaintRejected = isRejected && hasLearnerEvidence && !learnerJoined;
            
            // Khóa link Meet khi: đã tham gia, đã khiếu nại, hoặc bị reject
            const shouldLockMeetLink = hasConfirmed || hasComplained || isRejected || isPast;
            
            // Chỉ cho phép thao tác trong khoảng thời gian của slot (1 tiếng)
            const isInSlotTimeWindow = isWithinSlotTime(startTime, endTime);
            const canTakeAction = !hasConfirmed && !hasComplained && !isRejected && booking.status === 'Paid' && isInSlotTimeWindow;

            return (
              <div
                key={booking.slotID}
                className={`rounded-xl p-4 border ${
                  isRejected
                    ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'
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
                  {booking.tutorFullName && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">Gia sư:</span>
                      <button
                        onClick={() => navigate(`/tutors/${booking.tutorID}`)}
                        className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                      >
                        {booking.tutorFullName}
                      </button>
                    </div>
                  )}
                  
                  {/* Nút xem gói học */}
                  {booking.tutorPackageID && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">Gói học:</span>
                      <button
                        onClick={() => openPackageModal(booking.tutorPackageID!, booking.tutorID)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        <Package className="w-3.5 h-3.5" />
                        Xem chi tiết gói học
                      </button>
                    </div>
                  )}
                  <div>
                    Trạng thái:{' '}
                    <span
                      className={`font-medium ${
                        isTutorCancelled
                          ? 'text-red-600'
                          : isComplaintRejected
                            ? 'text-red-600'
                            : isTutorAgreedRefund
                              ? 'text-blue-600'
                              : isTutorDisputing
                                ? 'text-purple-600'
                                : isWaitingTutorResponse
                                  ? 'text-orange-600'
                                  : isBothAttended
                                    ? 'text-emerald-600'
                                    : hasConfirmed
                                      ? 'text-emerald-600'
                                      : isPast
                                        ? 'text-slate-500'
                                        : 'text-green-600'
                      }`}
                    >
                      {isTutorCancelled
                        ? 'Gia sư đã hủy lịch'
                        : isComplaintRejected
                          ? 'Khiếu nại đã xử lý'
                          : isTutorAgreedRefund
                            ? 'Gia sư đã đồng ý hoàn tiền - Chờ Admin xử lý'
                            : isTutorDisputing
                              ? 'Gia sư đang phản đối - Chờ Admin xem xét'
                              : isWaitingTutorResponse
                                ? 'Đang chờ gia sư phản hồi khiếu nại'
                                : isBothAttended
                                  ? 'Hoàn thành - Cả hai đã điểm danh'
                                  : hasConfirmed
                                    ? 'Đã điểm danh'
                                    : isPast
                                      ? 'Đã qua'
                                      : 'Sắp diễn ra'}
                    </span>
                  </div>

                  {booking.meetingUrl ? (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <a
                        href={shouldLockMeetLink ? undefined : booking.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          shouldLockMeetLink
                            ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                        onClick={(e) => {
                          if (shouldLockMeetLink) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z" />
                        </svg>
                        {isRejected 
                          ? 'Buổi học đã bị hủy' 
                          : hasConfirmed 
                            ? 'Đã xác nhận tham gia'
                            : hasComplained
                              ? 'Đang chờ xử lý khiếu nại'
                              : isPast 
                                ? 'Buổi học đã kết thúc' 
                                : 'Tham gia Google Meet'}
                      </a>
                    </div>
                  ) : (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <span className="text-xs text-slate-500 italic">
                        Link họp chưa có sẵn
                      </span>
                    </div>
                  )}

                  {/* Attendance Actions */}
                  {canTakeAction && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                      <button
                        onClick={() => openModal('confirm', booking.slotID)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Xác nhận tham gia
                      </button>
                      <button
                        onClick={() => openModal('complain', booking.slotID)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Khiếu nại
                      </button>
                    </div>
                  )}

                  {/* Cả hai đã tham gia */}
                  {isBothAttended && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Cả bạn và gia sư đều đã xác nhận tham gia buổi học
                      </span>
                      {booking.learnerEvidence && (
                        <button
                          onClick={() => openEvidenceModal(booking.learnerEvidence!, 'Bằng chứng của bạn')}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Xem bằng chứng của bạn
                        </button>
                      )}
                    </div>
                  )}

                  {/* Đã điểm danh bình thường (không phải cả 2) */}
                  {hasConfirmed && !isBothAttended && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Bạn đã xác nhận tham gia buổi học này
                      </span>
                      {booking.learnerEvidence && (
                        <button
                          onClick={() => openEvidenceModal(booking.learnerEvidence!, 'Bằng chứng của bạn')}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Xem bằng chứng của bạn
                        </button>
                      )}
                    </div>
                  )}

                  {/* Gia sư đã đồng ý hoàn tiền */}
                  {isTutorAgreedRefund && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Gia sư đã đồng ý hoàn tiền cho bạn - Đang chờ Admin xử lý
                      </span>
                      {booking.learnerEvidence && (
                        <button
                          onClick={() => openEvidenceModal(booking.learnerEvidence!, 'Bằng chứng khiếu nại của bạn', complaintReasons[booking.slotID])}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-md hover:bg-orange-100 transition-colors border border-orange-200"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Xem bằng chứng khiếu nại
                        </button>
                      )}
                    </div>
                  )}

                  {/* Gia sư đang phản đối khiếu nại */}
                  {isTutorDisputing && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-purple-600 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Gia sư đã gửi bằng chứng phản đối - Đang chờ Admin xem xét
                      </span>
                      {booking.learnerEvidence && (
                        <button
                          onClick={() => openEvidenceModal(booking.learnerEvidence!, 'Bằng chứng khiếu nại của bạn', complaintReasons[booking.slotID])}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-md hover:bg-orange-100 transition-colors border border-orange-200"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Xem bằng chứng khiếu nại
                        </button>
                      )}
                    </div>
                  )}

                  {/* Đang chờ gia sư phản hồi */}
                  {isWaitingTutorResponse && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-orange-600 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Bạn đã gửi khiếu nại - Đang chờ gia sư phản hồi
                      </span>
                      {booking.learnerEvidence && (
                        <button
                          onClick={() => openEvidenceModal(booking.learnerEvidence!, 'Bằng chứng khiếu nại của bạn', complaintReasons[booking.slotID])}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-md hover:bg-orange-100 transition-colors border border-orange-200"
                        >
                          <Image className="w-3.5 h-3.5" />
                          Xem bằng chứng khiếu nại
                        </button>
                      )}
                    </div>
                  )}

                  {/* Hiển thị bằng chứng của tutor nếu có */}
                  {booking.tutorEvidence && (
                    <div className="mt-2">
                      <button
                        onClick={() => openEvidenceModal(booking.tutorEvidence!, 'Bằng chứng của gia sư')}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-600 text-xs font-medium rounded-md hover:bg-purple-100 transition-colors border border-purple-200"
                      >
                        <Image className="w-3.5 h-3.5" />
                        Xem bằng chứng của gia sư
                      </button>
                    </div>
                  )}

                  {isTutorCancelled && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-600 font-medium">
                        <X className="w-3.5 h-3.5" />
                        Gia sư đã hủy buổi học này - Bạn sẽ được hoàn tiền
                      </span>
                    </div>
                  )}

                  {isComplaintRejected && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-600 font-medium">
                        <X className="w-3.5 h-3.5" />
                        Khiếu nại của bạn đã được xử lý - Buổi học đã hoàn tiền
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Modal Xác nhận tham gia */}
      {modal.type === 'confirm' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Xác nhận tham gia
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <p className="text-sm text-slate-600 mb-4">
                Vui lòng upload ảnh bằng chứng tham gia buổi học (ảnh chụp màn
                hình cuộc họp, v.v.)
              </p>

              {/* Upload Area */}
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {evidencePreview ? (
                  <div className="relative">
                    <img
                      src={evidencePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain rounded-lg border border-slate-200 bg-slate-50"
                    />
                    <button
                      onClick={() => {
                        setEvidenceFile(null);
                        setEvidencePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-slate-400" />
                    <span className="text-sm text-slate-500">
                      Click để chọn ảnh
                    </span>
                    <span className="text-xs text-slate-400">
                      PNG, JPG tối đa 5MB
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-4 border-t border-slate-100">
              <button
                onClick={closeModal}
                disabled={uploading}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Xác nhận
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Khiếu nại */}
      {modal.type === 'complain' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Khiếu nại buổi học
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <p className="text-sm text-slate-600 mb-4">
                Vui lòng cung cấp lý do và bằng chứng cho khiếu nại của bạn.
              </p>

              {/* Lý do khiếu nại */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lý do khiếu nại <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={complainReason}
                  onChange={(e) => setComplainReason(e.target.value)}
                  placeholder="Nhập lý do khiếu nại..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>

              {/* Upload Area */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ảnh bằng chứng <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {evidencePreview ? (
                  <div className="relative">
                    <img
                      src={evidencePreview}
                      alt="Preview"
                      className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-slate-50"
                    />
                    <button
                      onClick={() => {
                        setEvidenceFile(null);
                        setEvidencePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <Image className="w-6 h-6 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      Click để chọn ảnh
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-4 border-t border-slate-100">
              <button
                onClick={closeModal}
                disabled={uploading}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleComplainSubmit}
                disabled={uploading || !complainReason.trim() || !evidenceFile}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Gửi khiếu nại
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem ảnh bằng chứng */}
      {evidenceModal.isOpen && evidenceModal.imageUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {evidenceModal.title}
              </h3>
              <button
                onClick={closeEvidenceModal}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            {/* Hiển thị lý do khiếu nại nếu có */}
            {evidenceModal.reason && (
              <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                <p className="text-sm font-medium text-orange-700 mb-1">Lý do khiếu nại:</p>
                <p className="text-sm text-slate-700">{evidenceModal.reason}</p>
              </div>
            )}
            <div className="flex-1 overflow-auto p-4 bg-slate-50 rounded-b-2xl flex items-center justify-center">
              <img
                src={evidenceModal.imageUrl}
                alt={evidenceModal.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết gói học */}
      {packageModal.isOpen && (
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
                    {packageModal.loading ? 'Đang tải...' : packageModal.userPackage?.tutorPackage?.name || 'Chi tiết gói học'}
                  </h3>
                  <p className="text-sm text-slate-500">Chi tiết gói học</p>
                </div>
              </div>
              <button
                onClick={closePackageModal}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {packageModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !packageModal.userPackage?.tutorPackage ? (
                <div className="text-center py-12 text-slate-500">
                  Không tìm thấy thông tin gói học
                </div>
              ) : (
                <>
              {/* Mô tả */}
              {packageModal.userPackage?.tutorPackage?.description && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <span>📝</span> Mô tả
                  </h4>
                  <p className="text-slate-600 text-sm">
                    {packageModal.userPackage.tutorPackage.description}
                  </p>
                </div>
              )}

              {/* Yêu cầu */}
              {packageModal.userPackage?.tutorPackage?.requirement && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    <span>⚠️</span> Yêu cầu
                  </h4>
                  <p className="text-amber-800 text-sm">
                    {packageModal.userPackage.tutorPackage.requirement}
                  </p>
                </div>
              )}

              {/* Mục tiêu */}
              {packageModal.userPackage?.tutorPackage?.objectives && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <span>🎯</span> Mục tiêu
                  </h4>
                  <p className="text-green-800 text-sm">
                    {packageModal.userPackage.tutorPackage.objectives}
                  </p>
                </div>
              )}

              {/* Thông tin số buổi */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                <h4 className="font-semibold text-blue-900 mb-1 text-sm">Số buổi học</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {packageModal.userPackage?.tutorPackage?.maxSlots ?? 0} buổi
                </p>
              </div>

              {/* Nội dung các buổi học */}
              {packageModal.userPackage?.tutorPackage?.slotContent && 
               packageModal.userPackage.tutorPackage.slotContent.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <span>📚</span> Nội dung các buổi học
                  </h4>
                  <div className="space-y-2">
                    {packageModal.userPackage.tutorPackage.slotContent.map((slot) => (
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
                onClick={closePackageModal}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UpcomingSessions;
