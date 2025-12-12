/**
 * Category interface matching API response structure
 * Based on requirements 5.2 - display category information
 */
export interface Category {
  categoryID: number;
  categoryName: string;
  description?: string;
  isActive: boolean;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

/**
 * API response wrapper for category list endpoint
 * Follows existing API response pattern (ApiRespond wrapper)
 * Requirements: 5.3 - parse ApiRespond wrapper
 */
export interface CategoriesResponse {
  code: number;
  message: string;
  result: Category[];
}

/**
 * API response wrapper for single category endpoint
 * Requirements: 7.1 - get category by ID
 */
export interface CategoryResponse {
  code: number;
  message: string;
  result: Category;
}

/**
 * Request body for creating a new category
 * Requirements: 6.2 - create category with request body
 */
export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

/**
 * Request body for updating an existing category
 * Requirements: 7.2 - update category
 */
export interface UpdateCategoryRequest {
  name: string;
  description?: string;
}

/**
 * API response wrapper for delete category endpoint
 */
export interface DeleteCategoryResponse {
  code: number;
  message: string;
  result?: any;
}

/**
 * Error codes returned by backend
 * Requirements: 6.2, 7.2, 8.2 - handle error codes
 */
export enum CategoryErrorCode {
  CATEGORY_ALREADY_EXISTS = 'CATEGORY_ALREADY_EXISTS',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  CATEGORY_IN_USE = 'CATEGORY_IN_USE',
}

/**
 * Component state interface for category management
 */
export interface CategoryManagementState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

/**
 * Component state interface for category form modal
 */
export interface CategoryFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  selectedCategory: Category | null;
  isSubmitting: boolean;
}

/**
 * Component state interface for delete confirmation modal
 */
export interface DeleteCategoryModalState {
  isOpen: boolean;
  selectedCategory: Category | null;
  isDeleting: boolean;
}
