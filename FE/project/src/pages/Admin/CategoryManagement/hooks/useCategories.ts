import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types';
import { categoryApi } from '../api';

/**
 * Return type for useCategories hook
 * Requirements: 5.1, 6.1, 7.1, 8.1 - provide state and CRUD operations
 */
export interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createCategory: (data: CreateCategoryRequest) => Promise<void>;
  updateCategory: (id: number, data: UpdateCategoryRequest) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}

/**
 * Custom hook for managing category data and operations
 * Requirements: 5.1, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2 - manage categories state and CRUD operations
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetch categories from API
   * Requirements: 5.1 - fetch categories on mount
   * Handles loading states and error recovery
   */
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedCategories = await categoryApi.getCategories();
      
      setCategories(fetchedCategories);
    } catch (err: any) {
      const errorMessage = err.message || 'Không thể tải danh sách danh mục';
      setError(errorMessage);
      
      // Requirements: 5.5 - show error toast when API call fails
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
   * Refresh function to reload category data
   * Requirements: 5.1 - provide refresh functionality
   */
  const refresh = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  /**
   * Create a new category
   * Requirements: 6.1, 6.2 - create category and handle errors
   */
  const createCategory = useCallback(async (data: CreateCategoryRequest) => {
    try {
      // Call API to create category
      const newCategory = await categoryApi.createCategory(data);
      
      // Requirements: 6.3 - add category to state immediately (optimistic update)
      setCategories(prevCategories => [...prevCategories, newCategory]);
      
      // Show success toast
      toast({
        title: "Thành công",
        description: "Tạo danh mục thành công",
        variant: "default",
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Không thể tạo danh mục';
      
      // Requirements: 6.2 - handle API errors
      // Error is thrown to be handled by the form component for field-level validation
      throw new Error(errorMessage);
    }
  }, [toast]);

  /**
   * Update an existing category
   * Requirements: 7.1, 7.2 - update category and handle errors
   */
  const updateCategory = useCallback(async (id: number, data: UpdateCategoryRequest) => {
    try {
      // Call API to update category
      const updatedCategory = await categoryApi.updateCategory(id, data);
      
      // Requirements: 7.3 - update category in state immediately
      setCategories(prevCategories =>
        prevCategories.map(cat =>
          cat.categoryID === id ? updatedCategory : cat
        )
      );
      
      // Show success toast
      toast({
        title: "Thành công",
        description: "Cập nhật danh mục thành công",
        variant: "default",
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Không thể cập nhật danh mục';
      
      // Requirements: 7.2 - handle API errors
      // Error is thrown to be handled by the form component
      throw new Error(errorMessage);
    }
  }, [toast]);

  /**
   * Delete a category
   * Requirements: 8.1, 8.2 - delete category and handle errors
   */
  const deleteCategory = useCallback(async (id: number) => {
    try {
      // Call API to delete category
      await categoryApi.deleteCategory(id);
      
      // Requirements: 8.3 - remove category from state immediately
      setCategories(prevCategories =>
        prevCategories.filter(cat => cat.categoryID !== id)
      );
      
      // Show success toast
      toast({
        title: "Thành công",
        description: "Xóa danh mục thành công",
        variant: "default",
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Không thể xóa danh mục';
      
      // Requirements: 8.2 - handle API errors (e.g., CATEGORY_IN_USE)
      // Show error toast
      toast({
        title: "Lỗi xóa danh mục",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Re-throw error so the component can handle it if needed
      throw new Error(errorMessage);
    }
  }, [toast]);

  // Requirements: 5.1 - fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refresh,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

export default useCategories;
