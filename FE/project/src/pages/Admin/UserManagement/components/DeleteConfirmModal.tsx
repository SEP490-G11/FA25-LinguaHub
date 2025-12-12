import React from 'react';
import { AlertTriangle, Loader2, User, Mail, Calendar, Ban } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useDeleteUser } from '../hooks/useDeleteUser';
import { User as UserType } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onRefresh?: () => void;
}

/**
 * DeleteConfirmModal component for user deletion confirmation
 * Requirements: 2.1, 2.5 - confirmation dialog with user information, confirmation/cancellation actions, loading state
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  user,
  onRefresh,
}) => {
  const { deleteUser, isDeleting, error, clearError } = useDeleteUser();
  const { toast } = useToast();

  // Generate avatar fallback from user's name
  const getAvatarFallback = (fullName: string, username: string) => {
    if (fullName && fullName.trim()) {
      const names = fullName.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return fullName[0].toUpperCase();
    }
    return username ? username[0].toUpperCase() : 'U';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    try {
      clearError();
      
      // Don't use optimistic update - just call API
      await deleteUser(user.userID);
      
      // Show success toast
      toast({
        title: "Dừng hoạt động thành công",
        description: `${user.fullName || user.username} đã bị dừng hoạt động.`,
      });
      
      // Close modal
      onClose();
      
      // Refresh data from server to show updated status
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      // Show error toast only if there's an actual error
      const errorMessage = err?.message || error || "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.";
      toast({
        title: "Dừng hoạt động thất bại",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Error is handled by the hook, modal stays open to show error
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isDeleting) {
      clearError();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="delete-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            Xác nhận dừng hoạt động
          </DialogTitle>
          <DialogDescription id="delete-description">
            Bạn có chắc chắn muốn dừng hoạt động của người dùng này? Người dùng sẽ không thể đăng nhập vào hệ thống.
          </DialogDescription>
        </DialogHeader>

        {/* ========== USER INFORMATION DISPLAY ========== */}
        <div className="bg-gray-50 rounded-lg p-4 my-4" role="region" aria-label="User information">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16 mx-auto sm:mx-0">
              <AvatarImage 
                src={user.avatarURL} 
                alt={`${user.fullName || user.username}'s avatar`}
              />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold text-lg">
                {getAvatarFallback(user.fullName, user.username)}
              </AvatarFallback>
            </Avatar>

            {/* User Details */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {user.fullName || 'N/A'}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-600">
                  <div className="flex items-center justify-center sm:justify-start gap-1">
                    <User className="w-4 h-4" aria-hidden="true" />
                    <span>{user.username}</span>
                  </div>
                  <span className="hidden sm:inline text-gray-400">•</span>
                  <span>ID: {user.userID}</span>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span className="truncate max-w-[200px] sm:max-w-none">{user.email || 'N/A'}</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-3">
                <Badge 
                  variant={user.isActive ? "default" : "secondary"}
                  className={user.isActive 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                  }
                  aria-label={`Trạng thái người dùng: ${user.isActive ? 'Hoạt động' : 'Không hoạt động'}`}
                >
                  {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
                <Badge variant="outline">
                  {user.role || 'User'}
                </Badge>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                <span>Tạo: {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========== ERROR MESSAGE ========== */}
        {error && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-orange-800 text-sm font-medium mb-1">
                  Dừng hoạt động thất bại
                </p>
                <p className="text-orange-700 text-sm">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="ml-3 text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                Thử lại
              </Button>
            </div>
          </div>
        )}

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
            className="min-w-[100px] w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
            aria-label={isDeleting ? 'Đang xử lý, vui lòng đợi' : `Dừng hoạt động ${user.fullName || user.username}`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Ban className="w-4 h-4 mr-2" aria-hidden="true" />
                Dừng hoạt động
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmModal;