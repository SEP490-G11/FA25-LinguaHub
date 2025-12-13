import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeachingLanguage } from '../types';

interface LanguageDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  language: TeachingLanguage;
}

/**
 * LanguageDeleteModal component for language deletion confirmation
 * Requirements: 4.1, 9.2 - confirmation dialog with language information, consistent styling
 */
export const LanguageDeleteModal: React.FC<LanguageDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  language,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Handle delete confirmation
   * Requirements: 4.2, 4.3, 4.5 - delete language with error handling
   */
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      // Success - parent will handle toast and close modal
    } catch (err: any) {
      // Error is handled by parent (useLanguages hook shows toast)
      // Keep modal open to allow retry
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle modal close
   * Don't allow closing while deleting
   */
  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="delete-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            Xác nhận xóa language
          </DialogTitle>
          <DialogDescription id="delete-description">
            Bạn có chắc chắn muốn xóa language này? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        {/* ========== LANGUAGE INFORMATION DISPLAY ========== */}
        <div className="bg-gray-50 rounded-lg p-4 my-4" role="region" aria-label="Language information">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Thumbnail */}
            {language.thumbnailUrl ? (
              <img 
                src={language.thumbnailUrl} 
                alt={`${language.nameVi} thumbnail`}
                className="w-16 h-16 object-cover rounded-md border border-gray-200 mx-auto sm:mx-0"
                onError={(e) => {
                  // Fallback to placeholder on error
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center mx-auto sm:mx-0">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            )}

            {/* Language Details */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {language.nameVi}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-600">
                  <span>{language.nameEn}</span>
                  <span className="hidden sm:inline text-gray-400">•</span>
                  <span>ID: {language.id}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-3">
                <Badge 
                  variant={language.isActive ? "default" : "secondary"}
                  className={language.isActive 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                  }
                  aria-label={`Trạng thái: ${language.isActive ? 'Hoạt động' : 'Không hoạt động'}`}
                >
                  {language.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
                <Badge variant="outline">
                  {language.difficulty}
                </Badge>
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Chứng chỉ:</span> {language.certificates}
              </div>
            </div>
          </div>
        </div>

        {/* ========== WARNING MESSAGE ========== */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            <strong>Lưu ý:</strong> Nếu language này đang được sử dụng bởi các khóa học, bạn sẽ không thể xóa.
          </p>
        </div>

        {/* ========== MODAL ACTIONS ========== */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
            aria-label="Hủy"
          >
            Hủy
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="min-w-[100px] w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            aria-label={isDeleting ? 'Đang xử lý, vui lòng đợi' : `Xóa ${language.nameVi}`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Xóa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageDeleteModal;
