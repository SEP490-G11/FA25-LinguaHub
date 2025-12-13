import axios from '@/config/axiosConfig';
import { Application } from './types';

/**
 * Helper function to transform backend data to Application interface
 */
const transformApplicationData = (item: any): Application => ({
  id: item.verificationId?.toString() || '',
  verificationId: item.verificationId,
  tutorId: item.tutorId,
  userId: item.userId,
  applicantName: item.userName || '',
  applicantEmail: item.userEmail || '',
  avatarURL: item.avatarURL || '',
  country: item.country || '',
  userPhone: item.userPhone || '',
  teachingLanguages: item.teachingLanguage 
    ? item.teachingLanguage.split(',').map((l: string) => l.trim())
    : [],
  specialization: item.specialization || '',
  pricePerHour: item.pricePerHour || 0,
  experience: item.experience || 0,
  bio: item.bio || '',
  certificateName: '',
  certificateUrl: '',
  status: (item.status?.toLowerCase() || 'pending') as 'pending' | 'approved' | 'rejected',
  appliedDate: item.submittedAt || new Date().toISOString(),
  reviewedBy: item.reviewedBy || '',
  reviewedAt: item.reviewedAt || '',
  reasonForReject: item.reasonForReject || '',
});

/**
 * Helper function to apply filters and pagination
 */
const applyFiltersAndPagination = (
  applications: Application[],
  page: number,
  limit: number,
  filters?: { search?: string; status?: string }
) => {
  let filtered = [...applications];

  // Apply search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (app) =>
        app.applicantName.toLowerCase().includes(searchLower) ||
        app.applicantEmail.toLowerCase().includes(searchLower) ||
        app.specialization.toLowerCase().includes(searchLower)
    );
  }

  // Apply status filter
  if (filters?.status && filters.status !== '') {
    filtered = filtered.filter((app) => app.status === filters.status);
  }

  // Calculate pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedApplications = filtered.slice(startIndex, startIndex + limit);

  return {
    data: paginatedApplications,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Admin API for Tutor Application Management
 */
export const tutorApprovalApi = {
  /**
   * Get all tutor applications (all statuses)
   * Endpoint: GET /admin/tutors/applications
   */
  getAllApplications: async (
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      status?: string;
    }
  ): Promise<{
    data: Application[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    try {
      const response = await axios.get('/admin/tutors/applications');
      let backendData = response?.data?.result || response?.data || [];
      
      if (!Array.isArray(backendData)) {
        backendData = [];
      }
      
      const applications = backendData.map(transformApplicationData);
      return applyFiltersAndPagination(applications, page, limit, filters);
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch tutor applications'
      );
    }
  },

  /**
   * Get single application by ID with full details
   * Endpoint: GET /admin/tutors/applications/:verificationId
   */
  getApplicationById: async (applicationId: string): Promise<Application> => {
    try {
      const response = await axios.get(`/admin/tutors/applications/${applicationId}`);
      const item = response?.data?.result || response?.data;

      // Extract first certificate for backward compatibility
      const firstCertificate = item.certificates?.[0];

      return {
        // Core fields
        id: item.verificationId?.toString() || applicationId,
        verificationId: item.verificationId,
        tutorId: item.tutorId,
        userId: item.userId,
        
        // User info
        applicantName: item.userName || '',
        applicantEmail: item.userEmail || '',
        userPhone: item.userPhone || '',
        
        // Teaching info
        teachingLanguages: item.teachingLanguage 
          ? item.teachingLanguage.split(',').map((l: string) => l.trim())
          : [],
        specialization: item.specialization || '',
        experience: item.experience || 0,
        bio: item.bio || '',
        
        // Certificates
        certificates: item.certificates || [],
        certificateName: firstCertificate?.certificateName || '',
        certificateUrl: firstCertificate?.documentUrl || '',
        
        // Status info
        status: (item.status?.toLowerCase() || 'pending') as 'pending' | 'approved' | 'rejected',
        appliedDate: item.submittedAt || new Date().toISOString(),
        reviewedBy: item.reviewedBy || '',
        reviewedAt: item.reviewedAt || '',
        reasonForReject: item.reasonForReject || '',
      };
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch application details'
      );
    }
  },

  /**
   * Approve tutor application
   * Endpoint: POST /admin/tutors/applications/:verificationId/approve
   */
  approveApplication: async (
    applicationId: string,
    _adminNotes?: string // Prefix with _ to indicate intentionally unused
  ): Promise<{
    success: boolean;
    message: string;
    data: Application;
  }> => {
    try {
      // Backend doesn't require body for approve
      const response = await axios.post(
        `/admin/tutors/applications/${applicationId}/approve`
      );

      return {
        success: true,
        message: 'Application approved successfully',
        data: response?.data?.result || response?.data,
      };
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to approve application'
      );
    }
  },

  /**
   * Reject tutor application
   * Endpoint: POST /admin/tutors/applications/:verificationId/reject
   */
  rejectApplication: async (
    applicationId: string,
    rejectionReason: string
  ): Promise<{
    success: boolean;
    message: string;
    data: Application;
  }> => {
    try {
      // Backend expects: { reason: string }
      const response = await axios.post(
        `/admin/tutors/applications/${applicationId}/reject`,
        { reason: rejectionReason }
      );

      return {
        success: true,
        message: 'Application rejected successfully',
        data: response?.data?.result || response?.data,
      };
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to reject application'
      );
    }
  },
};

export default tutorApprovalApi;
