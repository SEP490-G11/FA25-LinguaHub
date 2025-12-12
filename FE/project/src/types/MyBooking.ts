// API Response từ backend - supports both camelCase (local) and snake_case (production)
export interface BookingSlotAPI {
  // snake_case (production)
  slotid?: number;
  booking_planid?: number;
  tutor_id?: number;
  user_id?: number;
  start_time?: string;
  end_time?: string;
  payment_id?: number;
  locked_at?: string;
  expires_at?: string;
  meeting_url?: string | null;
  tutor_fullname?: string | null;
  learner_join?: boolean | null;
  tutor_join?: boolean | null;
  learner_evidence?: string | null;
  tutor_evidence?: string | null;
  // camelCase (local)
  slotID?: number;
  bookingPlanID?: number;
  tutorID?: number;
  userID?: number;
  startTime?: string;
  endTime?: string;
  paymentID?: number;
  lockedAt?: string;
  expiresAt?: string;
  meetingUrl?: string | null;
  tutorFullName?: string | null;
  learnerJoin?: boolean | null;
  tutorJoin?: boolean | null;
  learnerEvidence?: string | null;
  tutorEvidence?: string | null;
  // common
  status: string;
}

// Interface sử dụng trong component (camelCase)
export interface BookingSlot {
  slotID: number;
  bookingPlanID: number;
  tutorID: number;
  userID: number;
  startTime: string;
  endTime: string;
  paymentID: number;
  status: string;
  lockedAt: string;
  expiresAt: string;
  meetingUrl: string | null;
  tutorFullName: string | null;
  learnerJoin: boolean | null;
  tutorJoin: boolean | null;
  learnerEvidence: string | null;
  tutorEvidence: string | null;
}

export interface BookingStats {
  upcoming: number;
  expired: number;
  totalSlots: number;
  totalHours: number;
}

// Transform function to normalize API response
export const transformBookingSlot = (slot: BookingSlotAPI): BookingSlot => {
  return {
    slotID: slot.slotid ?? slot.slotID ?? 0,
    bookingPlanID: slot.booking_planid ?? slot.bookingPlanID ?? 0,
    tutorID: slot.tutor_id ?? slot.tutorID ?? 0,
    userID: slot.user_id ?? slot.userID ?? 0,
    startTime: slot.start_time ?? slot.startTime ?? '',
    endTime: slot.end_time ?? slot.endTime ?? '',
    paymentID: slot.payment_id ?? slot.paymentID ?? 0,
    status: slot.status,
    lockedAt: slot.locked_at ?? slot.lockedAt ?? '',
    expiresAt: slot.expires_at ?? slot.expiresAt ?? '',
    meetingUrl: slot.meeting_url ?? slot.meetingUrl ?? null,
    tutorFullName: slot.tutor_fullname ?? slot.tutorFullName ?? null,
    learnerJoin: slot.learner_join ?? slot.learnerJoin ?? null,
    tutorJoin: slot.tutor_join ?? slot.tutorJoin ?? null,
    learnerEvidence: slot.learner_evidence ?? slot.learnerEvidence ?? null,
    tutorEvidence: slot.tutor_evidence ?? slot.tutorEvidence ?? null,
  };
};
