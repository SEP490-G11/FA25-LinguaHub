/**
 * Type definitions for Admin Withdraw Requests Management
 */

export interface WithdrawRequest {
  withdrawId: number;
  tutorId: number;
  totalAmount: number;
  withdrawAmount: number;
  commission: number;
  bankAccountNumber: string;
  bankName: string;
  bankOwnerName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string; // ISO 8601 format
}

export interface WithdrawRequestStats {
  totalRequests: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalWithdrawAmount: number;
  totalCommission: number;
}

export interface WithdrawRequestFilters {
  status?: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';
  sortOrder?: 'newest' | 'oldest';
}

export interface ApiResponse {
  success: boolean;
  message: string;
}
