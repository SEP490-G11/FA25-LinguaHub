import { useState } from 'react';
import { Tags, Loader2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardPageHeading } from '@/components/shared';
import { CategoryTable } from './components/CategoryTable';
import { CategoryForm, CategoryFormData } from './components/CategoryForm';
import { CategoryDeleteModal } from './components/CategoryDeleteModal';
import { useCategories } from './hooks/useCategories';
import { Category } from './types';

/**
 * CategoryManagement main page component
 * Requirements: 5.1, 5.4, 5.5, 6.1, 6.3, 7.1, 7.3, 8.1, 8.3, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5
 * 
 * This component provides a complete CRUD interface for managing categories:
 * - List all categories with search and sort functionality
 * - Create new categories
 * - Edit existing categories
 * - Delete categories (with business rule validation)
 * - Consistent UI/UX with other admin pages
 */
export default function CategoryManagement() {
  const { categories, loading, error, refresh, createCategory, updateCategory, deleteCategory } = useCategories();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    category: Category | null;
  }>({
    isOpen: false,
    mode: 'create',
    category: null,
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({
    isOpen: false,
    category: null,
  });

  /**
   * Handle refresh with loading state
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Handle create category button click
   * Requirements: 6.1 - show form when clicking "Thêm Category"
   */
  const handleCreateClick = () => {
    setFormModal({
      isOpen: true,
      mode: 'create',
      category: null,
    });
  };

  /**
   * Handle edit category button click
   * Requirements: 7.1 - show form with loaded data when clicking "Edit"
   */
  const handleEditClick = (category: Category) => {
    setFormModal({
      isOpen: true,
      mode: 'edit',
      category,
    });
  };

  /**
   * Handle delete category button click
   * Requirements: 8.1 - show confirmation dialog when clicking "Delete"
   */
  const handleDeleteClick = (category: Category) => {
    setDeleteModal({
      isOpen: true,
      category,
    });
  };

  /**
   * Handle form submission (create or edit)
   * Requirements: 6.2, 6.3, 7.2, 7.3 - handle form submission with success/error handling
   */
  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      if (formModal.mode === 'create') {
        // Requirements: 6.2, 6.3 - create category and show success toast
        await createCategory(data);
        
        // Close modal on success
        setFormModal({
          isOpen: false,
          mode: 'create',
          category: null,
        });
      } else if (formModal.mode === 'edit' && formModal.category) {
        // Requirements: 7.2, 7.3 - update category and show success toast
        await updateCategory(formModal.category.categoryID, data);
        
        // Close modal on success
        setFormModal({
          isOpen: false,
          mode: 'edit',
          category: null,
        });
      }
    } catch (err: any) {
      // Error is already handled by the hook and form component
      // Re-throw to let form component handle field-level errors
      throw err;
    }
  };

  /**
   * Handle delete confirmation
   * Requirements: 8.2, 8.3, 8.5 - delete category with error handling
   */
  const handleDeleteConfirm = async () => {
    if (!deleteModal.category) return;

    try {
      // Requirements: 8.2, 8.3 - delete category and show success toast
      await deleteCategory(deleteModal.category.categoryID);
      
      // Close modal on success
      setDeleteModal({
        isOpen: false,
        category: null,
      });
    } catch (err: any) {
      // Requirements: 8.5 - error toast is already shown by the hook
      // Keep modal open to allow retry
    }
  };

  /**
   * Close form modal
   */
  const handleFormClose = () => {
    setFormModal({
      isOpen: false,
      mode: 'create',
      category: null,
    });
  };

  /**
   * Close delete modal
   */
  const handleDeleteClose = () => {
    setDeleteModal({
      isOpen: false,
      category: null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
      {/* ========== HEADER SECTION ========== */}
      {/* Requirements: 9.1 - StandardPageHeading with purple gradient and statistics */}
      <StandardPageHeading
        title="Quản lý danh mục"
        description="Quản lý và giám sát tất cả danh mục khóa học trong hệ thống"
        icon={Tags}
        gradientFrom="from-purple-600"
        gradientVia="via-purple-600"
        gradientTo="to-purple-500"
        statistics={[
          {
            label: 'Tổng danh mục',
            value: categories.length,
            ariaLabel: `${categories.length} tổng danh mục`,
          },
        ]}
      />

      {/* ========== MAIN CONTENT ========== */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* ========== LOADING STATE ========== */}
        {loading ? (
          <div className="flex justify-center items-center py-16 sm:py-24">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-4">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-purple-600" aria-hidden="true" />
              </div>
              <p className="text-gray-700 font-semibold text-base sm:text-lg">Đang tải danh mục...</p>
              <p className="text-gray-500 text-sm mt-2">Vui lòng đợi trong khi chúng tôi tải dữ liệu danh mục</p>
            </div>
          </div>
        ) : error ? (
          /* ========== ERROR STATE ========== */
          /* Requirements: 5.5 - display error with message from backend */
          <div className="bg-white rounded-xl shadow-md border border-red-100 p-8 sm:p-16 text-center hover:shadow-lg transition-all">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-red-100 via-red-100 to-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-red-500" aria-hidden="true" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Lỗi tải danh mục</h3>
            <p className="text-gray-600 text-base sm:text-lg mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label={isRefreshing ? 'Đang thử lại tải danh mục' : 'Thử lại tải danh mục'}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Đang thử lại...
                </>
              ) : (
                'Thử lại'
              )}
            </button>
          </div>
        ) : (
          <>
            {/* ========== CATEGORY TABLE WITH ADD BUTTON ========== */}
            <div className="bg-white rounded-xl shadow-md border border-purple-100 hover:shadow-lg transition-all">
              {/* Table Header with Add Button */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Danh sách danh mục</h2>
                    <p className="text-gray-600 text-sm mt-1" aria-live="polite">
                      {isRefreshing ? 'Đang tải...' : `Hiển thị ${categories.length} danh mục`}
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    aria-label="Thêm danh mục mới"
                  >
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Thêm
                  </Button>
                </div>
              </div>

              {/* Table Content */}
              <CategoryTable
                categories={categories}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                isRefreshing={isRefreshing}
              />
            </div>
          </>
        )}
      </div>

      {/* ========== CATEGORY FORM MODAL ========== */}
      {/* Requirements: 6.1, 7.1, 9.2 - CategoryForm modal for create/edit */}
      <CategoryForm
        isOpen={formModal.isOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={formModal.category || undefined}
        mode={formModal.mode}
      />

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {/* Requirements: 8.1, 9.2 - Delete confirmation modal with consistent styling */}
      {deleteModal.category && (
        <CategoryDeleteModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          category={deleteModal.category}
        />
      )}
    </div>
  );
}
