import { useState, useRef } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Upload,
  Image,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/config/axiosConfig';
import { uploadFile } from '@/utils/fileUpload';
import { useToast } from '@/components/ui/use-toast';
import type { BookingSlot } from '@/types/MyBooking';

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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Buổi học ngày {selectedDate}
        </h3>

        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            const isPast = endTime < now;
            const hasConfirmed = booking.learnerJoin === true;
            const hasComplained = !!booking.learnerEvidence && !booking.learnerJoin;
            const isRejected = booking.status === 'Rejected';
            const canTakeAction = !hasConfirmed && !hasComplained && !isRejected && booking.status === 'Paid';

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
                    {startTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {endTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
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
                  <div>
                    Trạng thái:{' '}
                    <span
                      className={`font-medium ${
                        isRejected
                          ? 'text-red-600'
                          : hasComplained
                            ? 'text-orange-600'
                            : hasConfirmed
                              ? 'text-emerald-600'
                              : isPast
                                ? 'text-slate-500'
                                : 'text-green-600'
                      }`}
                    >
                      {isRejected
                        ? 'Đã bị từ chối'
                        : hasComplained
                          ? 'Đang chờ xử lý khiếu nại'
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
                        href={booking.meetingUrl}
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
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z" />
                        </svg>
                        {isPast ? 'Buổi học đã kết thúc' : 'Tham gia Google Meet'}
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

                  {hasConfirmed && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Bạn đã xác nhận tham gia buổi học này
                      </span>
                    </div>
                  )}

                  {hasComplained && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="inline-flex items-center gap-1.5 text-xs text-orange-600 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Bạn đã gửi khiếu nại, đang chờ xử lý
                      </span>
                    </div>
                  )}

                  {isRejected && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-600 font-medium">
                        <X className="w-3.5 h-3.5" />
                        Buổi học đã bị từ chối/hoàn tiền
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
    </>
  );
};

export default UpcomingSessions;
