import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { courseApprovalApi } from './api';
import { CourseDetail } from './types';
import { CourseDetailView } from '@/components/shared/CourseDetailView';
import { ROUTES } from '@/constants/routes';

interface CourseDetailPageProps {
  courseId?: string;
  isDraft?: boolean;
  additionalActions?: React.ReactNode;
}

export default function CourseDetailPage({
  courseId: propCourseId,
  isDraft: propIsDraft,
  additionalActions,
}: CourseDetailPageProps = {}) {
  const { courseId: paramCourseId } = useParams<{ courseId: string }>();
  const courseId = propCourseId || paramCourseId;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  // Fetch course detail
  useEffect(() => {
    const fetchCourseDetail = async () => {
      if (!courseId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Check if it's a draft (URL param, prop, or localStorage)
        const urlIsDraft = new URLSearchParams(window.location.search).get('isDraft') === 'true';
        const isDraft = propIsDraft !== undefined ? propIsDraft : urlIsDraft;
        
        const courseDetail = await courseApprovalApi.getCourseDetail(
          parseInt(courseId),
          isDraft
        );
        setCourse(courseDetail);
      } catch (err: any) {
        
        // Handle specific error cases
        if (err?.response?.status === 404) {
          setError('Không tìm thấy khóa học này. Có thể khóa học đã bị xóa hoặc đã được xử lý.');
        } else if (err?.response?.status === 403) {
          setError('Bạn không có quyền truy cập khóa học này.');
          // Redirect to dashboard after showing error
          setTimeout(() => navigate(ROUTES.ADMIN_DASHBOARD), 2000);
        } else if (!err?.response) {
          setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn.');
        } else {
          setError(err.message || 'Không thể tải chi tiết khóa học');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseDetail();
  }, [courseId, propIsDraft]);

  const handleApproveClick = () => {
    setShowApproveConfirm(true);
  };

  const handleApprove = async () => {
    if (!course) return;

    try {
      setIsActionLoading(true);
      setShowApproveConfirm(false);
      
      await courseApprovalApi.approveCourse(
        course.id,
        course.isDraft || false
      );

      setActionType('approve');
      setShowSuccessModal(true);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.message || 'Không thể phê duyệt khóa học',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectClick = () => {
    if (!rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng nhập lý do từ chối',
      });
      return;
    }
    setShowRejectConfirm(true);
  };

  const handleReject = async () => {
    if (!course) return;

    try {
      setIsActionLoading(true);
      setShowRejectConfirm(false);
      
      await courseApprovalApi.rejectCourse(
        course.id,
        course.isDraft || false,
        rejectionReason
      );

      setActionType('reject');
      setShowSuccessModal(true);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.message || 'Không thể từ chối khóa học',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error,
      });
    }
  }, [error, toast]);

  const backUrl = course?.isDraft ? '/admin/course-approval/drafts' : '/admin/course-approval';

  // Admin action buttons to be rendered in the sidebar
  const adminActions = (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Hành động Admin
      </h3>

      {/* Additional Actions (for draft-specific buttons) */}
      {additionalActions && (
        <div className="mb-4">
          {additionalActions}
        </div>
      )}

      {!showRejectForm ? (
        <div className="space-y-3">
          <Button
            onClick={handleApproveClick}
            disabled={isActionLoading}
            className="w-full bg-green-600 hover:bg-green-700 gap-2"
            size="lg"
          >
            {isActionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Phê duyệt khóa học
          </Button>

          <Button
            onClick={() => setShowRejectForm(true)}
            disabled={isActionLoading}
            variant="destructive"
            className="w-full gap-2"
            size="lg"
          >
            <XCircle className="w-4 h-4" />
            Từ chối khóa học
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="rejectionReason"
              className="text-sm font-semibold text-red-600"
            >
              Lý do từ chối *
            </Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối (bắt buộc)..."
              rows={5}
              className="mt-2 border-red-300 focus:border-red-500"
            />
          </div>

          <Button
            onClick={() => {
              setShowRejectForm(false);
              setRejectionReason('');
            }}
            variant="outline"
            className="w-full"
            disabled={isActionLoading}
          >
            Hủy
          </Button>

          <Button
            onClick={handleRejectClick}
            disabled={isActionLoading || !rejectionReason.trim()}
            variant="destructive"
            className="w-full gap-2"
            size="lg"
          >
            {isActionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            Xác nhận từ chối
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <CourseDetailView
        course={course}
        loading={isLoading}
        backUrl={backUrl}
        backLabel="Quay lại danh sách"
        hideTutorInfo={false}
        adminActionsSlot={!isLoading && course ? adminActions : undefined}
      />

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              Xác nhận phê duyệt
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn phê duyệt khóa học này không?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 my-4">
            <p className="text-sm text-gray-600 mb-1">📚 Khóa học</p>
            <p className="font-semibold text-gray-900">{course?.title}</p>
            <p className="text-sm text-gray-600 mt-2">👨‍🏫 Giảng viên</p>
            <p className="font-semibold text-gray-900">
              {course?.tutorName || `Tutor #${course?.tutorID}`}
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApproveConfirm(false)}
              disabled={isActionLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isActionLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
            >
              {isActionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Xác nhận phê duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              Xác nhận từ chối
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn từ chối khóa học này không?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <p className="text-sm text-gray-600 mb-1">📚 Khóa học</p>
            <p className="font-semibold text-gray-900">{course?.title}</p>
            <p className="text-sm text-gray-600 mt-2">👨‍🏫 Giảng viên</p>
            <p className="font-semibold text-gray-900">
              {course?.tutorName || `Tutor #${course?.tutorID}`}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Lý do từ chối:</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{rejectionReason}</p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectConfirm(false)}
              disabled={isActionLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleReject}
              disabled={isActionLoading}
              variant="destructive"
              className="flex-1 gap-2"
            >
              {isActionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md border-0 shadow-lg">
          <DialogHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md ${
                  actionType === 'approve'
                    ? 'bg-gradient-to-br from-green-100 to-green-50'
                    : 'bg-gradient-to-br from-red-100 to-red-50'
                }`}
              >
                {actionType === 'approve' ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {actionType === 'approve'
                ? '✅ Khóa học đã được phê duyệt!'
                : '❌ Khóa học đã bị từ chối'}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              {actionType === 'approve'
                ? 'Khóa học đã được phê duyệt và sẽ hiển thị cho học viên.'
                : 'Khóa học đã bị từ chối. Giảng viên sẽ nhận được thông báo.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div
              className={`p-4 rounded-lg border ${
                actionType === 'approve'
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                  : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">📚 Tên khóa học</p>
              <p className="font-semibold text-gray-900 text-lg">
                {course?.title}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                actionType === 'approve'
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                  : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">👨‍🏫 Giảng viên</p>
              <p className="font-semibold text-gray-900">
                {course?.tutorName || `Tutor #${course?.tutorID}`}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                actionType === 'approve'
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                  : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">📊 Trạng thái</p>
              <p
                className={`font-semibold ${
                  actionType === 'approve' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {actionType === 'approve' ? 'Đã phê duyệt' : 'Đã từ chối'}
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-3 mt-6">
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate(backUrl);
              }}
              className={`flex-1 font-semibold ${
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              Quay lại danh sách
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
