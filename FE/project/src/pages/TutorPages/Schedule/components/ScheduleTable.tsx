import React, { memo } from 'react';
import { DaySchedule, TimeSlot, BookingPlan } from '@/pages/TutorPages/Schedule/type';

interface ScheduleTableProps {
  schedule: DaySchedule[];
  getSlotForTime: (day: DaySchedule, timeId: string) => TimeSlot | null;
  bookingPlans?: BookingPlan[];
}

export const ScheduleTable: React.FC<ScheduleTableProps> = memo(({
  schedule,
  getSlotForTime,
  bookingPlans = [],
}) => {
  // Early return if no valid data
  if (!schedule || !Array.isArray(schedule)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Không có dữ liệu lịch để hiển thị</p>
      </div>
    );
  }

  const enabledDays = schedule.filter((day) => day && day.isEnabled);

  const timeObjectToString = (timeObj: { hour: number; minute: number } | null | undefined) => {
    if (!timeObj || typeof timeObj.hour !== 'number' || typeof timeObj.minute !== 'number') {
      return '00:00';
    }
    return `${timeObj.hour.toString().padStart(2, '0')}:${timeObj.minute.toString().padStart(2, '0')}`;
  };

  const generateTimeSlotsFromBookingPlan = (plan: BookingPlan): TimeSlot[] => {
    if (!plan || !plan.start_hours || !plan.end_hours || !plan.slot_duration) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const startTime = timeObjectToString(plan.start_hours);
    const endTime = timeObjectToString(plan.end_hours);
    const duration = plan.slot_duration;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes + duration <= endMinutes) {
      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const endM = currentMinutes + duration;
      const endH = Math.floor(endM / 60);
      const endMinute = endM % 60;

      slots.push({
        id: `${startH}:${startM.toString().padStart(2, '0')}-${endH}:${endMinute.toString().padStart(2, '0')}`,
        startTime: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
        endTime: `${endH.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
      });

      currentMinutes += duration;
    }

    return slots;
  };

  // Helper function to get existing booking plan for a day
  const getExistingBookingPlan = (dayShortName: string): BookingPlan | null => {
    if (!bookingPlans || !Array.isArray(bookingPlans)) {
      return null;
    }
    return bookingPlans.find(plan => plan && plan.title === dayShortName) || null;
  };

  // Helper function to check if a time slot exists in existing booking plan
  const getExistingSlotForTime = (dayShortName: string, timeId: string): TimeSlot | null => {
    const existingPlan = getExistingBookingPlan(dayShortName);
    if (!existingPlan) return null;

    const existingSlots = generateTimeSlotsFromBookingPlan(existingPlan);
    return existingSlots.find(slot => slot.id === timeId) || null;
  };

  // Get all time slots including both new schedule and existing booking plans
  const getAllTimeSlotsIncludingExisting = (): string[] => {
    const allSlots = new Set<string>();

    // Add slots from current schedule (new/preview slots)
    if (schedule && Array.isArray(schedule)) {
      schedule.forEach(day => {
        if (day && day.isEnabled && day.slots && Array.isArray(day.slots) && day.slots.length > 0) {
          day.slots.forEach(slot => {
            if (slot && slot.id) {
              allSlots.add(slot.id);
            }
          });
        }
      });
    }

    // Add slots from existing booking plans
    if (bookingPlans && Array.isArray(bookingPlans)) {
      bookingPlans.forEach(plan => {
        if (plan && plan.start_hours && plan.end_hours) {
          const existingSlots = generateTimeSlotsFromBookingPlan(plan);
          existingSlots.forEach(slot => {
            if (slot && slot.id) {
              allSlots.add(slot.id);
            }
          });
        }
      });
    }

    return Array.from(allSlots).sort((a, b) => {
      try {
        if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
          return 0;
        }

        const aParts = a.split('-');
        const bParts = b.split('-');

        if (aParts.length < 1 || bParts.length < 1) {
          return 0;
        }

        const [aStartTime] = aParts;
        const [bStartTime] = bParts;

        const aTimeParts = aStartTime.split(':');
        const bTimeParts = bStartTime.split(':');

        if (aTimeParts.length < 2 || bTimeParts.length < 2) {
          return 0;
        }

        const [aHour, aMin] = aTimeParts.map(Number);
        const [bHour, bMin] = bTimeParts.map(Number);

        if (isNaN(aHour) || isNaN(aMin) || isNaN(bHour) || isNaN(bMin)) {
          return 0;
        }

        const aMinutes = aHour * 60 + aMin;
        const bMinutes = bHour * 60 + bMin;
        return aMinutes - bMinutes;
      } catch (error) {
        return 0;
      }
    });
  };

  // Get all days to display (both enabled days and days with existing booking plans)
  const getAllDaysToDisplay = () => {
    const daysMap = new Map<string, DaySchedule>();

    // Add enabled days from current schedule
    if (enabledDays && Array.isArray(enabledDays)) {
      enabledDays.forEach(day => {
        if (day && day.shortName) {
          daysMap.set(day.shortName, day);
        }
      });
    }

    // Add days from existing booking plans
    if (bookingPlans && Array.isArray(bookingPlans)) {
      bookingPlans.forEach(plan => {
        if (plan && plan.title && plan.start_hours && plan.end_hours && !daysMap.has(plan.title)) {
          // Create a virtual day for existing booking plan
          const virtualDay: DaySchedule = {
            id: 0, // Virtual ID
            name: plan.title,
            shortName: plan.title,
            isEnabled: false,
            startTime: timeObjectToString(plan.start_hours),
            endTime: timeObjectToString(plan.end_hours),
            slots: generateTimeSlotsFromBookingPlan(plan)
          };
          daysMap.set(plan.title, virtualDay);
        }
      });
    }

    return Array.from(daysMap.values()).sort((a, b) => {
      // Sort by day order: T2, T3, T4, T5, T6, T7, CN
      const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const aIndex = dayOrder.indexOf(a.shortName);
      const bIndex = dayOrder.indexOf(b.shortName);
      return aIndex - bIndex;
    });
  };

  const displayTimeSlots = getAllTimeSlotsIncludingExisting();
  const displayDays = getAllDaysToDisplay();

  if (displayTimeSlots.length === 0 && displayDays.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-sm">Chưa có lịch làm việc</p>
          <p className="text-xs mt-1">
            {bookingPlans.length > 0
              ? "Chọn ngày và nhấn 'Xem lịch' để hiển thị lịch hiện có"
              : "Vui lòng cấu hình và nhấn 'Tạo lịch'"
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="bg-blue-600 text-white font-semibold text-center py-1.5 border-r border-blue-700 min-w-[80px]">
              Giờ
            </th>
            {displayDays.map((day) => {
              const hasExistingPlan = getExistingBookingPlan(day.shortName);
              const hasNewSchedule = day.isEnabled;

              // Simplified header styling
              let headerClasses = 'text-white font-semibold text-center py-2 border-r border-gray-300 last:border-r-0 min-w-[80px] ';

              if (hasNewSchedule || hasExistingPlan) {
                headerClasses += 'bg-blue-600';
              } else {
                headerClasses += 'bg-gray-500';
              }

              return (
                <th
                  key={`${day.shortName}-${day.id}`}
                  className={headerClasses}
                >
                  {day.shortName}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {displayTimeSlots.map((timeId) => {
            const [startTime] = timeId.split('-');
            const [startH, startM] = startTime.split(':');

            return (
              <tr key={timeId}>
                <td className="bg-gray-50 text-center py-2 font-medium border-r border-b border-gray-200 text-gray-700 min-w-[80px]">
                  {startH.padStart(2, '0')}:{startM.padStart(2, '0')}
                </td>
                {displayDays.map((day) => {
                  // Check for new schedule slot (from current form)
                  const newSlot = getSlotForTime(day, timeId);
                  // Check for existing booking plan slot
                  const existingSlot = getExistingSlotForTime(day.shortName, timeId);

                  // Determine which slot to display and its type
                  const hasNewSlot = !!newSlot;
                  const hasExistingSlot = !!existingSlot;

                  // Simplified cell styling - just show available/unavailable
                  let cellClasses = 'text-center py-2 border-r border-b border-gray-200 last:border-r-0 ';
                  let content = '';

                  if (hasNewSlot || hasExistingSlot) {
                    // Has schedule - show as available
                    cellClasses += 'bg-green-100 text-green-700';
                    content = '✓';
                  } else {
                    // No schedule - show as empty
                    cellClasses += 'bg-gray-50 text-gray-400';
                    content = '-';
                  }

                  return (
                    <td
                      key={`${day.shortName}-${timeId}`}
                      className={cellClasses}
                      title={hasNewSlot || hasExistingSlot ? 'Có lịch làm việc' : 'Trống'}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
