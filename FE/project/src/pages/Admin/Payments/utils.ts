import { Payment, PaymentStats, PaymentStatus } from './types';

/**
 * Format amount to Vietnamese Dong currency with thousand separators
 * @param amount - The numeric amount to format
 * @returns Formatted currency string (e.g., "500.000 ₫")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format date string to Vietnamese date/time format
 * @param dateString - ISO date string to format
 * @returns Formatted date string (DD/MM/YYYY HH:mm)
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get Tailwind CSS classes for payment status badge color
 * @param status - Payment status
 * @returns CSS class string for background and text color
 */
export const getStatusColor = (status: PaymentStatus): string => {
  const colors: Record<PaymentStatus, string> = {
    PAID: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    REFUNDED: 'bg-blue-100 text-blue-800',
    FAILED: 'bg-red-100 text-red-800',
  };
  return colors[status];
};

/**
 * Calculate payment statistics from an array of payments
 * @param payments - Array of payment records
 * @returns PaymentStats object with calculated metrics
 */
export const calculateStats = (payments: Payment[]): PaymentStats => {
  return {
    totalPayments: payments.length,
    totalAmount: payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0),
    paidCount: payments.filter(p => p.status === 'PAID').length,
    pendingCount: payments.filter(p => p.status === 'PENDING').length,
    refundedCount: payments.filter(p => p.status === 'REFUNDED').length,
    failedCount: payments.filter(p => p.status === 'FAILED').length,
  };
};
