import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DateRangeFilterProps } from '../types';

interface DashboardHeaderProps extends DateRangeFilterProps {
  userName: string;
  subtitle?: string;
  bgGradient?: string;
}

/**
 * DashboardHeader component displays a welcome banner with the tutor's name
 * and a date range filter for filtering dashboard data.
 * 
 * Validates that the start date is not after the end date before triggering the callback.
 * 
 * @param userName - The tutor's full name to display in the welcome message
 * @param startDate - The currently selected start date
 * @param endDate - The currently selected end date
 * @param onDateChange - Callback function triggered when valid dates are selected
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  startDate,
  endDate,
  onDateChange,
  subtitle = 'Theo dõi hiệu suất giảng dạy và doanh thu của bạn.',
  bgGradient = 'from-blue-600 to-indigo-800',
}) => {
  const [localStartDate, setLocalStartDate] = useState<Date>(startDate);
  const [localEndDate, setLocalEndDate] = useState<Date>(endDate);
  const [validationError, setValidationError] = useState<string>('');

  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    setLocalStartDate(date);
    setValidationError('');
    
    // Validate: start date should not be after end date
    if (date > localEndDate) {
      setValidationError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
      return;
    }
    
    // Trigger callback with valid dates
    onDateChange(date, localEndDate);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    setLocalEndDate(date);
    setValidationError('');
    
    // Validate: end date should not be before start date
    if (localStartDate > date) {
      setValidationError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
      return;
    }
    
    // Trigger callback with valid dates
    onDateChange(localStartDate, date);
  };

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className={`bg-gradient-to-r ${bgGradient} rounded-lg p-6 text-white shadow-lg`} role="banner">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Xin chào, {userName}! 
        </h1>
        <p className="text-white/90 text-sm md:text-base">
          {subtitle}
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center" role="search" aria-label="Bộ lọc khoảng thời gian">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <span className="text-sm font-medium text-muted-foreground" id="date-filter-label">
            Lọc theo khoảng thời gian:
          </span>
          
          {/* Start Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !localStartDate && 'text-muted-foreground'
                )}
                aria-label="Chọn ngày bắt đầu"
                aria-describedby="date-filter-label"
              >
                <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                {localStartDate ? (
                  format(localStartDate, 'dd/MM/yyyy')
                ) : (
                  <span>Chọn ngày bắt đầu</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localStartDate}
                onSelect={handleStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-sm text-muted-foreground">đến</span>

          {/* End Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !localEndDate && 'text-muted-foreground'
                )}
                aria-label="Chọn ngày kết thúc"
                aria-describedby="date-filter-label"
              >
                <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                {localEndDate ? (
                  format(localEndDate, 'dd/MM/yyyy')
                ) : (
                  <span>Chọn ngày kết thúc</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localEndDate}
                onSelect={handleEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div
            className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200"
            role="alert"
          >
            {validationError}
          </div>
        )}
      </div>
    </div>
  );
};
