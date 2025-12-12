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

export interface DateRangeFilterProps {
    startDate: Date;
    endDate: Date;
    onDateChange: (startDate: Date, endDate: Date) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
    startDate,
    endDate,
    onDateChange,
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
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center" role="search" aria-label="Bộ lọc khoảng thời gian">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <span className="text-sm font-medium text-blue-100" id="date-filter-label">
                    Lọc theo khoảng thời gian:
                </span>

                {/* Start Date Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                'w-[200px] justify-start text-left font-normal border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white',
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

                <span className="text-sm text-blue-100">đến</span>

                {/* End Date Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                'w-[200px] justify-start text-left font-normal border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white',
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
                    className="text-sm text-red-200 bg-red-900/50 px-3 py-2 rounded-md border border-red-500/50"
                    role="alert"
                >
                    {validationError}
                </div>
            )}
        </div>
    );
};
