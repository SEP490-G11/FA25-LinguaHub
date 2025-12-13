import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
import { CourseDetailView } from '@/components/shared/CourseDetailView';
import { getCourseDetail, deleteCourse } from './api';
import { enableCourse, disableCourse } from '../CourseList/course-api';
import { getCourseListRoute } from '@/utils/course-routes';
import type { CourseDetail as Course } from '@/pages/Admin/CourseApproval/types';

export default function TutorCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetail();
    }
  }, [courseId]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const data = await getCourseDetail(courseId!);
      setCourse(data);
    } catch (error: any) {
      console.error('Error fetching course detail:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin khóa học",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseId) return;

    try {
      setIsDeleting(true);
      await deleteCourse(Number(courseId));
      
      toast({
        title: "Thành công",
        description: "Đã xóa khóa học thành công",
      });
      
      navigate(getCourseListRoute());
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa khóa học",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Check if course can be deleted (Draft or Rejected status)
  const canDelete = course?.status?.toUpperCase() === 'DRAFT' || 
                    course?.status?.toUpperCase() === 'REJECTED' ||
                    course?.status?.toLowerCase() === 'draft' ||
                    course?.status?.toLowerCase() === 'rejected';

  // Check if course is approved (can toggle enable/disable)
  const isApproved = course?.status?.toUpperCase() === 'APPROVED' ||
                     course?.status?.toLowerCase() === 'approved';

  // Get enabled state (defaults to true if undefined)
  const isEnabled = course?.isEnabled ?? true;

  const handleToggleEnable = async () => {
    if (!courseId || !course) return;

    try {
      setIsToggling(true);
      
      if (isEnabled) {
        await disableCourse(Number(courseId));
        toast({
          title: "Thành công",
          description: "Đã tắt kích hoạt khóa học. Học viên sẽ không thể xem khóa học này.",
        });
      } else {
        await enableCourse(Number(courseId));
        toast({
          title: "Thành công",
          description: "Đã bật kích hoạt khóa học. Học viên có thể xem khóa học này.",
        });
      }
      
      // Update local state
      setCourse(prev => prev ? { ...prev, isEnabled: !isEnabled } : null);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thay đổi trạng thái khóa học",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const headerActions = (canDelete || isApproved) ? (
    <>
      {/* Enable/Disable Toggle - Only for Approved courses */}
      {isApproved && (
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            Đang kích hoạt
          </span>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggleEnable}
            disabled={isToggling || loading}
          />
        </div>
      )}

      {/* Delete Button - Only for Draft/Rejected courses */}
      {canDelete && (
        <>
          <Button
            variant="destructive"
            size="default"
            onClick={() => setShowDeleteDialog(true)}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa khóa học
          </Button>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa khóa học</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa khóa học "{course?.title}"? 
                  Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCourse}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Đang xóa..." : "Xóa"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  ) : null;

  return (
    <CourseDetailView
      course={course}
      loading={loading}
      backUrl={getCourseListRoute()}
      backLabel="Quay lại danh sách khóa học"
      hideTutorInfo={true}
      headerActionsSlot={headerActions}
      variant="tutor"
    />
  );
}