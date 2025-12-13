// Request structure matching backend API
export interface WithdrawalRequestPayload {
  withdrawAmount: number;
  bankAccountNumber: string;
  bankName: string;
  bankOwnerName: string;
}

// Response structure from backend API
export interface WithdrawalResponse {
  withdrawId: number;
  tutorId: number;
  totalAmount: number;
  withdrawAmount: number;
  commission: number;
  bankAccountNumber: string;
  bankName: string;
  bankOwnerName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}

// Form data structure (internal use)
export interface WithdrawalFormData {
  bankName: string;
  bankAccountNumber: string;
  bankOwnerName: string;
  withdrawAmount: number;
}

// API error response
export interface ApiErrorResponse {
  code: number;
  message: string;
}
