export type NotificationType = 
  | "TUTOR_CANCEL_BOOKING"
  | "LEARNER_CANCEL_BOOKING"
  | "BOOKING_CONFIRMED"
  | "LESSON_REMINDER"
  | "NEW_MESSAGE"
  | "COURSE_COMPLETED"
  | "REFUND_APPROVED"
  | "SYSTEM_MAINTENANCE"
  | "NEW_COURSE";

export interface Notification {
  notificationId: number;
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  primaryActionUrl: string | null;
  secondaryActionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}
