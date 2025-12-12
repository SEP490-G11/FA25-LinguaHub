import { useState } from 'react';
import { Calendar, Clock, User, ExternalLink, Upload, CheckCircle } from 'lucide-react';
import api from '@/config/axiosConfig';
import { uploadFileToBackend } from '@/utils/fileUpload';
import type { BookedSlot } from '../../booked-slots';

interface UpcomingSessionsProps {
  bookings: BookedSlot[];
  selectedDate: string | null;
  onRefresh?: () => void;
}

const UpcomingSessions = ({
  bookings,
  selectedDate,
  onRefresh,
}: UpcomingSessionsProps) => {
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  const handleFileUpload = async (slotId: number, file: File) => {
    try {
      setUploadingSlot(slotId);
      
      // Upload file to get URL
      const { downloadUrl } = await uploadFileToBackend(file);
      
      // Send attendance with evidence
      await api.patch(`/booking-slots/${slotId}/tutor-join`, {
        evidenceUrl: downloadUrl,
      });
      
      // Refresh data
      onRefresh?.();
      alert('Đã gửi bằng chứng thành công!');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Có lỗi xảy ra khi tải file');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600';
      case 'Booked':
        return 'text-blue-600';
      case 'Cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'Đã hoàn thành';
      case 'Booked':
        return 'Đã đặt';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-xl font-bold text-slate-900 mb-4">
        Buổi học ngày {selectedDate}
      </h3>

      <div className="space-y-3">
        {filteredBookings.map((booking) => {
          const startTime = new Date(booking.start_time);
          const endTime = new Date(booking.end_time);
          
          // Validate dates
          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            return null;
          }
          
          const isPast = endTime < now;

          return (
            <div
              key={booking.slotid}
              className={`rounded-xl p-4 border ${
                isPast
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
                <div>
                  Trạng thái:{' '}
                  <span className={`font-medium ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                {booking.meeting_url ? (
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

                    {/* Attendance Section */}
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      {booking.tutor_join ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Đã tham gia</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className={`text-sm ${isPast ? 'text-slate-400' : 'text-slate-600'}`}>
                            {isPast ? 'Buổi học đã kết thúc' : 'Gửi bằng chứng để điểm danh'}
                          </p>
                          <button
                            onClick={() => !isPast && handleFileSelect(booking.slotid)}
                            disabled={uploadingSlot === booking.slotid || isPast}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              isPast
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            {uploadingSlot === booking.slotid
                              ? 'Đang tải...'
                              : 'Đính kèm bằng chứng'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
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
    </div>
  );
};

export default UpcomingSessions;
