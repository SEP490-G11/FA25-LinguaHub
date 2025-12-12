import axios, { AxiosError } from 'axios';
import axiosInstance from '@/config/axiosConfig';
import { AdminDashboardResponse, DashboardParams } from './types';

/**
 * Enhanced error class for dashboard API errors
 */
class DashboardApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DashboardApiError';
  }
}

/**
 * Formats error messages based on error type
 */
const formatErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;

    // Network errors
    if (!axiosError.response) {
      return 'Network error: Unable to connect to the server. Please check your internet connection.';
    }

    // HTTP status code errors
    switch (status) {
      case 401:
        return '401: Authentication required. Your session has expired.';
      case 403:
        return '403: Access denied. You do not have permission to access this resource.';
      case 404:
        return '404: Dashboard endpoint not found. Please contact support.';
      case 500:
        return '500: Internal server error. Please try again later.';
      case 502:
        return '502: Bad gateway. The server is temporarily unavailable.';
      case 503:
        return '503: Service unavailable. The server is under maintenance.';
      case 504:
        return '504: Gateway timeout. The server took too long to respond.';
      default:
        return `Server error (${status}): ${axiosError.message}`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred while loading the dashboard.';
};

/**
 * Admin Dashboard API Service
 * Handles all API calls related to the admin dashboard with enhanced error handling
 * 
 * Task 15.3: Enhanced error handling for network, authentication, authorization, and server errors
 */
export const adminDashboardApi = {
  /**
   * Fetches comprehensive dashboard data for administrators
   * @param params - Optional date range parameters (startDate, endDate in YYYY-MM-DD format)
   * @returns Promise<AdminDashboardResponse> - Complete dashboard data
   * @throws DashboardApiError with detailed error information
   * 
   * Requirements: 1.1, 1.2, 1.4
   * - Retrieves data from GET /admin/dashboard
   * - Filters financial and growth metrics by date range when provided
   * - Extracts data from the result field of the response wrapper
   * 
   * Error Handling (Task 15.3):
   * - Network errors: Connection failures, timeouts
   * - Authentication errors (401): Session expired
   * - Authorization errors (403): Insufficient permissions
   * - Server errors (5xx): Backend failures
   * - Provides retry functionality through error propagation
   */
  getDashboardData: async (params?: DashboardParams): Promise<AdminDashboardResponse> => {
    try {
      const response = await axiosInstance.get('/admin/dashboard', { params });
      
      // Extract data from response wrapper (Requirement 1.4)
      if (!response.data || !response.data.result) {
        throw new DashboardApiError(
          'Invalid response format: Missing result field',
          response.status
        );
      }

      return response.data.result;
    } catch (error) {
      // Log error for debugging
      console.error('Error fetching admin dashboard data:', error);

      // Format and throw enhanced error
      const errorMessage = formatErrorMessage(error);
      const statusCode = axios.isAxiosError(error) 
        ? error.response?.status 
        : undefined;

      throw new DashboardApiError(errorMessage, statusCode, error);
    }
  },
};

export { DashboardApiError };
