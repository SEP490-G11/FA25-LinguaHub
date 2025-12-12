import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DeleteConfirmDialogProps } from '../types';

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  package: pkg,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!pkg) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Xác nhận xóa gói dịch vụ
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              ⚠️ Cảnh báo: Hành động này không thể hoàn tác!
            </p>
            <p className="text-sm text-red-700">
              Bạn sắp xóa vĩnh viễn gói dịch vụ này khỏi hệ thống. Tất cả dữ liệu liên quan sẽ bị mất.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Thông tin gói dịch vụ:</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="font-medium">Tên:</span> {pkg.name}</p>
              <p><span className="font-medium">Mô tả:</span> {pkg.description}</p>
              <p><span className="font-medium">Số slot tối đa:</span> {pkg.max_slots}</p>
              <p><span className="font-medium">Trạng thái:</span> {pkg.is_active ? 'Hoạt động' : 'Không hoạt động'}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Để xác nhận xóa, vui lòng nhấn nút "Xóa gói dịch vụ" bên dưới.
          </p>
        </AlertDialogDescription>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Xóa gói dịch vụ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;