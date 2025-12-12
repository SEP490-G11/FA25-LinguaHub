import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { quizApi } from '@/pages/TutorPages/CreateCourse/quiz-api';
import { toast } from 'sonner';

interface DeleteQuestionDialogProps {
  open: boolean;
  questionId: string;
  isDraft: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteQuestionDialog({
  open,
  questionId,
  isDraft,
  onClose,
  onSuccess,
}: DeleteQuestionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await quizApi.deleteQuestion(questionId, isDraft);
      toast.success('Xóa câu hỏi thành công');
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast.error(error?.response?.data?.message || 'Không thể xóa câu hỏi');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
        <AlertDialogDescription>
          Bạn có chắc muốn xóa câu hỏi này? Tất cả các lựa chọn sẽ bị xóa.
        </AlertDialogDescription>
        <div className="flex justify-end gap-3 mt-4">
          <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Đang xóa...
              </>
            ) : (
              'Xóa'
            )}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
