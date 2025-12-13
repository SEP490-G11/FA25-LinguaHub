export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  id: number;
  name: string;
  shortName: string;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
  slots: TimeSlot[];
}

export interface TimeObject {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

// Union type to handle both string and object formats from API
export type TimeValue = TimeObject | string;

export interface BookingPlanRequest {
  title: string;
  start_hours: TimeObject;
  end_hours: TimeObject;
  slot_duration: number;
  price_per_hours: number;
  meeting_url: string;
}

export interface BookingPlanResponse {
  success: boolean;
  booking_planid: number;
  slots_created: number;
}

// Raw booking plan from API (may have different time formats)
export interface BookingPlanRaw {
  title: string;
  createdAt: string;
  updatedAt: string;
  booking_planid: number;
  tutor_id: number;
  start_hours: TimeValue;
  end_hours: TimeValue;
  slot_duration: number;
  price_per_hours: number;
  meeting_url: string;
  is_open: boolean;
  is_active: boolean;
}

// Normalized booking plan (always has TimeObject format)
export interface BookingPlan {
  title: string;
  createdAt: string;
  updatedAt: string;
  booking_planid: number;
  tutor_id: number;
  start_hours: TimeObject;
  end_hours: TimeObject;
  slot_duration: number;
  price_per_hours: number;
  meeting_url: string;
  is_open: boolean;
  is_active: boolean;
}

export interface BookingPlansResponse {
  tutor_id: number;
  plans: BookingPlanRaw[];
}

export interface UpdateBookingPlanResponse {
  success: boolean;
  updated_slots: number;
}

export interface DeleteBookingPlanResponse {
  success: boolean;
  message: string;
}
