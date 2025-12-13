import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DaySchedule, BookingPlan } from '@/pages/TutorPages/Schedule/type';

interface DayTimeCustomizationProps {
  schedule: DaySchedule[];
  bookingPlans?: BookingPlan[];
  onDayTimeChange: (dayId: number, field: 'startTime' | 'endTime', value: string) => void;
}

export const DayTimeCustomization: React.FC<DayTimeCustomizationProps> = ({
  schedule,
  bookingPlans = [],
  onDayTimeChange,
}) => {
  // Only show enabled days that don't already have a booking plan
  const enabledDays = schedule.filter(
    (day) =>
      day.isEnabled && !bookingPlans.some((plan) => plan.title === day.shortName)
  );

  // Generate time options with only :00 and :30 minutes
  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  if (enabledDays.length === 0) {
    return null;
  }

  const isTimeInvalid = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return startH * 60 + startM >= endH * 60 + endM;
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">Tùy chỉnh giờ cho từng ngày</Label>
      {enabledDays.map((day) => {
        const isInvalid = isTimeInvalid(day.startTime, day.endTime);

        return (
          <div key={day.id} className="space-y-1">
            <Label className="text-xs font-medium text-gray-700">{day.name}</Label>
            <div className="flex items-center gap-1.5">
              <Select
                value={day.startTime}
                onValueChange={(value) => onDayTimeChange(day.id, 'startTime', value)}
              >
                <SelectTrigger className={`h-8 flex-1 text-xs ${isInvalid ? 'border-red-500' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time} className="text-xs">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500">đến</span>
              <Select
                value={day.endTime}
                onValueChange={(value) => onDayTimeChange(day.id, 'endTime', value)}
              >
                <SelectTrigger className={`h-8 flex-1 text-xs ${isInvalid ? 'border-red-500' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time} className="text-xs">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isInvalid && (
              <p className="text-[10px] text-red-500 mt-1">
                Giờ bắt đầu phải nhỏ hơn giờ kết thúc
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
