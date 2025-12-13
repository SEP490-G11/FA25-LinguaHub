// Payment status types
export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';

// Payment type categories
export type PaymentType = 'Course' | 'Booking' | 'Subscription';

// Payment method gateways
export type PaymentMethod = 'PAYOS' | 'MOMO' | 'VNPAY';

// Main payment record interface
export interface Payment {
  paymentID: number;
  userId: number;
  tutorId: number;
  targetId: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  isPaid: boolean;
  isRefund: boolean;
  orderCode: string;
  paymentLinkId: string;
  checkoutUrl: string;
  qrCodeUrl: string;
  createdAt: string;
  paidAt: string;
  description: string;
  expiresAt: string;
}

// Filter criteria for payment queries
export interface PaymentFilters {
  search?: string;
  type?: PaymentType;
  status?: PaymentStatus;
  method?: PaymentMethod;
}

// Paginated API response structure
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Payment statistics summary
export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
  refundedCount: number;
  failedCount: number;
}
