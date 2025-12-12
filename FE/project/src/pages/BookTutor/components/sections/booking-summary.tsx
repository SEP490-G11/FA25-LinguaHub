import { Calendar, Clock, User, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackageItem } from "@/pages/BookTutor/components/sections/calendar-slots";
import { TurnstileGuard } from "@/components/security/TurnstileGuard";
import { useState } from "react";


interface Tutor {
  tutorId: number;
  name: string;
  avatarUrl?: string | null;
  country?: string;
  phone?: string | null;
  bio?: string | null;
  experience?: string | null;
  specialization?: string | null;
  teachingLanguage?: string | null;
  rating?: number;
  pricePerHour: number;
  courses?: unknown[];
}

interface BookingSummaryProps {
  tutor: Tutor;
  selectedPackage: PackageItem | null;
  selectedSlots: Array<{ date: string; time: string; day: string }>;
  totalPrice: number | string | undefined;
  onConfirmBooking: (turnstileToken: string) => void;
}

const BookingSummary = ({
                          tutor,
                          selectedSlots,
                          totalPrice,
                          onConfirmBooking,
                        }: BookingSummaryProps) => {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const groupSlotsByDate = () => {
    const grouped: { [key: string]: Array<{ time: string; day: string }> } = {};
    selectedSlots.forEach((slot) => {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date].push({ time: slot.time, day: slot.day });
    });
    return grouped;
  };

  const groupedSlots = groupSlotsByDate();

  const handlePaymentClick = () => {
    if (!turnstileToken) {
      return; // Button is disabled anyway
    }
    onConfirmBooking(turnstileToken);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const dayOfWeek = dayNames[date.getDay()];
    return `${dayOfWeek}, ${day}/${month}`;
  };

  const formatTimeRange = (time: string) => {
    const [h] = time.split(":");
    const startHour = parseInt(h, 10);
    const endHour = (startHour + 1) % 24;
    return `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;
  };

  const formatVND = (value: number | string | undefined) => {
    const num = Number(value);
    if (isNaN(num)) return "0 VND";
    return num.toLocaleString("vi-VN") + " VND";
  };

  return (
      <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
        <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <span>Tóm tắt đặt lịch</span>
        </h3>

        <div className="space-y-4 mb-6">
          {/* TUTOR INFO */}
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Gia sư</p>
              <p className="font-semibold text-lg">{tutor.name}</p>
              <p className="text-sm text-gray-500">
                Giáo viên {tutor.teachingLanguage}
              </p>
            </div>
          </div>

          {/* SLOTS */}
          {selectedSlots.length > 0 ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Buổi học đã chọn</span>
                </h4>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {Object.entries(groupedSlots).map(([date, slots]) => (
                      <div key={date} className="border-l-4 border-blue-600 pl-3">
                        <p className="font-semibold text-sm text-gray-700">
                          {formatDate(date)}
                        </p>

                        <div className="space-y-1 mt-1">
                          {slots.map((slot, index) => (
                              <div
                                  key={index}
                                  className="flex items-center space-x-2 text-sm"
                              >
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-600">
                          {formatTimeRange(slot.time)}
                        </span>
                              </div>
                          ))}
                        </div>
                      </div>
                  ))}
                </div>
              </div>
          ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Chưa chọn buổi học</p>
                <p className="text-sm text-gray-400">
                  Chọn buổi học từ lịch bên trên
                </p>
              </div>
          )}
        </div>

        {/* PRICE SUMMARY */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Giá/slot
                <span className="text-xs text-gray-500 ml-1">(1 slot = 1 giờ)</span>
              </span>
              <span className="font-semibold">{formatVND(tutor.pricePerHour)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Số slot đã chọn</span>
              <span className="font-semibold">{selectedSlots.length}</span>
            </div>

            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Tổng tiền</span>
                <span className="text-2xl font-bold text-blue-600">
                {formatVND(totalPrice)}
              </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Verification */}
        {selectedSlots.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                Xác thực bảo mật
              </span>
            </div>
            <TurnstileGuard 
              onVerified={setTurnstileToken}
              onError={() => setTurnstileToken(null)}
            />
            {!turnstileToken && (
              <p className="text-xs text-blue-700 mt-2">
                Vui lòng hoàn thành xác thực để tiếp tục thanh toán
              </p>
            )}
          </div>
        )}

        <Button
            onClick={handlePaymentClick}
            disabled={selectedSlots.length === 0 || !turnstileToken}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!turnstileToken && selectedSlots.length > 0 
            ? "Hoàn thành xác thực để thanh toán"
            : `Thanh toán (${selectedSlots.length} ${selectedSlots.length === 1 ? "buổi" : "buổi"})`
          }
        </Button>

        <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
          <p>Bằng việc đặt lịch, bạn đồng ý với Điều khoản dịch vụ</p>
          <p>Miễn phí hủy trong vòng 24 giờ trước buổi học</p>
        </div>
      </div>
  );
};

export default BookingSummary;
