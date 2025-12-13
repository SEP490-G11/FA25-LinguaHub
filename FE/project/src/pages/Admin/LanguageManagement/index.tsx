import { useState } from 'react';
import { Languages, Loader2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardPageHeading } from '@/components/shared';
import { LanguageTable } from './components/LanguageTable';
import { LanguageForm, LanguageFormData } from './components/LanguageForm';
import { LanguageDeleteModal } from './components/LanguageDeleteModal';
import { useLanguages } from './hooks/useLanguages';
import { TeachingLanguage } from './types';

/**
 * LanguageManagement main page component
 * Requirements: 1.1, 1.4, 1.5, 2.1, 2.3, 3.1, 3.3, 4.1, 4.3, 4.5, 9.1, 9.2, 9.3, 9.4, 9.5
 * 
 * This component provides a complete CRUD interface for managing teaching languages:
 * - List all languages with search, status filter, and sort functionality
 * - Create new languages
 * - Edit existing languages (with special handling for nameEn when in use)
 * - Delete languages (with business rule validation)
 * - Consistent UI/UX with other admin pages
 */
export default function LanguageManagement() {
  const { languages, loading, error, refresh, createLanguage, updateLanguage, deleteLanguage } = useLanguages();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    language: TeachingLanguage | null;
  }>({
    isOpen: false,
    mode: 'create',
    language: null,
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    language: TeachingLanguage | null;
  }>({
    isOpen: false,
    language: null,
  });

  // Calculate statistics
  const activeLanguagesCount = languages.filter(lang => lang.isActive).length;

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
   * Handle create language button click
   * Requirements: 2.1 - show form when clicking "Thêm Language"
   */
  const handleCreateClick = () => {
    setFormModal({
      isOpen: true,
      mode: 'create',
      language: null,
    });
  };

  /**
   * Handle edit language button click
   * Requirements: 3.1 - show form with loaded data when clicking "Edit"
   */
  const handleEditClick = (language: TeachingLanguage) => {
    setFormModal({
      isOpen: true,
      mode: 'edit',
      language,
    });
  };

  /**
   * Handle delete language button click
   * Requirements: 4.1 - show confirmation dialog when clicking "Delete"
   */
  const handleDeleteClick = (language: TeachingLanguage) => {
    setDeleteModal({
      isOpen: true,
      language,
    });
  };

  /**
   * Handle form submission (create or edit)
   * Requirements: 2.2, 2.3, 3.2, 3.3 - handle form submission with success/error handling
   */
  const handleFormSubmit = async (data: LanguageFormData) => {
    try {
      if (formModal.mode === 'create') {
        // Requirements: 2.2, 2.3 - create language and show success toast
        await createLanguage(data);
        
        // Close modal on success
        setFormModal({
          isOpen: false,
          mode: 'create',
          language: null,
        });
      } else if (formModal.mode === 'edit' && formModal.language) {
        // Requirements: 3.2, 3.3 - update language and show success toast
        // Pass original nameEn for LANGUAGE_NAME_EN_IN_USE handling
        await updateLanguage(formModal.language.id, data, formModal.language.nameEn);
        
        // Close modal on success
        setFormModal({
          isOpen: false,
          mode: 'edit',
          language: null,
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
   * Requirements: 4.2, 4.3, 4.5 - delete language with error handling
   */
  const handleDeleteConfirm = async () => {
    if (!deleteModal.language) return;

    try {
      // Requirements: 4.2, 4.3 - delete language and show success toast
      await deleteLanguage(deleteModal.language.id);
      
      // Close modal on success
      setDeleteModal({
        isOpen: false,
        language: null,
      });
    } catch (err: any) {
      // Requirements: 4.5 - error toast is already shown by the hook
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
      language: null,
    });
  };

  /**
   * Close delete modal
   */
  const handleDeleteClose = () => {
    setDeleteModal({
      isOpen: false,
      language: null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
      {/* ========== HEADER SECTION ========== */}
      {/* Requirements: 1.1, 9.1 - StandardPageHeading with blue gradient and statistics */}
      <StandardPageHeading
        title="Quản lý ngôn ngữ"
        description="Quản lý và giám sát tất cả ngôn ngữ giảng dạy trong hệ thống"
        icon={Languages}
        gradientFrom="from-purple-600"
        gradientVia="via-purple-600"
        gradientTo="to-purple-500"
        statistics={[
          {
            label: 'Tổng ngôn ngữ',
            value: languages.length,
            ariaLabel: `${languages.length} tổng ngôn ngữ`,
          },
          {
            label: 'Ngôn ngữ hoạt động',
            value: activeLanguagesCount,
            ariaLabel: `${activeLanguagesCount} ngôn ngữ hoạt động`,
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
              <p className="text-gray-700 font-semibold text-base sm:text-lg">Đang tải ngôn ngữ...</p>
              <p className="text-gray-500 text-sm mt-2">Vui lòng đợi trong khi chúng tôi tải dữ liệu ngôn ngữ</p>
            </div>
          </div>
        ) : error ? (
          /* ========== ERROR STATE ========== */
          /* Requirements: 1.5 - display error with message from backend */
          <div className="bg-white rounded-xl shadow-md border border-red-100 p-8 sm:p-16 text-center hover:shadow-lg transition-all">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-red-100 via-red-100 to-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-red-500" aria-hidden="true" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Lỗi tải ngôn ngữ</h3>
            <p className="text-gray-600 text-base sm:text-lg mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label={isRefreshing ? 'Đang thử lại tải ngôn ngữ' : 'Thử lại tải ngôn ngữ'}
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
            {/* ========== LANGUAGE TABLE WITH ADD BUTTON ========== */}
            <div className="bg-white rounded-xl shadow-md border border-purple-100 hover:shadow-lg transition-all">
              {/* Table Header with Add Button */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Danh sách ngôn ngữ</h2>
                    <p className="text-gray-600 text-sm mt-1" aria-live="polite">
                      {isRefreshing ? 'Đang tải...' : `Hiển thị ${languages.length} ngôn ngữ`}
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    aria-label="Thêm ngôn ngữ mới"
                  >
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Thêm
                  </Button>
                </div>
              </div>

              {/* Table Content */}
              <LanguageTable
                languages={languages}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                isRefreshing={isRefreshing}
              />
            </div>
          </>
        )}
      </div>

      {/* ========== LANGUAGE FORM MODAL ========== */}
      {/* Requirements: 2.1, 3.1, 9.2 - LanguageForm modal for create/edit */}
      <LanguageForm
        isOpen={formModal.isOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={formModal.language || undefined}
        mode={formModal.mode}
      />

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {/* Requirements: 4.1, 9.2 - Delete confirmation modal with consistent styling */}
      {deleteModal.language && (
        <LanguageDeleteModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          language={deleteModal.language}
        />
      )}
    </div>
  );
}
