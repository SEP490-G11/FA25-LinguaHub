import React from 'react';
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
import { Category } from '../types';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  category: Category;
}

/**
 * CategoryDeleteModal component for category deletion confirmation
 * Requirements: 8.1, 9.2 - confirmation dialog with category information, consistent styling
 * 
 * This component provides a confirmation dialog before deleting a category,
 * displaying category information and handling the delete operation.
 */
export const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  category,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  /**
   * Handle delete confirmation
   * Requirements: 8.2, 8.3 - handle delete with loading state
   */
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      // Success - parent will close modal and show toast
    } catch (err) {
      // Error is handled by parent (toast is shown)
      // Keep modal open for retry
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle modal close
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
            Xác nhận xóa danh mục
          </DialogTitle>
          <DialogDescription id="delete-description">
            Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        {/* ========== CATEGORY INFORMATION DISPLAY ========== */}
        <div className="bg-gray-50 rounded-lg p-4 my-4" role="region" aria-label="Category information">
          <div className="space-y-3">
            {/* Category Name */}
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {category.categoryName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                ID: {category.categoryID}
              </p>
            </div>

            {/* Description */}
            {category.description && (
              <div>
                <p className="text-sm text-gray-700">
                  {category.description}
                </p>
              </div>
            )}

            {/* Status Badge */}
            <div>
              <Badge 
                variant={category.isActive ? "default" : "secondary"}
                className={category.isActive 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-800"
                }
                aria-label={`Trạng thái: ${category.isActive ? 'Hoạt động' : 'Không hoạt động'}`}
              >
                {category.isActive ? 'Hoạt động' : 'Không hoạt động'}
              </Badge>
            </div>
          </div>
        </div>

        {/* ========== WARNING MESSAGE ========== */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            <strong>Lưu ý:</strong> Nếu danh mục này đang được sử dụng bởi các khóa học, 
            bạn sẽ không thể xóa nó.
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
            aria-label={isDeleting ? 'Đang xử lý, vui lòng đợi' : `Xóa ${category.categoryName}`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Xóa danh mục
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDeleteModal;
