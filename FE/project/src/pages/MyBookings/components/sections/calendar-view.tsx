import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookingSlot } from '@/types/MyBooking';

interface CalendarViewProps {
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
  bookings: BookingSlot[];
  userID: number | null;
}

const CalendarView = ({
  onSelectDate,
  selectedDate,
  bookings,
  userID,
}: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  // Vietnamese month names
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelectDate(dateStr);
  };

  const hasBooking = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.some((b) => {
      try {
        const date = new Date(b.startTime);
        if (isNaN(date.getTime())) return false;
        const bookingDate = date.toISOString().split('T')[0];
        return bookingDate === dateStr && b.userID === userID;
      } catch {
        return false;
      }
    });
  };

  const emptyDays: (number | null)[] = Array.from(
    { length: firstDayOfMonth },
    () => null
  );
  const monthDays: (number | null)[] = Array.from(
    { length: daysInMonth },
    (_, i) => i + 1
  );
  const calendarDays = [...emptyDays, ...monthDays];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          {monthNames[month]} {year}
        </h2>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((d) => (
          <div
            key={d}
            className="text-center font-bold text-sm text-slate-600 py-2"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;
          const hasSlot = hasBooking(day);
          
          // Kiểm tra ngày đã qua chưa (so sánh với ngày hôm nay)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const currentDate = new Date(year, month, day);
          const isPast = currentDate < today;

          return (
            <div
              key={day}
              onClick={() => handleDateClick(day)}
              className={`aspect-square rounded-xl border-2 p-2 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                  : hasSlot && isPast
                    ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 shadow-sm'
                    : hasSlot
                      ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-400 hover:from-yellow-200 hover:to-yellow-300 hover:border-yellow-500 shadow-md'
                      : 'border-slate-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <div
                className={`text-sm font-bold ${
                  isSelected 
                    ? 'text-white' 
                    : hasSlot && isPast 
                      ? 'text-gray-500' 
                      : hasSlot 
                        ? 'text-yellow-900' 
                        : 'text-slate-700'
                }`}
              >
                {day}
              </div>
              {hasSlot && !isSelected && (
                <div className={`text-[10px] font-semibold mt-1 ${
                  isPast ? 'text-gray-500' : 'text-yellow-700'
                }`}>
                  ● {isPast ? 'Đã qua' : 'Có lịch'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
