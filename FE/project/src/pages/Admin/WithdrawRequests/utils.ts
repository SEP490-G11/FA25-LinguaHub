/**
 * Utility functions for Admin Withdraw Requests Management
 */

import { WithdrawRequest, WithdrawRequestStats } from './types';

/**
 * Calculate statistics from withdrawal requests array
 * @param requests - Array of withdrawal requests
 * @returns Statistics object with counts and totals
 */
export const calculateStats = (requests: WithdrawRequest[]): WithdrawRequestStats => {
  const stats: WithdrawRequestStats = {
    totalRequests: requests.length,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalWithdrawAmount: 0,
    totalCommission: 0,
  };

  requests.forEach((request) => {
    // Count by status
    if (request.status === 'PENDING') {
      stats.pendingCount++;
    } else if (request.status === 'APPROVED') {
      stats.approvedCount++;
    } else if (request.status === 'REJECTED') {
      stats.rejectedCount++;
    }

    // Sum amounts
    stats.totalWithdrawAmount += request.withdrawAmount;
    stats.totalCommission += request.commission;
  });

  return stats;
};

/**
 * Format currency values with appropriate symbols and decimal places
 * @param amount - Numeric amount to format
 * @returns Formatted currency string (e.g., "1.234.567 ₫")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format ISO 8601 timestamp to human-readable date format
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date string (e.g., "Jan 15, 2024, 3:30 PM")
 */
export const formatDate = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Get appropriate color for status badges
 * @param status - Withdrawal request status
 * @returns Color string for badge styling
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'warning'; // Yellow
    case 'APPROVED':
      return 'success'; // Green
    case 'REJECTED':
      return 'destructive'; // Red
    default:
      return 'default'; // Gray
  }
};

/**
 * Filter withdrawal requests by status
 * @param requests - Array of withdrawal requests
 * @param status - Status filter ('all' or specific status)
 * @returns Filtered array of withdrawal requests
 */
export const filterByStatus = (
  requests: WithdrawRequest[],
  status: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'
): WithdrawRequest[] => {
  if (status === 'all') {
    return requests;
  }
  
  return requests.filter((request) => request.status === status);
};

/**
 * Sort withdrawal requests by creation date
 * @param requests - Array of withdrawal requests
 * @param order - Sort order ('newest' or 'oldest')
 * @returns Sorted array of withdrawal requests
 */
export const sortByDate = (
  requests: WithdrawRequest[],
  order: 'newest' | 'oldest'
): WithdrawRequest[] => {
  // Create a copy to avoid mutating the original array
  const sortedRequests = [...requests];

  sortedRequests.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();

    if (order === 'newest') {
      return dateB - dateA; // Descending order (newest first)
    } else {
      return dateA - dateB; // Ascending order (oldest first)
    }
  });

  return sortedRequests;
};
