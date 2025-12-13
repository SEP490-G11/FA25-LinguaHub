export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface WithdrawalHistoryItem {
  withdrawId: number;
  tutorId: number;
  totalAmount: number;
  withdrawAmount: number;
  commission: number;
  bankAccountNumber: string;
  bankName: string;
  bankOwnerName: string;
  status: WithdrawalStatus;
  createdAt: string;
}
