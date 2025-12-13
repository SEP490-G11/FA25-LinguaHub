// Slot content interface
export interface SlotContent {
  slot_number: number;
  content: string;
}

// TutorPackage interface
export interface TutorPackage {
  packageID?: number;
  packageid?: number;
  name: string;
  description?: string;
  isActive?: boolean;
  is_active?: boolean;
  maxSlots?: number;
  max_slots?: number;
  requirement?: string;
  objectives?: string;
  slotContent?: SlotContent[];
  slot_content?: SlotContent[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

// UserPackage interface
export interface UserPackageAPI {
  userPackageID?: number;
  user_package_id?: number;
  tutorPackage?: TutorPackage;
  tutor_package?: TutorPackage;
  slotsRemaining?: number;
  slots_remaining?: number;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

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
  user_package_id?: number | null;
  user_package?: UserPackageAPI | null;
  tutor_package_id?: number | null;
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
  userPackageId?: number | null;
  userPackage?: UserPackageAPI | null;
  tutorPackageID?: number | null;
  // common
  status: string;
}

// Normalized UserPackage interface
export interface UserPackage {
  userPackageID: number;
  tutorPackage: {
    packageID: number;
    name: string;
    description: string;
    maxSlots: number;
    requirement: string;
    objectives: string;
    slotContent: SlotContent[];
  } | null;
  slotsRemaining: number;
  isActive: boolean;
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
  userPackageId: number | null;
  userPackage: UserPackage | null;
  tutorPackageID: number | null;
}

export interface BookingStats {
  upcoming: number;
  expired: number;
  cancelled: number;
  totalSlots: number;
  totalHours: number;
}

// Transform UserPackage from API
const transformUserPackage = (pkg: UserPackageAPI | null | undefined): UserPackage | null => {
  if (!pkg) return null;
  
  const tutorPkg = pkg.tutorPackage ?? pkg.tutor_package;
  
  return {
    userPackageID: pkg.userPackageID ?? pkg.user_package_id ?? 0,
    tutorPackage: tutorPkg ? {
      packageID: tutorPkg.packageID ?? tutorPkg.packageid ?? 0,
      name: tutorPkg.name ?? '',
      description: tutorPkg.description ?? '',
      maxSlots: tutorPkg.maxSlots ?? tutorPkg.max_slots ?? 0,
      requirement: tutorPkg.requirement ?? '',
      objectives: tutorPkg.objectives ?? '',
      slotContent: tutorPkg.slotContent ?? tutorPkg.slot_content ?? [],
    } : null,
    slotsRemaining: pkg.slotsRemaining ?? pkg.slots_remaining ?? 0,
    isActive: pkg.isActive ?? pkg.is_active ?? false,
  };
};

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
    userPackageId: slot.user_package_id ?? slot.userPackageId ?? null,
    userPackage: transformUserPackage(slot.userPackage ?? slot.user_package),
    tutorPackageID: slot.tutorPackageID ?? slot.tutor_package_id ?? null,
  };
};
