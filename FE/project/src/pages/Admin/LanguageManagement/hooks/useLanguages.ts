import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { TeachingLanguage, CreateLanguageRequest, UpdateLanguageRequest } from '../types';
import { languageApi } from '../api';

/**
 * Return type for useLanguages hook
 * Requirements: 1.1, 2.1, 3.1, 4.1 - provide state and CRUD operations
 */
export interface UseLanguagesReturn {
  languages: TeachingLanguage[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createLanguage: (data: CreateLanguageRequest) => Promise<void>;
  updateLanguage: (id: number, data: UpdateLanguageRequest, originalNameEn?: string) => Promise<void>;
  deleteLanguage: (id: number) => Promise<void>;
}

/**
 * Custom hook for managing teaching language data and operations
 * Requirements: 1.1, 2.1, 2.2, 3.1, 3.2, 3.5, 4.1, 4.2 - manage languages state and CRUD operations
 */
export function useLanguages(): UseLanguagesReturn {
  const [languages, setLanguages] = useState<TeachingLanguage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetch languages from API
   * Requirements: 1.1 - fetch languages on mount
   * Handles loading states and error recovery
   */
  const fetchLanguages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedLanguages = await languageApi.getLanguages();
      
      setLanguages(fetchedLanguages);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load languages';
      setError(errorMessage);
      
      // Requirements: 1.5 - show error toast when API call fails
      toast({
        title: "Lỗi tải danh sách",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Refresh function to reload language data
   * Requirements: 1.1 - provide refresh functionality
   */
  const refresh = useCallback(async () => {
    await fetchLanguages();
  }, [fetchLanguages]);

  /**
   * Create a new teaching language
   * Requirements: 2.1, 2.2 - create language and handle errors
   */
  const createLanguage = useCallback(async (data: CreateLanguageRequest) => {
    try {
      // Call API to create language
      const newLanguage = await languageApi.createLanguage(data);
      
      // Requirements: 2.3 - add language to state immediately (optimistic update)
      setLanguages(prevLanguages => [...prevLanguages, newLanguage]);
      
      // Show success toast
      toast({
        title: "Thành công",
        description: "Tạo language thành công",
        variant: "default",
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create language';
      
      // Requirements: 2.2 - handle API errors (e.g., LANGUAGE_ALREADY_EXISTS)
      // Error is thrown to be handled by the form component for field-level validation
      throw new Error(errorMessage);
    }
  }, [toast]);

  /**
   * Update an existing teaching language
   * Requirements: 3.1, 3.2, 3.5 - update language and handle LANGUAGE_NAME_EN_IN_USE error
   * 
   * @param id - Language ID to update
   * @param data - Updated language data
   * @param originalNameEn - Original nameEn value (for LANGUAGE_NAME_EN_IN_USE handling)
   */
  const updateLanguage = useCallback(async (
    id: number, 
    data: UpdateLanguageRequest,
    _originalNameEn?: string
  ) => {
    try {
      // Call API to update language
      const updatedLanguage = await languageApi.updateLanguage(id, data);
      
      // Requirements: 3.3 - update language in state immediately
      setLanguages(prevLanguages =>
        prevLanguages.map(lang =>
          lang.id === id ? updatedLanguage : lang
        )
      );
      
      // Show success toast
      toast({
        title: "Thành công",
        description: "Cập nhật language thành công",
        variant: "default",
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update language';
      
      // Requirements: 3.2, 3.5 - handle API errors
      // Special handling for LANGUAGE_NAME_EN_IN_USE is done in the form component
      // The form component will reset nameEn to originalNameEn and keep form open
      
      // Error is thrown to be handled by the form component
      throw new Error(errorMessage);
    }
  }, [toast]);

  /**
   * Delete a teaching language
   * Requirements: 4.1, 4.2 - delete language and handle errors
   */
  const deleteLanguage = useCallback(async (id: number) => {
    try {
      // Call API to delete language
      await languageApi.deleteLanguage(id);
      
      // Requirements: 4.3 - remove language from state immediately
      setLanguages(prevLanguages =>
        prevLanguages.filter(lang => lang.id !== id)
      );
      
      // Show success toast
      toast({
        title: "Thành công",
        description: "Xóa language thành công",
        variant: "default",
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete language';
      
      // Requirements: 4.2 - handle API errors (e.g., LANGUAGE_IN_USE)
      // Show error toast
      toast({
        title: "Lỗi xóa language",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Re-throw error so the component can handle it if needed
      throw new Error(errorMessage);
    }
  }, [toast]);

  // Requirements: 1.1 - fetch languages on mount
  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  return {
    languages,
    loading,
    error,
    refresh,
    createLanguage,
    updateLanguage,
    deleteLanguage,
  };
}

export default useLanguages;
