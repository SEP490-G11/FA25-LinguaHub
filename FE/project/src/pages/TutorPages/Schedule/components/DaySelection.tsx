import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BookingPlan, DaySchedule } from '@/pages/TutorPages/Schedule/type';

interface DaySelectionProps {
  schedule: DaySchedule[];
  bookingPlans?: BookingPlan[];
  onDayToggle: (dayId: number) => void;
}

export const DaySelection: React.FC<DaySelectionProps> = ({
  schedule,
  bookingPlans = [],
  onDayToggle,
}) => {
  // Filter out days that already exist in bookingPlans
  const availableDays = schedule.filter(
    (day) => !bookingPlans.some((plan) => plan.title === day.shortName)
  );

  // If no days available, show message
  if (availableDays.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-xs font-medium">Chọn ngày làm việc</Label>
        <p className="text-xs text-gray-500">
          Tất cả các ngày đã được thêm vào lịch làm việc.
        </p>
      </div>
    );
  }

  return (
    <div className=" space-y-2">
      <Label className="text-xs font-medium">Chọn ngày làm việc</Label>
      <div className="grid grid-cols-2 gap-1.5">
        {availableDays.map((day) => (
          <div key={day.id} className="flex items-center gap-1.5">
            <Checkbox
              id={`day-${day.id}`}
              checked={day.isEnabled}
              onCheckedChange={() => onDayToggle(day.id)}
              className="h-3.5 w-3.5"
            />
            <Label htmlFor={`day-${day.id}`} className="text-xs cursor-pointer">
              {day.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
