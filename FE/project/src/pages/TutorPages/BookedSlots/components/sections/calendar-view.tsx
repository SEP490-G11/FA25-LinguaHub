import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookedSlot } from '../../booked-slots';

interface CalendarViewProps {
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
  bookings: BookedSlot[];
}

const CalendarView = ({
  onSelectDate,
  selectedDate,
  bookings,
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
      if (!b.start_time) return false;
      try {
        // Parse the date string directly (format: "2025-12-02T09:00:00")
        const bookingDateStr = b.start_time.split('T')[0];
        return bookingDateStr === dateStr;
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
          
          // Check if date is today, past, or future
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const currentDate = new Date(year, month, day);
          currentDate.setHours(0, 0, 0, 0);
          
          const isToday = currentDate.getTime() === today.getTime();
          const isPast = currentDate < today;
          const isFuture = currentDate > today;

          // Determine styling based on date status
          let bgClass = '';
          let borderClass = '';
          let textClass = '';
          let labelClass = '';
          
          if (isSelected) {
            // Selected date - always blue
            bgClass = 'bg-blue-600';
            borderClass = 'border-blue-600';
            textClass = 'text-white';
          } else if (isToday && hasSlot) {
            // Today with booking - blue
            bgClass = 'bg-gradient-to-br from-blue-100 to-blue-200';
            borderClass = 'border-blue-400 hover:from-blue-200 hover:to-blue-300 hover:border-blue-500';
            textClass = 'text-blue-900';
            labelClass = 'text-blue-700';
          } else if (isPast && hasSlot) {
            // Past date with booking - gray
            bgClass = 'bg-gradient-to-br from-gray-100 to-gray-200';
            borderClass = 'border-gray-300';
            textClass = 'text-gray-600';
            labelClass = 'text-gray-500';
          } else if (isFuture && hasSlot) {
            // Future date with booking - green
            bgClass = 'bg-gradient-to-br from-green-100 to-green-200';
            borderClass = 'border-green-400 hover:from-green-200 hover:to-green-300 hover:border-green-500';
            textClass = 'text-green-900';
            labelClass = 'text-green-700';
          } else {
            // No booking - default
            bgClass = '';
            borderClass = 'border-slate-200 hover:bg-blue-50 hover:border-blue-300';
            textClass = 'text-slate-700';
          }

          return (
            <div
              key={day}
              onClick={() => handleDateClick(day)}
              className={`aspect-square rounded-xl border-2 p-2 cursor-pointer transition-all ${bgClass} ${borderClass} ${isSelected ? 'shadow-lg' : hasSlot ? 'shadow-md' : ''}`}
            >
              <div className={`text-sm font-bold ${textClass}`}>
                {day}
              </div>
              {hasSlot && !isSelected && (
                <div className={`text-[10px] font-semibold mt-1 ${labelClass}`}>
                  ● Có lịch
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
