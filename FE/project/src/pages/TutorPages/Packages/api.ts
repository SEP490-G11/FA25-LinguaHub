import axios from '@/config/axiosConfig';
import { Package, PackageFormData, PackageResponse } from './types';

/**
 * Tutor API for Package Management
 * Provides CRUD operations for tutor packages
 */
export const tutorPackageApi = {
  /**
   * Get all packages for the authenticated tutor
   * GET /tutor/packages/me
   * @returns Array of package records
   */
  getMyPackages: async (): Promise<Package[]> => {
    try {
      const response = await axios.get('/tutor/package/me');
      
      // Extract data from response - handle multiple possible structures
      let packagesArray: any[] = [];
      
      if (Array.isArray(response?.data?.packages)) {
        packagesArray = response.data.packages;
      } else if (Array.isArray(response?.data?.result)) {
        packagesArray = response.data.result;
      } else if (Array.isArray(response?.data)) {
        packagesArray = response.data;
      }

      // Transform API response to match frontend types
      const packages: Package[] = packagesArray.map((pkg: any) => ({
        packageid: pkg.packageid,
        name: pkg.name,
        description: pkg.description,
        requirement: pkg.requirement || '',
        objectives: pkg.objectives || '',
        tutor_id: pkg.tutor_id,
        max_slots: pkg.max_slots || pkg.max_slot || 0,
        slot_content: pkg.slot_content || [],
        is_active: pkg.is_active,
        created_at: pkg.created_at,
        updated_at: pkg.updated_at,
      }));

      return packages;
    } catch (error: any) {
      console.error('❌ Error fetching tutor packages:', error);
      
      // Handle different error scenarios with Vietnamese messages
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;

        switch (status) {
          case 401:
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          case 403:
            throw new Error('Bạn không có quyền truy cập dữ liệu này.');
          case 404:
            throw new Error('Không tìm thấy dữ liệu package.');
          case 500:
            throw new Error('Lỗi server. Vui lòng thử lại sau.');
          default:
            throw new Error(message || 'Không thể tải danh sách package. Vui lòng thử lại.');
        }
      } else if (error.request) {
        // Network error
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        // Other errors
        throw new Error(error.message || 'Đã xảy ra lỗi không xác định.');
      }
    }
  },

  /**
   * Create a new package
   * POST /tutor/packages
   * @param data Package form data
   * @returns Package response with success status
   */
  createPackage: async (data: PackageFormData): Promise<PackageResponse> => {
    try {
      // Prepare request body with all required fields
      const requestBody = {
        name: data.name,
        description: data.description,
        requirement: data.requirement,
        objectives: data.objectives,
        max_slots: data.max_slots,
        slot_content: data.slot_content,
      };

      const response = await axios.post('/tutor/package', requestBody);

      return {
        success: true,
        message: response.data?.message || 'Package đã được tạo thành công.',
      };
    } catch (error: any) {
      console.error('❌ Error creating package:', error);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;

        switch (status) {
          case 400:
            throw new Error(message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
          case 401:
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          case 403:
            throw new Error('Bạn không có quyền tạo package.');
          case 500:
            throw new Error('Lỗi server. Vui lòng thử lại sau.');
          default:
            throw new Error(message || 'Không thể tạo package. Vui lòng thử lại.');
        }
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw new Error(error.message || 'Đã xảy ra lỗi không xác định.');
      }
    }
  },

  /**
   * Get package details by ID
   * GET /tutor/package/{packageId}
   * @param packageId Package ID
   * @returns Package details
   */
  getPackageById: async (packageId: number): Promise<Package> => {
    try {
      const response = await axios.get(`/tutor/package/${packageId}`);

      const pkg = response.data;
      
      return {
        packageid: pkg.packageid,
        name: pkg.name,
        description: pkg.description,
        requirement: pkg.requirement || '',
        objectives: pkg.objectives || '',
        tutor_id: pkg.tutor_id,
        max_slots: pkg.max_slots || pkg.max_slot || 0,
        slot_content: pkg.slot_content || [],
        min_booking_price_per_hour: pkg.min_booking_price_per_hour || 0,
        is_active: pkg.is_active,
        created_at: pkg.created_at,
        updated_at: pkg.updated_at,
      };
    } catch (error: any) {
      console.error('❌ Error fetching package details:', error);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;

        switch (status) {
          case 401:
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          case 403:
            throw new Error('Bạn không có quyền truy cập package này.');
          case 404:
            throw new Error('Không tìm thấy package.');
          case 500:
            throw new Error('Lỗi server. Vui lòng thử lại sau.');
          default:
            throw new Error(message || 'Không thể tải thông tin package. Vui lòng thử lại.');
        }
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw new Error(error.message || 'Đã xảy ra lỗi không xác định.');
      }
    }
  },

  /**
   * Update an existing package
   * PUT /tutor/package/{packageId}
   * @param packageId Package ID
   * @param data Package form data
   * @returns Package response with success status
   */
  updatePackage: async (packageId: number, data: PackageFormData): Promise<PackageResponse> => {
    try {
      // Prepare request body with all required fields
      const requestBody = {
        name: data.name,
        description: data.description,
        requirement: data.requirement,
        objectives: data.objectives,
        max_slots: data.max_slots,
        slot_content: data.slot_content,
      };

      const response = await axios.put(`/tutor/package/${packageId}`, requestBody);

      return {
        success: true,
        message: response.data?.message || 'Package đã được cập nhật thành công.',
      };
    } catch (error: any) {
      console.error('❌ Error updating package:', error);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;

        switch (status) {
          case 400:
            throw new Error(message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
          case 401:
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          case 403:
            throw new Error('Bạn không có quyền chỉnh sửa package này.');
          case 404:
            throw new Error('Không tìm thấy package.');
          case 500:
            throw new Error('Lỗi server. Vui lòng thử lại sau.');
          default:
            throw new Error(message || 'Không thể cập nhật package. Vui lòng thử lại.');
        }
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw new Error(error.message || 'Đã xảy ra lỗi không xác định.');
      }
    }
  },

  /**
   * Delete a package
   * DELETE /tutor/package/{packageId}
   * @param packageId Package ID
   * @returns Package response with success status
   */
  deletePackage: async (packageId: number): Promise<PackageResponse> => {
    try {
      const response = await axios.delete(`/tutor/package/${packageId}`);

      return {
        success: true,
        message: response.data?.message || 'Package đã được xóa thành công.',
      };
    } catch (error: any) {
      console.error('❌ Error deleting package:', error);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;

        switch (status) {
          case 401:
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          case 403:
            throw new Error('Bạn không có quyền xóa package này.');
          case 404:
            throw new Error('Không tìm thấy package.');
          case 409:
            throw new Error('Không thể xóa package đang được sử dụng.');
          case 500:
            throw new Error('Lỗi server. Vui lòng thử lại sau.');
          default:
            throw new Error(message || 'Không thể xóa package. Vui lòng thử lại.');
        }
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw new Error(error.message || 'Đã xảy ra lỗi không xác định.');
      }
    }
  },
};

export default tutorPackageApi;