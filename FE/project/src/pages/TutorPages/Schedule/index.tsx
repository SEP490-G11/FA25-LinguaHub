/**
 * Schedule Page - Tutor Schedule Management
 * 
 * Migration Notes:
 * - Migrated to use StandardPageHeading with blue-purple gradient
 * - Kept existing 3-column layout intact (config, schedule table, booking plans list)
 * - All functionality preserved: CRUD operations, time slot generation
 * - No changes to complex state management
 * 
 * @see .kiro/specs/tutor-pages-migration/design.md
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';
import { DaySchedule, TimeSlot, BookingPlanRequest, BookingPlan, BookingPlanRaw } from '@/pages/TutorPages/Schedule/type';
import { bookingPlanApi } from '@/pages/TutorPages/Schedule/booking-plan-api';
import { ScheduleConfig } from './components/ScheduleConfig';
import { DaySelection } from './components/DaySelection';
import { DayTimeCustomization } from './components/DayTimeCustomization';
import { ScheduleTable } from './components/ScheduleTable';
import { BookingPlansList } from './components/BookingPlansList';
import { StandardPageHeading } from '@/components/shared';

const TutorSchedule: React.FC = () => {
  // Add error state for component-level error handling
  const [componentError, setComponentError] = useState<string | null>(null);

  // Wrap component in try-catch
  try {
  // Default schedule configuration
  const getDefaultSchedule = (): DaySchedule[] => [
    { id: 2, name: 'Thứ 2', shortName: 'T2', isEnabled: false, startTime: '08:00', endTime: '22:00', slots: [] },
    { id: 3, name: 'Thứ 3', shortName: 'T3', isEnabled: true, startTime: '09:00', endTime: '22:00', slots: [] },
    { id: 4, name: 'Thứ 4', shortName: 'T4', isEnabled: true, startTime: '08:00', endTime: '22:00', slots: [] },
    { id: 5, name: 'Thứ 5', shortName: 'T5', isEnabled: true, startTime: '08:00', endTime: '22:00', slots: [] },
    { id: 6, name: 'Thứ 6', shortName: 'T6', isEnabled: true, startTime: '08:00', endTime: '22:00', slots: [] },
    { id: 7, name: 'Thứ 7', shortName: 'T7', isEnabled: false, startTime: '08:00', endTime: '22:00', slots: [] },
    { id: 8, name: 'Chủ nhật', shortName: 'CN', isEnabled: false, startTime: '08:00', endTime: '22:00', slots: [] },
  ];

  const [defaultStartTime, setDefaultStartTime] = useState('08:00');
  const [defaultEndTime, setDefaultEndTime] = useState('22:00');
  const [slotDuration, setSlotDuration] = useState(60);
  const [defaultPrice, setDefaultPrice] = useState(0); // No default price, will be set from booking plans
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingUrlError, setMeetingUrlError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New state variables for CRUD functionality
  const [bookingPlans, setBookingPlans] = useState<BookingPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<BookingPlan | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Enhanced loading states for specific operations
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to normalize booking plan data
  const normalizeBookingPlan = useCallback((plan: BookingPlanRaw): BookingPlan | null => {
    if (!plan || typeof plan.title !== 'string') {
      return null;
    }

    let normalizedPlan: BookingPlan = { ...plan } as BookingPlan;

    // Handle start_hours
    if (typeof plan.start_hours === 'string') {
      const [hour, minute] = (plan.start_hours as string).split(':').map(Number);
      if (isNaN(hour) || isNaN(minute)) {
        return null;
      }
      normalizedPlan.start_hours = { hour, minute, second: 0, nano: 0 };
    } else if (typeof plan.start_hours === 'object' && 
               typeof plan.start_hours.hour === 'number' && 
               typeof plan.start_hours.minute === 'number') {
      normalizedPlan.start_hours = plan.start_hours;
    } else {
      return null;
    }

    // Handle end_hours
    if (typeof plan.end_hours === 'string') {
      const [hour, minute] = (plan.end_hours as string).split(':').map(Number);
      if (isNaN(hour) || isNaN(minute)) {
        return null;
      }
      normalizedPlan.end_hours = { hour, minute, second: 0, nano: 0 };
    } else if (typeof plan.end_hours === 'object' && 
               typeof plan.end_hours.hour === 'number' && 
               typeof plan.end_hours.minute === 'number') {
      normalizedPlan.end_hours = plan.end_hours;
    } else {
      return null;
    }

    if (typeof plan.slot_duration !== 'number') {
      return null;
    }

    // Ensure meeting_url is never null
    if (!normalizedPlan.meeting_url) {
      normalizedPlan.meeting_url = '';
    }

    return normalizedPlan;
  }, []);

  // Fetch existing booking plans on component mount
  useEffect(() => {
    const fetchBookingPlans = async () => {
      try {
        setIsLoading(true);
        const response = await bookingPlanApi.getBookingPlans();
        
        if (response && response.plans && Array.isArray(response.plans)) {
          const validPlans = response.plans.map(normalizeBookingPlan).filter((plan): plan is BookingPlan => plan !== null);
          const filteredPlans = validPlans.filter((plan): plan is BookingPlan => plan !== null);
          setBookingPlans(filteredPlans);
          
          if (filteredPlans.length > 0) {
            setDefaultPrice(filteredPlans[0].price_per_hours);
          }
        } else {
          setBookingPlans([]);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách lịch làm việc.';
        toast.error(errorMessage);
        setBookingPlans([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingPlans();
  }, []);

  // Function to enter edit mode with existing booking plan data
  const handleEditBookingPlan = useCallback((plan: BookingPlan) => {
    setEditingPlan(plan);
    setIsEditMode(true);
    
    // Populate form with existing booking plan data
    const startTime = `${plan.start_hours.hour.toString().padStart(2, '0')}:${plan.start_hours.minute.toString().padStart(2, '0')}`;
    const endTime = `${plan.end_hours.hour.toString().padStart(2, '0')}:${plan.end_hours.minute.toString().padStart(2, '0')}`;
    
    setDefaultStartTime(startTime);
    setDefaultEndTime(endTime);
    setSlotDuration(plan.slot_duration);
    setDefaultPrice(plan.price_per_hours);
    setMeetingUrl(plan.meeting_url || '');
    
    // Update schedule to reflect the editing plan's day
    // Only enable and update the day being edited, keep others as they are
    setSchedule(prevSchedule => 
      prevSchedule.map(day => ({
        ...day,
        isEnabled: day.shortName === plan.title,
        startTime: day.shortName === plan.title ? startTime : day.startTime,
        endTime: day.shortName === plan.title ? endTime : day.endTime
      }))
    );
  }, []);

  // Function to reset form to default values
  const resetFormToDefaults = useCallback(() => {
    setDefaultStartTime('08:00');
    setDefaultEndTime('22:00');
    setSlotDuration(60);
    // Reset price to first booking plan's price if available
    if (bookingPlans.length > 0) {
      setDefaultPrice(bookingPlans[0].price_per_hours);
    }
    setMeetingUrl('');
    setMeetingUrlError('');
    setSchedule(getDefaultSchedule());
  }, [bookingPlans]);

  // Function to exit edit mode
  const handleCancelEdit = useCallback(() => {
    // Clear editing state properly
    setEditingPlan(null);
    setIsEditMode(false);
    
    // Reset form to default values
    resetFormToDefaults();
  }, [resetFormToDefaults]);

  // Function to delete booking plan with enhanced error handling
  const handleDeleteBookingPlan = useCallback(async (planId: number) => {
    try {
      setIsDeleting(true);
      const response = await bookingPlanApi.deleteBookingPlan(planId);
      
      if (response.success) {
        // Find the deleted plan for better success message
        const deletedPlan = bookingPlans.find(plan => plan.booking_planid === planId);
        const planTitle = deletedPlan ? deletedPlan.title : 'lịch làm việc';
        
        // Remove the deleted plan from local state
        setBookingPlans(prevPlans => prevPlans.filter(plan => plan.booking_planid !== planId));
        
        // Enhanced success message with API message and plan details
        const successMessage = response.message 
          ? `🗑️ ${response.message} (${planTitle})`
          : `🗑️ Xóa lịch làm việc "${planTitle}" thành công!`;
        
        toast.success(successMessage, {
          duration: 4000,
        });
      } else {
        toast.error('Có lỗi xảy ra khi xóa lịch làm việc.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa lịch làm việc. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [bookingPlans]);

  const [schedule, setSchedule] = useState<DaySchedule[]>(getDefaultSchedule());

  // Auto-apply default time to all days when default time changes
  const handleDefaultStartTimeChange = (time: string) => {
    setDefaultStartTime(time);
    
    if (isEditMode && editingPlan) {
      // In edit mode, only update the day being edited
      setSchedule(schedule.map(day => 
        day.shortName === editingPlan.title ? { ...day, startTime: time } : day
      ));
    } else {
      // In create mode, update all days
      setSchedule(schedule.map(day => ({ ...day, startTime: time })));
    }
  };

  const handleDefaultEndTimeChange = (time: string) => {
    setDefaultEndTime(time);
    
    if (isEditMode && editingPlan) {
      // In edit mode, only update the day being edited
      setSchedule(schedule.map(day => 
        day.shortName === editingPlan.title ? { ...day, endTime: time } : day
      ));
    } else {
      // In create mode, update all days
      setSchedule(schedule.map(day => ({ ...day, endTime: time })));
    }
  };

  const generateTimeSlots = (startTime: string, endTime: string, duration: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
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



  const handleGenerateSchedule = () => {
    const updatedSchedule = schedule.map((day) => ({
      ...day,
      slots: day.isEnabled ? generateTimeSlots(day.startTime, day.endTime, slotDuration) : [],
    }));
    setSchedule(updatedSchedule);
  };

  const handleDayToggle = (dayId: number) => {
    setSchedule(
      schedule.map((day) =>
        day.id === dayId ? { ...day, isEnabled: !day.isEnabled } : day
      )
    );
  };

  const handleDayTimeChange = (dayId: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(
      schedule.map((day) =>
        day.id === dayId ? { ...day, [field]: value } : day
      )
    );
    
    if (isEditMode && editingPlan) {
      const editingDay = schedule.find(day => day.id === dayId && day.shortName === editingPlan.title);
      if (editingDay) {
        if (field === 'startTime') {
          setDefaultStartTime(value);
        } else if (field === 'endTime') {
          setDefaultEndTime(value);
        }
      }
    }
  };

  const getSlotForTime = (day: DaySchedule, timeId: string): TimeSlot | null => {
    if (!day || !day.slots || !Array.isArray(day.slots) || !timeId) {
      return null;
    }
    return day.slots.find(slot => slot && slot.id === timeId) || null;
  };

  const validateMeetingUrl = (url: string | null, skipEmptyCheck?: boolean): boolean => {
    if (!url || !url.trim()) {
      if (skipEmptyCheck) {
        // In edit mode, allow empty URL if it was already set
        setMeetingUrlError('');
        return true;
      }
      setMeetingUrlError('Vui lòng nhập link meeting');
      return false;
    }

    try {
      const urlObj = new URL(url);
      if (!urlObj.protocol.startsWith('http')) {
        setMeetingUrlError('Link meeting phải bắt đầu bằng http:// hoặc https://');
        return false;
      }
      setMeetingUrlError('');
      return true;
    } catch {
      setMeetingUrlError('Link meeting không hợp lệ');
      return false;
    }
  };

  const handleMeetingUrlChange = (url: string) => {
    setMeetingUrl(url);
    if (meetingUrlError && url.trim()) {
      validateMeetingUrl(url);
    }
  };

  const handleSubmitSchedule = async () => {
    try {
      setIsSubmitting(true);

      // Validate meeting URL
      // In edit mode, allow keeping the existing URL
      const skipEmptyCheck = !!(isEditMode && editingPlan && meetingUrl === editingPlan.meeting_url);
      if (!validateMeetingUrl(meetingUrl, skipEmptyCheck)) {
        setIsSubmitting(false);
        toast.error('Vui lòng kiểm tra lại Meeting URL');
        return;
      }
      
      if (isEditMode && editingPlan) {
        setIsUpdating(true);
        
        const editingDay = schedule.find(day => day.shortName === editingPlan.title);
        
        if (!editingDay) {
          toast.error(`Không tìm thấy thông tin ngày "${editingPlan.title}" trong lịch hiện tại.`);
          return;
        }
        
        const actualStartTime = editingDay.startTime;
        const actualEndTime = editingDay.endTime;
        
        const [startHour, startMinute] = actualStartTime.split(':').map(Number);
        const [endHour, endMinute] = actualEndTime.split(':').map(Number);
        
        // Validate time values
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
          toast.error('Thời gian không hợp lệ. Vui lòng kiểm tra lại.');
          return;
        }
        
        if (startHour * 60 + startMinute >= endHour * 60 + endMinute) {
          toast.error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc.');
          return;
        }

        const bookingPlanData: BookingPlanRequest = {
          title: editingPlan.title,
          start_hours: {
            hour: startHour,
            minute: startMinute,
            second: 0,
            nano: 0,
          },
          end_hours: {
            hour: endHour,
            minute: endMinute,
            second: 0,
            nano: 0,
          },
          slot_duration: slotDuration,
          price_per_hours: defaultPrice,
          meeting_url: meetingUrl,
        };

        const response = await bookingPlanApi.updateBookingPlan(editingPlan.booking_planid, bookingPlanData);
        
        if (response.success) {
          // Enhanced success message with more details
          const timeInfo = `${actualStartTime}-${actualEndTime}`;
          const successMessage = response.updated_slots > 0 
            ? `✅ Cập nhật lịch làm việc "${editingPlan.title}" (${timeInfo}) thành công! Đã cập nhật ${response.updated_slots} slots.`
            : `✅ Cập nhật lịch làm việc "${editingPlan.title}" (${timeInfo}) thành công!`;
          
          toast.success(successMessage, {
            duration: 4000,
          });
          
          // Refresh booking plans list after successful update
          await refreshBookingPlans();
          
          // Exit edit mode and reset form
          handleCancelEdit();
        } else {
          toast.error('Có lỗi xảy ra khi cập nhật lịch làm việc.');
        }
      } else {
        // CREATE MODE: Create new booking plans
        // Validate that at least one day is selected
        const enabledDays = schedule.filter(day => day.isEnabled);
        if (enabledDays.length === 0) {
          toast.error('Vui lòng chọn ít nhất một ngày làm việc');
          return;
        }

        // Validate that schedule has been generated
        if (!enabledDays.some(day => day.slots.length > 0)) {
          toast.error('Vui lòng tạo lịch trước khi gửi');
          return;
        }

        // Create booking plans for each enabled day sequentially to avoid database deadlocks
        const responses = [];
        const failedDays = [];
        
        for (let i = 0; i < enabledDays.length; i++) {
          const day = enabledDays[i];
          const [startHour, startMinute] = day.startTime.split(':').map(Number);
          const [endHour, endMinute] = day.endTime.split(':').map(Number);

          const bookingPlanData: BookingPlanRequest = {
            title: day.shortName,
            start_hours: {
              hour: startHour,
              minute: startMinute,
              second: 0,
              nano: 0,
            },
            end_hours: {
              hour: endHour,
              minute: endMinute,
              second: 0,
              nano: 0,
            },
            slot_duration: slotDuration,
            price_per_hours: defaultPrice,
            meeting_url: meetingUrl,
          };

          try {
            const response = await bookingPlanApi.createBookingPlan(bookingPlanData);
            responses.push(response);
            
            // Add small delay between requests to reduce database contention
            if (enabledDays.indexOf(day) < enabledDays.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            failedDays.push({
              day: day.name,
              error: error instanceof Error ? error.message : 'Lỗi không xác định'
            });
          }
        }

        // Handle partial success/failure
        if (responses.length === 0) {
          // All failed
          const errorMessage = failedDays.length > 0 
            ? `Không thể tạo lịch làm việc. Lỗi: ${failedDays[0].error}`
            : 'Không thể tạo lịch làm việc. Vui lòng thử lại.';
          throw new Error(errorMessage);
        } else if (failedDays.length > 0) {
          // Partial success
          const totalSlots = responses.reduce((sum, res) => sum + res.slots_created, 0);
          const successMessage = `⚠️ Tạo được ${responses.length}/${enabledDays.length} lịch làm việc với ${totalSlots} slots. Thất bại: ${failedDays.map(f => f.day).join(', ')}`;
          toast.warning(successMessage, { duration: 6000 });
          
          // Refresh to show created plans
          await refreshBookingPlans();
          return; // Exit early to avoid showing success message
        }

        // Calculate total slots created
        const totalSlots = responses.reduce((sum, res) => sum + res.slots_created, 0);
        const createdPlansCount = responses.length;

        // Enhanced success message with more details
        const successMessage = `🎉 Tạo lịch làm việc thành công! Đã tạo ${createdPlansCount} lịch với tổng cộng ${totalSlots} slots.`;
        
        toast.success(successMessage, {
          duration: 5000,
        });
        
        // Refresh booking plans list after successful creation
        await refreshBookingPlans();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 
        (isEditMode ? 'Có lỗi xảy ra khi cập nhật lịch làm việc. Vui lòng thử lại.' : 'Có lỗi xảy ra khi tạo lịch làm việc. Vui lòng thử lại.');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsUpdating(false);
    }
  };

  // Helper function to refresh booking plans list with enhanced error handling
  const refreshBookingPlans = useCallback(async (showSuccessMessage = false) => {
    if (!isRefreshing) {
      try {
        setIsRefreshing(true);
        const updatedPlans = await bookingPlanApi.getBookingPlans();
        // Apply the same normalization logic as in the main fetch
        if (updatedPlans && updatedPlans.plans && Array.isArray(updatedPlans.plans)) {
          const normalizedPlans = updatedPlans.plans.map(normalizeBookingPlan).filter((plan): plan is BookingPlan => plan !== null);
          setBookingPlans(normalizedPlans);
        } else {
          setBookingPlans([]);
        }
        
        // Optional success feedback for manual refresh
        if (showSuccessMessage) {
          toast.success(`📋 Đã tải lại danh sách lịch làm việc (${updatedPlans.plans.length} lịch)`, {
            duration: 2000,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải lại danh sách lịch làm việc.';
        toast.error(errorMessage);
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [isRefreshing]);

  // Show loading state on initial load
  if (isLoading && bookingPlans.length === 0) {
    return (
      <div className="p-4 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu lịch làm việc...</p>
        </div>
      </div>
    );
  }

  // Show error state if component error exists
  if (componentError) {
    return (
      <div className="p-4 h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-4">{componentError}</p>
          <button 
            onClick={() => {
              setComponentError(null);
              window.location.reload();
            }} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Migrated from custom header to StandardPageHeading */}
      {/* Gradient colors match the original design */}
      <StandardPageHeading
        title="Lịch làm việc"
        description="Quản lý lịch làm việc và booking plans"
        icon={Calendar}
        gradientFrom="from-blue-600"
        gradientVia="via-purple-600"
        gradientTo="to-purple-600"
      />

      <div className="p-4 grid grid-cols-1 xl:grid-cols-[320px,1fr,300px] gap-3 flex-1 overflow-hidden min-h-0">
        {/* Left Panel - Configuration */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-semibold">Cấu hình lịch</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3 pr-2 text-sm">
            {isEditMode && editingPlan ? (
              /* EDIT MODE: Only show time customization for the editing day */
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{editingPlan.title}</Label>
                  <div className="flex items-center gap-1.5">
                    <Select value={defaultStartTime} onValueChange={handleDefaultStartTimeChange}>
                      <SelectTrigger className="h-8 flex-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {(() => {
                          const times: string[] = [];
                          for (let hour = 0; hour < 24; hour++) {
                            times.push(`${hour.toString().padStart(2, '0')}:00`);
                          }
                          return times.map((time) => (
                            <SelectItem key={time} value={time} className="text-xs">
                              {time}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-500">đến</span>
                    <Select value={defaultEndTime} onValueChange={handleDefaultEndTimeChange}>
                      <SelectTrigger className="h-8 flex-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {(() => {
                          const times: string[] = [];
                          for (let hour = 0; hour < 24; hour++) {
                            times.push(`${hour.toString().padStart(2, '0')}:00`);
                          }
                          return times.map((time) => (
                            <SelectItem key={time} value={time} className="text-xs">
                              {time}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            ) : (
              /* CREATE MODE: Show full configuration */
              <>
                <ScheduleConfig
                  slotDuration={slotDuration}
                  defaultPrice={defaultPrice}
                  meetingUrl={meetingUrl}
                  meetingUrlError={meetingUrlError}
                  hasExistingPlans={bookingPlans.length > 0}
                  onSlotDurationChange={setSlotDuration}
                  onDefaultPriceChange={setDefaultPrice}
                  onMeetingUrlChange={handleMeetingUrlChange}
                />

                <DaySelection
                  schedule={schedule}
                  bookingPlans={bookingPlans}
                  onDayToggle={handleDayToggle}
                />

                <DayTimeCustomization
                  schedule={schedule}
                  bookingPlans={bookingPlans}
                  onDayTimeChange={handleDayTimeChange}
                />
              </>
            )}

            {/* Only show "Xem lịch" button in CREATE mode */}
            {!isEditMode && (
              <Button
                onClick={handleGenerateSchedule}
                className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs"
              >
                Xem lịch
              </Button>
            )}

            <Button
              onClick={handleSubmitSchedule}
              disabled={
                isSubmitting || isUpdating || isDeleting || isRefreshing || 
                // In EDIT mode, only check if we have valid times
                // In CREATE mode, check if schedule has been generated
                (isEditMode ? false : !schedule.some(day => day.isEnabled && day.slots.length > 0))
              }
              className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs disabled:opacity-50"
            >
              {isSubmitting ? (isEditMode ? 'Đang cập nhật...' : 'Đang tạo...') : (isEditMode ? `Cập nhật ${editingPlan?.title || ''}` : 'Lưu lịch làm việc')}
            </Button>

            {isEditMode && (
              <Button
                onClick={handleCancelEdit}
                disabled={isSubmitting || isUpdating || isDeleting}
                className="w-full bg-gray-600 hover:bg-gray-700 h-8 text-xs disabled:opacity-50"
              >
                Hủy chỉnh sửa
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Middle Panel - Schedule Display */}
        <Card className="flex flex-col overflow-hidden min-h-0">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-semibold">Lịch Làm Việc</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden min-h-0">
            <ScheduleTable
              schedule={schedule}
              getSlotForTime={getSlotForTime}
              bookingPlans={bookingPlans}
            />
          </CardContent>
        </Card>

        {/* Right Panel - Booking Plans List */}
        <div className="flex flex-col overflow-hidden min-h-0">
          <BookingPlansList
            bookingPlans={bookingPlans}
            isLoading={isLoading || isRefreshing}
            isDeleting={isDeleting}
            onEdit={handleEditBookingPlan}
            onDelete={handleDeleteBookingPlan}
            onRefresh={() => refreshBookingPlans(true)}
          />
        </div>
      </div>
    </div>
  );
  
  } catch (error) {
    setComponentError(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    
    return (
      <div className="p-4 h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-4">{componentError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
};

export default TutorSchedule;
