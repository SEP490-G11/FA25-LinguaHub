import axios from '@/config/axiosConfig';
import {
  TeachingLanguage,
  CreateLanguageRequest,
  UpdateLanguageRequest,
  LanguageResponse,
  LanguagesResponse,
  LanguageErrorCode,
} from './types';

/**
 * Admin API for Language Management
 * Following the same pattern as CategoryManagement API
 */
export const languageApi = {
  /**
   * Get all teaching languages from the system
   * Endpoint: GET /admin/languages
   * Requirements: 1.1, 1.3 - retrieve all languages with proper error handling
   */
  getLanguages: async (): Promise<TeachingLanguage[]> => {
    try {
      // Backend endpoint: GET /admin/languages
      const response = await axios.get<LanguagesResponse>('/admin/languages');
      
      // Check if response indicates success (code 0)
      if (response?.data?.code !== 0) {
        throw new Error(response?.data?.message || 'Failed to fetch languages');
      }
      
      // Backend returns array in result field (Requirements: 1.3)
      const backendData = response?.data?.result || [];
      
      // Ensure it's an array
      if (!Array.isArray(backendData)) {
        throw new Error('Invalid response format: expected array of languages');
      }
      
      // Transform backend data to match TeachingLanguage interface
      const languages: TeachingLanguage[] = backendData.map((item: any) => ({
        id: item.id || 0,
        nameVi: item.nameVi || '',
        nameEn: item.nameEn || '',
        isActive: Boolean(item.isActive),
        difficulty: item.difficulty || '',
        certificates: item.certificates || '',
        thumbnailUrl: item.thumbnailUrl || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      return languages;
    } catch (error: any) {
      // Requirements: 1.5 - handle API call failures
      throw new Error(
        error?.response?.data?.message || 
        error.message || 
        'Failed to fetch languages'
      );
    }
  },

  /**
   * Get a specific teaching language by ID
   * Endpoint: GET /admin/languages/{id}
   * Requirements: 3.1 - get language by ID for editing
   */
  getLanguageById: async (id: number): Promise<TeachingLanguage> => {
    try {
      // Backend endpoint: GET /admin/languages/{id}
      const response = await axios.get<LanguageResponse>(`/admin/languages/${id}`);
      
      // Check if response indicates success (code 0)
      if (response?.data?.code !== 0) {
        throw new Error(response?.data?.message || 'Failed to fetch language');
      }
      
      // Backend returns single object in result field
      const backendData = response?.data?.result;
      
      if (!backendData) {
        throw new Error('Language not found');
      }
      
      // Transform backend data to match TeachingLanguage interface
      const language: TeachingLanguage = {
        id: backendData.id || 0,
        nameVi: backendData.nameVi || '',
        nameEn: backendData.nameEn || '',
        isActive: Boolean(backendData.isActive),
        difficulty: backendData.difficulty || '',
        certificates: backendData.certificates || '',
        thumbnailUrl: backendData.thumbnailUrl || '',
        createdAt: backendData.createdAt,
        updatedAt: backendData.updatedAt,
      };

      return language;
    } catch (error: any) {
      // Requirements: 2.2, 3.2, 4.2 - handle LANGUAGE_NOT_FOUND error
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;
      
      if (errorCode === LanguageErrorCode.LANGUAGE_NOT_FOUND) {
        throw new Error('Language không tồn tại');
      }
      
      throw new Error(
        errorMessage || 
        error.message || 
        'Failed to fetch language'
      );
    }
  },

  /**
   * Create a new teaching language
   * Endpoint: POST /admin/languages
   * Requirements: 2.2 - create language with request body
   */
  createLanguage: async (data: CreateLanguageRequest): Promise<TeachingLanguage> => {
    try {
      // Backend endpoint: POST /admin/languages
      const response = await axios.post<LanguageResponse>('/admin/languages', data);
      
      // Check if response indicates success (code 0)
      if (response?.data?.code !== 0) {
        throw new Error(response?.data?.message || 'Failed to create language');
      }
      
      // Backend returns created language in result field
      const backendData = response?.data?.result;
      
      if (!backendData) {
        throw new Error('Failed to create language');
      }
      
      // Transform backend data to match TeachingLanguage interface
      const language: TeachingLanguage = {
        id: backendData.id || 0,
        nameVi: backendData.nameVi || '',
        nameEn: backendData.nameEn || '',
        isActive: Boolean(backendData.isActive),
        difficulty: backendData.difficulty || '',
        certificates: backendData.certificates || '',
        thumbnailUrl: backendData.thumbnailUrl || '',
        createdAt: backendData.createdAt,
        updatedAt: backendData.updatedAt,
      };

      return language;
    } catch (error: any) {
      // Requirements: 2.4 - handle LANGUAGE_ALREADY_EXISTS error
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;
      
      if (errorCode === LanguageErrorCode.LANGUAGE_ALREADY_EXISTS) {
        throw new Error('Language (name_en) đã tồn tại, vui lòng chọn tên khác');
      }
      
      throw new Error(
        errorMessage || 
        error.message || 
        'Failed to create language'
      );
    }
  },

  /**
   * Update an existing teaching language
   * Endpoint: PUT /admin/languages/{id}
   * Requirements: 3.2 - update language
   */
  updateLanguage: async (id: number, data: UpdateLanguageRequest): Promise<TeachingLanguage> => {
    try {
      // Backend endpoint: PUT /admin/languages/{id}
      const response = await axios.put<LanguageResponse>(`/admin/languages/${id}`, data);
      
      // Check if response indicates success (code 0)
      if (response?.data?.code !== 0) {
        throw new Error(response?.data?.message || 'Failed to update language');
      }
      
      // Backend returns updated language in result field
      const backendData = response?.data?.result;
      
      if (!backendData) {
        throw new Error('Failed to update language');
      }
      
      // Transform backend data to match TeachingLanguage interface
      const language: TeachingLanguage = {
        id: backendData.id || 0,
        nameVi: backendData.nameVi || '',
        nameEn: backendData.nameEn || '',
        isActive: Boolean(backendData.isActive),
        difficulty: backendData.difficulty || '',
        certificates: backendData.certificates || '',
        thumbnailUrl: backendData.thumbnailUrl || '',
        createdAt: backendData.createdAt,
        updatedAt: backendData.updatedAt,
      };

      return language;
    } catch (error: any) {
      // Requirements: 3.2, 3.4 - handle LANGUAGE_NOT_FOUND and LANGUAGE_NAME_EN_IN_USE errors
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;
      
      if (errorCode === LanguageErrorCode.LANGUAGE_NOT_FOUND) {
        throw new Error('Language không tồn tại');
      }
      
      if (errorCode === LanguageErrorCode.LANGUAGE_NAME_EN_IN_USE) {
        throw new Error('Không thể đổi Name (EN) vì đã có khóa học đang sử dụng. Bạn chỉ có thể chỉnh sửa các thông tin khác');
      }
      
      if (errorCode === LanguageErrorCode.LANGUAGE_ALREADY_EXISTS) {
        throw new Error('Language (name_en) đã tồn tại, vui lòng chọn tên khác');
      }
      
      throw new Error(
        errorMessage || 
        error.message || 
        'Failed to update language'
      );
    }
  },

  /**
   * Delete a specific teaching language by ID
   * Endpoint: DELETE /admin/languages/{id}
   * Requirements: 4.2 - delete language with proper error handling
   */
  deleteLanguage: async (id: number): Promise<void> => {
    try {
      // Backend endpoint: DELETE /admin/languages/{id}
      const response = await axios.delete<{ code: number; message: string }>(`/admin/languages/${id}`);
      
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
          throw new Error(response?.data?.message || 'Failed to delete language');
        }
      }
    } catch (error: any) {
      // Don't throw error for successful status codes
      if (error.response?.status === 200 || error.response?.status === 204) {
        return;
      }
      
      // Requirements: 4.4 - handle LANGUAGE_IN_USE error
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;
      
      if (errorCode === LanguageErrorCode.LANGUAGE_IN_USE) {
        throw new Error('Không thể xóa vì đang có khóa học sử dụng language này');
      }
      
      throw new Error(
        errorMessage || 
        error.message || 
        'Failed to delete language'
      );
    }
  },
};

export default languageApi;
