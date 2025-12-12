import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, DollarSign, Clock, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/use-toast';
import { CourseListItem } from '../course-list-api';
import { getStatusConfig, formatPrice } from '../utils';
import { createCourseDraft } from '../draft-course-api';
import { getCourseEditRoute, getCourseDraftEditRoute, getCourseDetailRoute } from '@/utils/course-routes';
import { cn } from '@/lib/utils'; // Added import

interface CourseCardProps {
  course: CourseListItem;
  index: number;
  onEditApproved?: (courseId: number) => void;
  languages?: Array<{ name: string; displayName: string }>;
}

export const CourseCard = ({ course, index, onEditApproved, languages = [] }: CourseCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const statusConfig = getStatusConfig(course.status);
  const StatusIcon = statusConfig.icon;

  // Check if course is approved and needs confirmation for editing
  const isApproved = course.status === 'Approved';

  // State for confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // State for draft creation
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Helper function to get Vietnamese display name for language
  const getLanguageDisplayName = (languageName?: string): string => {
    if (!languageName) return 'N/A';

    // Find the language in the fetched languages list
    const language = languages.find(lang => lang.name === languageName);

    // Return displayName if found, otherwise return the original name
    return language?.displayName || languageName;
  };

  const handleEditClick = async () => {
    if (isApproved) {
      // Check draft status first before showing dialog
      setIsCreatingDraft(true);

      try {
        // Create/get draft from approved course
        const draftData = await createCourseDraft(course.id);

        // Check draft status
        if (draftData.status === 'PENDING_REVIEW') {
          // Show toast warning if draft is pending review
          toast({
            variant: 'destructive',
            title: 'Không thể chỉnh sửa',
            description: 'Phiên bản cập nhật mới nhất của khóa học này đang được quản trị viên duyệt',
          });
          setIsCreatingDraft(false);
          return;
        }

        // Only allow editing if status is EDITING or REJECTED
        if (draftData.status === 'EDITING' || draftData.status === 'REJECTED') {
          // Show confirmation dialog
          setShowConfirmDialog(true);
        } else {
          toast({
            variant: 'destructive',
            title: 'Lỗi',
            description: 'Không thể chỉnh sửa khóa học này lúc này',
          });
        }
      } catch (error) {
        console.error('Error checking course draft:', error);
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: error instanceof Error ? error.message : 'Không thể kiểm tra trạng thái khóa học. Vui lòng thử lại.',
        });
      } finally {
        setIsCreatingDraft(false);
      }
    } else {
      // Navigate directly for non-approved courses using React Router
      navigate(getCourseEditRoute(course.id));
    }
  };

  const handleConfirmEdit = async () => {
    // Prevent multiple clicks during loading
    if (isCreatingDraft) return;

    setIsCreatingDraft(true);

    try {
      // Create draft from approved course
      const draftData = await createCourseDraft(course.id);

      // Navigate to EditCourse with draft context using React Router
      navigate(getCourseDraftEditRoute(course.id, draftData.id), {
        state: {
          isDraft: true,
          draftData: draftData,
          originalCourseId: course.id
        }
      });

      // Call the onEditApproved callback if provided
      if (onEditApproved) {
        onEditApproved(course.id);
      }

      // Close dialog on success
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error creating course draft:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể tạo bản nháp. Vui lòng thử lại.',
      });
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleCancelEdit = () => {
    setShowConfirmDialog(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group overflow-hidden relative border-none shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-300 h-full flex flex-col bg-card ring-1 ring-border/50">
        {/* Course Image */}
        <div className="relative h-48 overflow-hidden bg-muted">
          <img
            src={course.thumbnailURL || '/placeholder-course.jpg'}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge className={cn("backdrop-blur-md shadow-sm border-white/20", statusConfig.className)}>
              <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground hover:bg-white font-medium shadow-sm">
              {course.categoryName}
            </Badge>
          </div>
        </div>

        <CardContent className="flex-1 flex flex-col p-5 space-y-4">
          {/* Course Header - Fixed height */}
          <div className="flex-shrink-0 min-h-[3.5rem]">
            <h3 className="font-semibold text-lg leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
          </div>

          {/* Course Stats - Fixed position */}
          <div className="space-y-3 text-sm flex-shrink-0 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>Giá</span>
              </div>
              <span className="font-bold text-lg text-primary">
                {formatPrice(course.price)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Thời lượng</span>
              </div>
              <span className="font-medium">{course.duration} giờ</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>Ngôn ngữ</span>
              </div>
              <span className="font-medium">{getLanguageDisplayName(course.language)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-4 grid grid-cols-2 gap-3">
            {/* View Details Button */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Link to={getCourseDetailRoute(course.id)}>
                <Eye className="w-4 h-4 mr-2" />
                Xem
              </Link>
            </Button>

            {/* Manage Content Button */}
            <Button
              onClick={handleEditClick}
              variant="default"
              size="sm"
              className="w-full shadow-sm hover:shadow-md transition-all"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Approved Course Editing */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Xác nhận chỉnh sửa khóa học"
        description={
          isCreatingDraft
            ? "Đang tạo bản nháp..."
            : "Bạn có chắc chắn muốn chỉnh sửa khóa học đã được duyệt không?"
        }
        confirmText={isCreatingDraft ? "Đang tạo..." : "OK"}
        cancelText="Hủy"
        onConfirm={handleConfirmEdit}
        onCancel={handleCancelEdit}
      />
    </motion.div>
  );
};
