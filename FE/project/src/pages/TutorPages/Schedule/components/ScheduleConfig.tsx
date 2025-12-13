import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ScheduleConfigProps {
  slotDuration: number;
  defaultPrice: number;
  meetingUrl: string;
  meetingUrlError: string;
  hasExistingPlans: boolean;
  onSlotDurationChange: (duration: number) => void;
  onDefaultPriceChange: (price: number) => void;
  onMeetingUrlChange: (url: string) => void;
}

export const ScheduleConfig: React.FC<ScheduleConfigProps> = ({
  slotDuration,
  defaultPrice,
  meetingUrl,
  meetingUrlError,
  hasExistingPlans,
  onDefaultPriceChange,
  onMeetingUrlChange,
}) => {

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600">
            Thời gian slot
          </Label>
          <div className="h-8 px-3 flex items-center bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-xs font-medium text-blue-700">{slotDuration} phút</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="defaultPrice" className="text-xs font-medium text-gray-600">
            Giá tiền slot
          </Label>
          {hasExistingPlans ? (
            <div className="h-8 px-3 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md">
              <span className="text-xs font-medium text-blue-700">
                {defaultPrice.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs text-blue-600">VNĐ</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Input
                id="defaultPrice"
                type="number"
                min="0"
                step="10000"
                value={defaultPrice}
                onChange={(e) => onDefaultPriceChange(Number(e.target.value))}
                className="h-8 text-xs"
                placeholder="Nhập giá tiền"
              />
              <span className="text-xs text-gray-500 min-w-[40px]">VNĐ</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="meetingUrl" className="text-xs font-medium">
          Link Meeting
        </Label>
        <Input
          id="meetingUrl"
          type="url"
          placeholder="https://meet.google.com/..."
          value={meetingUrl}
          onChange={(e) => onMeetingUrlChange(e.target.value)}
          className={`h-8 text-xs ${meetingUrlError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {meetingUrlError && (
          <p className="text-xs text-red-500 mt-1">{meetingUrlError}</p>
        )}
      </div>
    </>
  );
};
