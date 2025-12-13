import axios from '@/config/axiosConfig';
import {
  Category,
  CategoriesResponse,
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DeleteCategoryResponse,
  CategoryErrorCode,
} from './types';

/**
 * Admin API for Category Management
 * Following the same pattern as UserManagement API
 */
export const categoryApi = {
  /**
   * Get all categories from the system
   * Endpoint: GET /admin/categories
   * Requirements: 5.1, 5.3 - retrieve all categories with proper error handling
   */
  getCategories: async (): Promise<Category[]> => {
    try {
      // Backend endpoint: GET /admin/categories
      const response = await axios.get<CategoriesResponse>('/admin/categories');
      
      // Check if response indicates success (code 0)
      if (response?.data?.code !== 0) {
        throw new Error(response?.data?.message || 'Không thể tải danh sách danh mục');
      }
      
      // Backend returns array in result field (Requirements: 5.3)
      const backendData = response?.data?.result || [];
      
      // Ensure it's an array
      if (!Array.isArray(backendData)) {
        throw new Error('Định dạng phản hồi không hợp lệ');
      }
      
      // Transform backend data to match Category interface
      const categories: Category[] = backendData.map((item: any) => ({
        categoryID: item.categoryId || item.categoryID || 0,
        categoryName: item.categoryName || '',
        description: item.description || '',
        isActive: true, // Backend doesn't return this field, default to true
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return categories;
    } catch (error: any) {
      // Requirements: 5.5 - handle API call failures
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Không thể tải danh sách danh mục'
      );
    }
  },

  /**
   * Get a specific category by ID
   * Endpoint: GET /admin/categories/{id}
   * Requirements: 7.1 - get category by ID for editing
   */
  getCategoryById: async (id: number): Promise<Category> => {
    try {
      // Backend endpoint: GET /admin/categories/{id}
      const response = await axios.get<CategoryResponse>(`/admin/categories/${id}`);
      
      // Check if response indicates success (code 0)
      if (response?.data?.code !== 0) {
        throw new Error(response?.data?.message || 'Không thể tải thông tin danh mục');
      }
      
      // Backend returns single object in result field
      const backendData = response?.data?.result;
      
      if (!backendData) {
        throw new Error('Danh mục không tồn tại');
      }
      
      // Transform backend data to match Category interface
      const category: Category = {
        categoryID: backendData.categoryId || backendData.categoryID || 0,
        categoryName: backendData.categoryName || '',
        description: backendData.description || '',
        isActive: true, // Backend doesn't return this field, default to true
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return category;
    } catch (error: any) {
      // Requirements: 7.4 - handle CATEGORY_NOT_FOUND error
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;
      
      if (errorCode === CategoryErrorCode.CATEGORY_NOT_FOUND) {
        throw new Error('Danh mục không tồn tại');
      }
      
      throw new Error(
        errorMessage || 
        error.message || 
        'Không thể tải thông tin danh mục'
      );
    }
  },

  /**
   * Create a new category
   * Endpoint: POST /admin/categories
   * Requirements: 6.2 - create category with request body
   */
  createCategory: async (data: CreateCategoryRequest): Promise<Category> => {
    try {
      // Transform frontend data to backend format
      const requestBody = {
        name: data.name,
        description: data.description || '',
      };
      
      // Backend endpoint: POST /admin/categories
      const response = await axios.post<CategoryResponse>('/admin/categories', requestBody);
      
      // Check if response indicates success (code 0)
      if (response?.data?.code !== 0) {
        throw new Error(response?.data?.message || 'Không thể tạo danh mục');
      }
      
      // Backend returns created category in result field
      const backendData = response?.data?.result;
      
      if (!backendData) {
        throw new Error('Không thể tạo danh mục');
      }
      
      // Transform backend data to match Category interface
      const category: Category = {
        categoryID: backendData.categoryId || backendData.categoryID || 0,
        categoryName: backendData.categoryName || '',
        description: backendData.description || '',
        isActive: true, // Default to active for new categories
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return category;
    } catch (error: any) {
      // Requirements: 6.4 - handle CATEGORY_ALREADY_EXISTS error
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;
      
      if (errorCode === CategoryErrorCode.CATEGORY_ALREADY_EXISTS || 
          errorMessage?.toLowerCase().includes('already exists') ||
          errorMessage?.toLowerCase().includes('đã tồn tại')) {
        throw new Error('Danh mục đã tồn tại');
      }
      
      throw new Error(
        errorMessage || 
        error.message || 
        'Không thể tạo danh mục'
      );
    }
  },

  /**
   * Update an existing category
   * Endpoint: PUT /admin/categories/{id}
   * Requirements: 7.2 - update category
   */
  updateCategory: async (id: number, data: UpdateCategoryRequest): Promise<Category> => {
    try {
      // Transform frontend data to backend format
      const requestBody = {
        name: data.name,
        description: data.description || '',
      };
      
      // Backend endpoint: PUT /admin/categories/{id}
      const response = await axios.put<CategoryResponse>(`/admin/categories/${id}`, requestBody);
      
      // Check if response indicates success (code 0)
      if (response?.data?.code !== 0) {
        throw new Error(response?.data?.message || 'Không thể cập nhật danh mục');
      }
      
      // Backend returns updated category in result field
      const backendData = response?.data?.result;
      
      if (!backendData) {
        throw new Error('Không thể cập nhật danh mục');
      }
      
      // Transform backend data to match Category interface
      const category: Category = {
        categoryID: backendData.categoryId || backendData.categoryID || 0,
        categoryName: backendData.categoryName || '',
        description: backendData.description || '',
        isActive: true, // Keep as active
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return category;
    } catch (error: any) {
      // Requirements: 7.4, 7.5 - handle CATEGORY_NOT_FOUND and CATEGORY_ALREADY_EXISTS errors
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;
      
      if (errorCode === CategoryErrorCode.CATEGORY_NOT_FOUND) {
        throw new Error('Danh mục không tồn tại');
      }
      
      if (errorCode === CategoryErrorCode.CATEGORY_ALREADY_EXISTS ||
          errorMessage?.toLowerCase().includes('already exists') ||
          errorMessage?.toLowerCase().includes('đã tồn tại')) {
        throw new Error('Tên danh mục đã tồn tại');
      }
      
      throw new Error(
        errorMessage || 
        error.message || 
        'Không thể cập nhật danh mục'
      );
    }
  },

  /**
   * Delete a specific category by ID
   * Endpoint: DELETE /admin/categories/{id}
   * Requirements: 8.2 - delete category with proper error handling
   */
  deleteCategory: async (id: number): Promise<void> => {
    try {
      // Backend endpoint: DELETE /admin/categories/{id}
      const response = await axios.delete<DeleteCategoryResponse>(`/admin/categories/${id}`);
      
      // Handle 204 No Content response (successful deletion with no body)
      if (response.status === 204) {
        return;
      }
      
      // Handle 200 OK response (successful deletion with body)
      if (response.status === 200) {
        // Check if response indicates success (code 0)
        if (response?.data?.code === 0 || !response?.data?.code) {
          return; // Success
        }
        // Only throw if code explicitly indicates failure
        if (response?.data?.code !== 0) {
          throw new Error(response?.data?.message || 'Không thể xóa danh mục');
        }
      }
    } catch (error: any) {
      // Don't throw error for successful status codes
      if (error.response?.status === 200 || error.response?.status === 204) {
        return;
      }
      
      // Requirements: 8.5 - handle CATEGORY_IN_USE error
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;
      
      if (errorCode === CategoryErrorCode.CATEGORY_IN_USE) {
        throw new Error('Không thể xóa danh mục vì đang có khóa học sử dụng');
      }
      
      throw new Error(
        errorMessage || 
        error.message || 
        'Không thể xóa danh mục'
      );
    }
  },
};

export default categoryApi;
