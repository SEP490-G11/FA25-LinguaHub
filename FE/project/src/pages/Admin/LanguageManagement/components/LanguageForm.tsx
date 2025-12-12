import React, { useEffect, useRef } from 'react';
import { Loader2, Languages, Edit } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { TeachingLanguage } from '../types';

interface LanguageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LanguageFormData) => Promise<void>;
  initialData?: TeachingLanguage;
  mode: 'create' | 'edit';
}

export interface LanguageFormData {
  nameVi: string;
  nameEn: string;
  isActive: boolean;
  difficulty: string;
  certificates: string;
  thumbnailUrl: string;
}

interface FormErrors {
  nameVi?: string;
  nameEn?: string;
  difficulty?: string;
  certificates?: string;
  thumbnailUrl?: string;
}

/**
 * LanguageForm component for creating and editing teaching languages
 * Requirements: 2.1, 2.2, 2.4, 2.5, 3.1, 3.2, 3.5, 9.2, 10.1, 10.2, 10.3, 10.4, 10.5
 */
export const LanguageForm: React.FC<LanguageFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  // Form state
  const [formData, setFormData] = React.useState<LanguageFormData>({
    nameVi: '',
    nameEn: '',
    isActive: true,
    difficulty: '',
    certificates: '',
    thumbnailUrl: '',
  });

  // Store original nameEn when editing (Requirement 3.5)
  const [originalNameEn, setOriginalNameEn] = React.useState<string>('');

  // Validation and submission state
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [backendError, setBackendError] = React.useState<string | null>(null);

  // Refs for focus management (Requirement 10.4)
  const nameViRef = useRef<HTMLInputElement>(null);
  const nameEnRef = useRef<HTMLInputElement>(null);
  const difficultyRef = useRef<HTMLInputElement>(null);
  const certificatesRef = useRef<HTMLTextAreaElement>(null);
  const thumbnailUrlRef = useRef<HTMLInputElement>(null);

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        const editData = {
          nameVi: initialData.nameVi || '',
          nameEn: initialData.nameEn || '',
          isActive: initialData.isActive ?? true,
          difficulty: initialData.difficulty || '',
          certificates: initialData.certificates || '',
          thumbnailUrl: initialData.thumbnailUrl || '',
        };
        setFormData(editData);
        // Store original nameEn for LANGUAGE_NAME_EN_IN_USE handling (Requirement 3.5)
        setOriginalNameEn(initialData.nameEn || '');
      } else {
        // Reset form for create mode
        setFormData({
          nameVi: '',
          nameEn: '',
          isActive: true,
          difficulty: '',
          certificates: '',
          thumbnailUrl: '',
        });
        setOriginalNameEn('');
      }
      // Clear errors when modal opens
      setErrors({});
      setBackendError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, mode, initialData]);

  /**
   * Validate URL format
   * Requirement 10.2 - URL format validation
   */
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Validate nameEn format (alphanumeric and spaces only)
   * Requirement 10.2 - nameEn format validation
   */
  const isValidNameEn = (name: string): boolean => {
    // Allow alphanumeric characters, spaces, and common punctuation
    const nameEnPattern = /^[a-zA-Z0-9\s\-_]+$/;
    return nameEnPattern.test(name);
  };

  /**
   * Client-side validation
   * Requirements: 10.1, 10.2 - validate required fields, min/max length, format
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate nameVi (required, min 2, max 100)
    if (!formData.nameVi || formData.nameVi.trim() === '') {
      newErrors.nameVi = 'Trường này là bắt buộc';
    } else if (formData.nameVi.trim().length < 2) {
      newErrors.nameVi = 'Tên tiếng Việt phải có ít nhất 2 ký tự';
    } else if (formData.nameVi.trim().length > 100) {
      newErrors.nameVi = 'Tên tiếng Việt không được vượt quá 100 ký tự';
    }

    // Validate nameEn (required, min 2, max 100, alphanumeric and spaces)
    if (!formData.nameEn || formData.nameEn.trim() === '') {
      newErrors.nameEn = 'Trường này là bắt buộc';
    } else if (formData.nameEn.trim().length < 2) {
      newErrors.nameEn = 'Tên tiếng Anh phải có ít nhất 2 ký tự';
    } else if (formData.nameEn.trim().length > 100) {
      newErrors.nameEn = 'Tên tiếng Anh không được vượt quá 100 ký tự';
    } else if (!isValidNameEn(formData.nameEn.trim())) {
      newErrors.nameEn = 'Tên tiếng Anh chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang';
    }

    // Validate difficulty (required, max 50)
    if (!formData.difficulty || formData.difficulty.trim() === '') {
      newErrors.difficulty = 'Trường này là bắt buộc';
    } else if (formData.difficulty.trim().length > 50) {
      newErrors.difficulty = 'Độ khó không được vượt quá 50 ký tự';
    }

    // Validate certificates (required, max 200)
    if (!formData.certificates || formData.certificates.trim() === '') {
      newErrors.certificates = 'Trường này là bắt buộc';
    } else if (formData.certificates.trim().length > 200) {
      newErrors.certificates = 'Chứng chỉ không được vượt quá 200 ký tự';
    }

    // Validate thumbnailUrl (required, valid URL format)
    if (!formData.thumbnailUrl || formData.thumbnailUrl.trim() === '') {
      newErrors.thumbnailUrl = 'Trường này là bắt buộc';
    } else if (!isValidUrl(formData.thumbnailUrl.trim())) {
      newErrors.thumbnailUrl = 'URL không hợp lệ. Vui lòng nhập URL đầy đủ (ví dụ: https://example.com/image.jpg)';
    }

    setErrors(newErrors);

    // Focus on first error field (Requirement 10.4)
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.nameVi && nameViRef.current) {
        nameViRef.current.focus();
      } else if (newErrors.nameEn && nameEnRef.current) {
        nameEnRef.current.focus();
      } else if (newErrors.difficulty && difficultyRef.current) {
        difficultyRef.current.focus();
      } else if (newErrors.certificates && certificatesRef.current) {
        certificatesRef.current.focus();
      } else if (newErrors.thumbnailUrl && thumbnailUrlRef.current) {
        thumbnailUrlRef.current.focus();
      }
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   * Requirements: 2.2, 3.2, 10.3, 10.5 - submit with loading state, prevent API call on validation error
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
        nameVi: formData.nameVi.trim(),
        nameEn: formData.nameEn.trim(),
        isActive: formData.isActive,
        difficulty: formData.difficulty.trim(),
        certificates: formData.certificates.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim(),
      });

      // Success - parent will handle toast and close modal
      // Reset form state
      setFormData({
        nameVi: '',
        nameEn: '',
        isActive: true,
        difficulty: '',
        certificates: '',
        thumbnailUrl: '',
      });
      setOriginalNameEn('');
      setErrors({});
      setBackendError(null);
    } catch (error: any) {
      // Handle backend errors (Requirements: 2.4, 3.5)
      const errorMessage = error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      
      // Check if it's a LANGUAGE_ALREADY_EXISTS error (Requirement 2.4)
      if (errorMessage.includes('đã tồn tại') || errorMessage.includes('LANGUAGE_ALREADY_EXISTS')) {
        // Show as field error
        setErrors({
          nameEn: 'Language (name_en) đã tồn tại, vui lòng chọn tên khác',
        });
        // Focus on the field
        if (nameEnRef.current) {
          nameEnRef.current.focus();
        }
      } 
      // Check if it's a LANGUAGE_NAME_EN_IN_USE error (Requirement 3.5)
      else if (errorMessage.includes('LANGUAGE_NAME_EN_IN_USE') || errorMessage.includes('không thể đổi Name (EN)')) {
        // Show toast notification (Requirement 3.5)
        toast({
          title: 'Không thể cập nhật',
          description: 'Không thể đổi Name (EN) vì đã có khóa học đang sử dụng. Bạn chỉ có thể chỉnh sửa các thông tin khác',
          variant: 'destructive',
        });
        
        // Reset nameEn field to original value (Requirement 3.5)
        setFormData((prev) => ({
          ...prev,
          nameEn: originalNameEn,
        }));
        
        // Keep form open for user to edit other fields (Requirement 3.5)
        // Don't close the modal, don't reset other fields
      } else {
        // Show as general backend error
        setBackendError(errorMessage);
      }

      // Keep form open with data preserved (Requirement 2.5)
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
        nameVi: '',
        nameEn: '',
        isActive: true,
        difficulty: '',
        certificates: '',
        thumbnailUrl: '',
      });
      setOriginalNameEn('');
      setErrors({});
      setBackendError(null);
      onClose();
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (
    field: keyof LanguageFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
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
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" 
        aria-describedby="language-form-description"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mode === 'create' ? (
                <>
                  <Languages className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  Thêm Language
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  Chỉnh sửa Language
                </>
              )}
            </DialogTitle>
            <DialogDescription id="language-form-description">
              {mode === 'create'
                ? 'Tạo mới ngôn ngữ giảng dạy cho hệ thống.'
                : 'Cập nhật thông tin ngôn ngữ giảng dạy.'}
            </DialogDescription>
          </DialogHeader>

          {/* Form Fields */}
          <div className="space-y-4 py-4">
            {/* Name Vietnamese Field */}
            <div className="space-y-2">
              <Label htmlFor="nameVi" className="text-sm font-medium">
                Tên tiếng Việt <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nameVi"
                ref={nameViRef}
                type="text"
                placeholder="Nhập tên tiếng Việt"
                value={formData.nameVi}
                onChange={(e) => handleInputChange('nameVi', e.target.value)}
                disabled={isSubmitting}
                className={errors.nameVi ? 'border-red-500 focus-visible:ring-red-500' : ''}
                aria-invalid={!!errors.nameVi}
                aria-describedby={errors.nameVi ? 'nameVi-error' : undefined}
              />
              {/* Field-level error (Requirement 10.1) */}
              {errors.nameVi && (
                <p 
                  id="nameVi-error" 
                  className="text-sm text-red-500 font-medium"
                  role="alert"
                >
                  {errors.nameVi}
                </p>
              )}
            </div>

            {/* Name English Field */}
            <div className="space-y-2">
              <Label htmlFor="nameEn" className="text-sm font-medium">
                Tên tiếng Anh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nameEn"
                ref={nameEnRef}
                type="text"
                placeholder="Nhập tên tiếng Anh (chỉ chữ cái, số, khoảng trắng)"
                value={formData.nameEn}
                onChange={(e) => handleInputChange('nameEn', e.target.value)}
                disabled={isSubmitting}
                className={errors.nameEn ? 'border-red-500 focus-visible:ring-red-500' : ''}
                aria-invalid={!!errors.nameEn}
                aria-describedby={errors.nameEn ? 'nameEn-error' : undefined}
              />
              {/* Field-level error (Requirement 2.4, 10.2) */}
              {errors.nameEn && (
                <p 
                  id="nameEn-error" 
                  className="text-sm text-red-500 font-medium"
                  role="alert"
                >
                  {errors.nameEn}
                </p>
              )}
            </div>

            {/* Difficulty Field */}
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-sm font-medium">
                Độ khó <span className="text-red-500">*</span>
              </Label>
              <Input
                id="difficulty"
                ref={difficultyRef}
                type="text"
                placeholder="Nhập độ khó (ví dụ: Beginner, Intermediate, Advanced)"
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                disabled={isSubmitting}
                className={errors.difficulty ? 'border-red-500 focus-visible:ring-red-500' : ''}
                aria-invalid={!!errors.difficulty}
                aria-describedby={errors.difficulty ? 'difficulty-error' : undefined}
              />
              {/* Field-level error */}
              {errors.difficulty && (
                <p 
                  id="difficulty-error" 
                  className="text-sm text-red-500 font-medium"
                  role="alert"
                >
                  {errors.difficulty}
                </p>
              )}
            </div>

            {/* Certificates Field */}
            <div className="space-y-2">
              <Label htmlFor="certificates" className="text-sm font-medium">
                Chứng chỉ <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="certificates"
                ref={certificatesRef}
                placeholder="Nhập các chứng chỉ liên quan (ví dụ: IELTS, TOEFL, HSK)"
                value={formData.certificates}
                onChange={(e) => handleInputChange('certificates', e.target.value)}
                disabled={isSubmitting}
                className={errors.certificates ? 'border-red-500 focus-visible:ring-red-500' : ''}
                rows={3}
                aria-invalid={!!errors.certificates}
                aria-describedby={errors.certificates ? 'certificates-error' : undefined}
              />
              {/* Field-level error */}
              {errors.certificates && (
                <p 
                  id="certificates-error" 
                  className="text-sm text-red-500 font-medium"
                  role="alert"
                >
                  {errors.certificates}
                </p>
              )}
            </div>

            {/* Thumbnail URL Field */}
            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl" className="text-sm font-medium">
                URL hình ảnh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="thumbnailUrl"
                ref={thumbnailUrlRef}
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.thumbnailUrl}
                onChange={(e) => handleInputChange('thumbnailUrl', e.target.value)}
                disabled={isSubmitting}
                className={errors.thumbnailUrl ? 'border-red-500 focus-visible:ring-red-500' : ''}
                aria-invalid={!!errors.thumbnailUrl}
                aria-describedby={errors.thumbnailUrl ? 'thumbnailUrl-error' : undefined}
              />
              {/* Field-level error (Requirement 10.2 - URL validation) */}
              {errors.thumbnailUrl && (
                <p 
                  id="thumbnailUrl-error" 
                  className="text-sm text-red-500 font-medium"
                  role="alert"
                >
                  {errors.thumbnailUrl}
                </p>
              )}
            </div>

            {/* Active Status Field */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Trạng thái
                </Label>
                <p className="text-xs text-gray-500">
                  {formData.isActive ? 'Language đang hoạt động' : 'Language không hoạt động'}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                disabled={isSubmitting}
                aria-label="Trạng thái hoạt động của language"
              />
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
              className="min-w-[120px] w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              aria-label={
                isSubmitting
                  ? 'Đang xử lý, vui lòng đợi'
                  : mode === 'create'
                  ? 'Tạo language mới'
                  : 'Cập nhật language'
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Đang xử lý...
                </>
              ) : mode === 'create' ? (
                <>
                  <Languages className="w-4 h-4 mr-2" aria-hidden="true" />
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

export default LanguageForm;
