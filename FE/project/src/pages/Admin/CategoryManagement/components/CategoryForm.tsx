import React, { useEffect, useRef } from 'react';
import { Loader2, FolderPlus, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Category } from '../types';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  initialData?: Category;
  mode: 'create' | 'edit';
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

interface FormErrors {
  categoryName?: string;
  description?: string;
}

/**
 * CategoryForm component for creating and editing categories
 * Requirements: 6.1, 6.2, 6.4, 6.5, 7.1, 7.2, 7.4, 7.5, 9.2, 10.1, 10.2, 10.3, 10.4, 10.5
 */
export const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  // Form state
  const [formData, setFormData] = React.useState<CategoryFormData>({
    name: '',
    description: '',
  });

  // Validation and submission state
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [backendError, setBackendError] = React.useState<string | null>(null);

  // Refs for focus management (Requirement 10.4)
  const categoryNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          name: initialData.categoryName || '',
          description: initialData.description || '',
        });
      } else {
        // Reset form for create mode
        setFormData({
          name: '',
          description: '',
        });
      }
      // Clear errors when modal opens
      setErrors({});
      setBackendError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, mode, initialData]);

  /**
   * Client-side validation
   * Requirements: 10.1, 10.2 - validate required fields and format
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name (required, min 2, max 100)
    if (!formData.name || formData.name.trim() === '') {
      newErrors.categoryName = 'Trường này là bắt buộc';
    } else if (formData.name.trim().length < 2) {
      newErrors.categoryName = 'Tên category phải có ít nhất 2 ký tự';
    } else if (formData.name.trim().length > 100) {
      newErrors.categoryName = 'Tên category không được vượt quá 100 ký tự';
    }

    // Validate description (optional, max 500)
    if (formData.description && formData.description.trim().length > 500) {
      newErrors.description = 'Mô tả không được vượt quá 500 ký tự';
    }

    setErrors(newErrors);

    // Focus on first error field (Requirement 10.4)
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.categoryName && categoryNameRef.current) {
        categoryNameRef.current.focus();
      } else if (newErrors.description && descriptionRef.current) {
        descriptionRef.current.focus();
      }
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   * Requirements: 6.2, 7.2, 10.3, 10.5 - submit with loading state, prevent API call on validation error
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous backend error
    setBackendError(null);

    // Validate form (Requirement 10.5 - don't call API if validation fails)
    if (!validateForm()) {
      return;
    }

    // Set loading state (Requirement 10.3)
    setIsSubmitting(true);

    try {
      // Call parent's onSubmit handler
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
      });

      // Success - parent will handle toast and close modal
      // Reset form state
      setFormData({
        name: '',
        description: '',
      });
      setErrors({});
      setBackendError(null);
    } catch (error: any) {
      // Handle backend errors (Requirements: 6.4, 7.5)
      const errorMessage = error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      
      // Check if it's a CATEGORY_ALREADY_EXISTS error
      if (errorMessage.includes('đã tồn tại') || errorMessage.includes('CATEGORY_ALREADY_EXISTS')) {
        // Show as field error (Requirement 6.4)
        setErrors({
          categoryName: 'Category đã tồn tại',
        });
        // Focus on the field
        if (categoryNameRef.current) {
          categoryNameRef.current.focus();
        }
      } else {
        // Show as general backend error
        setBackendError(errorMessage);
      }

      // Keep form open with data preserved (Requirement 6.5)
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle modal close
   * Don't allow closing while submitting
   */
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        description: '',
      });
      setErrors({});
      setBackendError(null);
      onClose();
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (
    field: keyof CategoryFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing (map 'name' to 'categoryName' for errors)
    const errorField = field === 'name' ? 'categoryName' : field;
    if (errors[errorField as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [errorField]: undefined,
      }));
    }

    // Clear backend error when user makes changes
    if (backendError) {
      setBackendError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        aria-describedby="category-form-description"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mode === 'create' ? (
                <>
                  <FolderPlus className="w-5 h-5 text-purple-600" aria-hidden="true" />
                  Thêm Category
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5 text-purple-600" aria-hidden="true" />
                  Chỉnh sửa Category
                </>
              )}
            </DialogTitle>
            <DialogDescription id="category-form-description">
              {mode === 'create'
                ? 'Tạo mới category cho hệ thống khóa học.'
                : 'Cập nhật thông tin category.'}
            </DialogDescription>
          </DialogHeader>

          {/* Form Fields */}
          <div className="space-y-4 py-4">
            {/* Category Name Field */}
            <div className="space-y-2">
              <Label htmlFor="categoryName" className="text-sm font-medium">
                Tên Category <span className="text-red-500">*</span>
              </Label>
              <Input
                id="categoryName"
                ref={categoryNameRef}
                type="text"
                placeholder="Nhập tên category"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isSubmitting}
                className={errors.categoryName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                aria-invalid={!!errors.categoryName}
                aria-describedby={errors.categoryName ? 'categoryName-error' : undefined}
              />
              {/* Field-level error (Requirement 6.4, 10.1) */}
              {errors.categoryName && (
                <p 
                  id="categoryName-error" 
                  className="text-sm text-red-500 font-medium"
                  role="alert"
                >
                  {errors.categoryName}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Mô tả
              </Label>
              <Textarea
                id="description"
                ref={descriptionRef}
                placeholder="Nhập mô tả category (tùy chọn)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isSubmitting}
                className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
                rows={3}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'description-error' : undefined}
              />
              {/* Field-level error */}
              {errors.description && (
                <p 
                  id="description-error" 
                  className="text-sm text-red-500 font-medium"
                  role="alert"
                >
                  {errors.description}
                </p>
              )}
            </div>


          </div>

          {/* Backend Error Display */}
          {backendError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm font-medium">
                {backendError}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
              aria-label="Hủy"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px] w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
              aria-label={
                isSubmitting
                  ? 'Đang xử lý, vui lòng đợi'
                  : mode === 'create'
                  ? 'Tạo category mới'
                  : 'Cập nhật category'
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Đang xử lý...
                </>
              ) : mode === 'create' ? (
                <>
                  <FolderPlus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Tạo mới
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                  Cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;
