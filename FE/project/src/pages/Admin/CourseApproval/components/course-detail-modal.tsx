import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  User,
  BookOpen,
  Target,
  FileText,
  Video,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { useLanguages } from '@/hooks/useLanguages';
import { CourseDetail } from '../types';

interface CourseDetailModalProps {
  isOpen: boolean;
  course: CourseDetail | null;
  onClose: () => void;
  onApprove: (courseId: number, adminNotes?: string) => Promise<void>;
  onReject: (courseId: number, rejectionReason: string) => Promise<void>;
  isLoading: boolean;
}

export function CourseDetailModal({
  isOpen,
  course,
  onClose,
  onApprove,
  onReject,
  isLoading,
}: CourseDetailModalProps) {
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { languages } = useLanguages();

  // Helper function to get Vietnamese display name for language
  const getLanguageDisplayName = (languageName?: string): string => {
    if (!languageName) return 'N/A';

    // Find the language in the fetched languages list
    const language = languages.find(lang => lang.name === languageName);

    // Return displayName if found, otherwise return the original name
    return language?.displayName || languageName;
  };

  // Helper function to translate level to Vietnamese
  const getLevelLabel = (level?: string): string => {
    const levelMap: Record<string, string> = {
      'BEGINNER': 'Cơ bản',
      'INTERMEDIATE': 'Trung cấp',
      'ADVANCED': 'Nâng cao',
    };
    return levelMap[level?.toUpperCase() || 'BEGINNER'] || level || 'Cơ bản';
  };

  if (!course) return null;

  const handleApprove = async () => {
    await onApprove(course.id, adminNotes);
    setAdminNotes('');
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    await onReject(course.id, rejectionReason);
    setRejectionReason('');
    setShowRejectForm(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const totalLessons = course.section?.reduce(
    (sum, section) => sum + (section.lessons?.length || 0),
    0
  ) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Chi tiết khóa học
          </DialogTitle>
          <DialogDescription>
            Xem xét và phê duyệt khóa học từ giảng viên
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thumbnail */}
          {course.thumbnailURL && (
            <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={course.thumbnailURL}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Basic Info */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {course.title}
            </h3>
            <div className="flex gap-2 mb-4">
              <Badge>{getLevelLabel(course.level)}</Badge>
              <Badge variant="outline">{course.categoryName}</Badge>
              <Badge variant="outline">{getLanguageDisplayName(course.language)}</Badge>
            </div>
            <p className="text-gray-600 mb-4">{course.shortDescription}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Giảng viên</span>
              </div>
              <p className="font-semibold text-gray-900">
                {course.tutorName || `Tutor #${course.tutorID}`}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Thời lượng</span>
              </div>
              <p className="font-semibold text-gray-900">{course.duration} giờ</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium">Bài học</span>
              </div>
              <p className="font-semibold text-gray-900">
                {totalLessons} bài
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Giá</span>
              </div>
              <p className="font-semibold text-gray-900">
                {formatPrice(course.price)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Mô tả chi tiết
            </h4>
            <div
              className="text-gray-600 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: course.description }}
            />
          </div>

          {/* Requirements */}
          {course.requirement && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Yêu cầu
              </h4>
              <div
                className="text-gray-600 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: course.requirement }}
              />
            </div>
          )}

          <Separator />

          {/* Learning Objectives */}
          {course.objectives && course.objectives.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Mục tiêu học tập ({course.objectives.length})
              </h4>
              <ul className="space-y-2">
                {course.objectives.map((objective) => (
                  <li
                    key={objective.objectiveID}
                    className="flex items-start gap-2 text-gray-700"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{objective.objectiveText}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Course Content */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Nội dung khóa học ({course.section?.length || 0} chương)
            </h4>
            <div className="space-y-4">
              {course.section?.map((section, sectionIndex) => (
                <div
                  key={section.sectionID}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <h5 className="font-semibold text-gray-900 mb-1">
                    Chương {sectionIndex + 1}: {section.title}
                  </h5>
                  {section.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {section.description}
                    </p>
                  )}

                  {/* Lessons */}
                  <div className="space-y-2">
                    {section.lessons?.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.lessonID}
                        className="bg-white p-3 rounded border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {lesson.lessonType === 'Video' ? (
                                <Video className="w-4 h-4 text-blue-500" />
                              ) : (
                                <FileText className="w-4 h-4 text-green-500" />
                              )}
                              <span className="font-medium text-gray-900">
                                Bài {lessonIndex + 1}: {lesson.title}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {lesson.duration} phút • {lesson.lessonType}
                            </p>

                            {/* Resources */}
                            {lesson.resources && lesson.resources.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {lesson.resources.map((resource) => (
                                  <div
                                    key={resource.resourceID}
                                    className="flex items-center gap-2 text-sm text-gray-600"
                                  >
                                    <LinkIcon className="w-3 h-3" />
                                    <span>
                                      {resource.resourceTitle} ({resource.resourceType})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Admin Actions */}
          {!showRejectForm ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="adminNotes" className="text-sm font-semibold">
                  Ghi chú cho giảng viên (tùy chọn)
                </Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Nhập ghi chú hoặc góp ý cho giảng viên..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Phê duyệt khóa học
                </Button>
                <Button
                  onClick={() => setShowRejectForm(true)}
                  disabled={isLoading}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Từ chối khóa học
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason" className="text-sm font-semibold text-red-600">
                  Lý do từ chối *
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối khóa học (bắt buộc)..."
                  rows={4}
                  className="mt-2 border-red-300 focus:border-red-500"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isLoading || !rejectionReason.trim()}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Xác nhận từ chối
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
