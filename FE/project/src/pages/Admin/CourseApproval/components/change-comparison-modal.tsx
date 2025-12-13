import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertCircle,
  FileText,
  Target,
  BookOpen,
  Video,
  Link as LinkIcon,
  AlertTriangle,
} from 'lucide-react';
import { CourseChangeData, ChangeType, FieldChange } from '../types';
import { courseApprovalApi } from '../api';
import { ChangeItem } from './change-item';
import { ChangeTypeBadge } from './change-type-badge';

interface ChangeComparisonModalProps {
  open: boolean;
  draftID: number;
  onClose: () => void;
}

interface ChangeGroupProps {
  title: string;
  changeType: ChangeType;
  fieldChanges: FieldChange[];
  warning?: boolean;
  icon?: React.ReactNode;
}

const ChangeGroup = ({ title, changeType, fieldChanges, warning, icon }: ChangeGroupProps) => {
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          {icon}
          <h5 className="font-semibold text-gray-900">{title}</h5>
        </div>
        <ChangeTypeBadge changeType={changeType} />
      </div>

      {warning && (
        <Alert className="mb-3 bg-yellow-50 border-yellow-300">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-sm">
            Thay đổi này yêu cầu đặt lại tiến độ học viên
          </AlertDescription>
        </Alert>
      )}

      {fieldChanges && fieldChanges.length > 0 && (
        <div className="space-y-3">
          {fieldChanges.map((change, index) => (
            <ChangeItem
              key={index}
              field={change.field}
              oldValue={change.oldValue}
              newValue={change.newValue}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function ChangeComparisonModal({
  open,
  draftID,
  onClose,
}: ChangeComparisonModalProps) {
  const [changeData, setChangeData] = useState<CourseChangeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && draftID) {
      fetchChanges();
    }
  }, [open, draftID]);

  const fetchChanges = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await courseApprovalApi.getDraftChanges(draftID);
      setChangeData(data);
    } catch (err: any) {
      console.error('Error fetching changes:', err);
      
      // Handle specific error cases
      if (err?.response?.status === 404) {
        setError('Không tìm thấy thông tin thay đổi. Khóa học có thể đã bị xóa hoặc đã được xử lý.');
      } else if (err?.response?.status === 403) {
        setError('Bạn không có quyền xem thông tin thay đổi này.');
      } else if (!err?.response) {
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn.');
      } else {
        setError(err.message || 'Không thể tải thông tin thay đổi');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = changeData && (
    changeData.courseChanges.length > 0 ||
    changeData.objectives.length > 0 ||
    changeData.sections.length > 0 ||
    changeData.lessons.length > 0 ||
    changeData.resources.length > 0
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Thay đổi khóa học
          </DialogTitle>
          <DialogDescription>
            Xem xét tất cả các thay đổi được thực hiện cho khóa học này
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600">Đang tải thay đổi...</span>
            </div>
          )}

          {error && (
            <div className="space-y-3">
              <Alert className="bg-red-50 border-red-300">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button
                  onClick={fetchChanges}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Thử lại
                </Button>
                <Button
                  onClick={onClose}
                  size="sm"
                  variant="ghost"
                  className="text-gray-700 hover:bg-gray-100"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && changeData && (
            <div className="space-y-6">
              {/* Course Information Changes */}
              {changeData.courseChanges.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Thông tin khóa học
                  </h4>
                  <div className="space-y-3">
                    {changeData.courseChanges.map((change, index) => (
                      <ChangeItem
                        key={index}
                        field={change.field}
                        oldValue={change.oldValue}
                        newValue={change.newValue}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Objectives Changes */}
              {changeData.objectives.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-500" />
                      Mục tiêu học tập ({changeData.objectives.length})
                    </h4>
                    <div className="space-y-3">
                      {changeData.objectives.map((objective, index) => (
                        <ChangeGroup
                          key={index}
                          title={`Mục tiêu #${objective.draftObjectiveId || index + 1}`}
                          changeType={objective.changeType}
                          fieldChanges={objective.fieldChanges}
                          icon={<Target className="w-4 h-4 text-green-500" />}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Course Sections Changes */}
              {changeData.sections.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-500" />
                      Nội dung khóa học ({changeData.sections.length} chương)
                    </h4>
                    <div className="space-y-3">
                      {changeData.sections.map((section, index) => (
                        <ChangeGroup
                          key={index}
                          title={section.title || `Chương #${section.draftSectionId || index + 1}`}
                          changeType={section.changeType}
                          fieldChanges={section.fieldChanges}
                          icon={<BookOpen className="w-4 h-4 text-purple-500" />}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Lessons Changes */}
              {changeData.lessons.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Video className="w-5 h-5 text-blue-500" />
                      Bài học ({changeData.lessons.length})
                    </h4>
                    <div className="space-y-3">
                      {changeData.lessons.map((lesson, index) => (
                        <ChangeGroup
                          key={index}
                          title={`${lesson.title || `Bài học #${lesson.draftLessonId || index + 1}`} (${lesson.lessonType})`}
                          changeType={lesson.changeType}
                          fieldChanges={lesson.fieldChanges}
                          warning={lesson.resetUserProgressRequired}
                          icon={<Video className="w-4 h-4 text-blue-500" />}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Resources Changes */}
              {changeData.resources.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-orange-500" />
                      Tài nguyên ({changeData.resources.length})
                    </h4>
                    <div className="space-y-3">
                      {changeData.resources.map((resource, index) => (
                        <ChangeGroup
                          key={index}
                          title={resource.resourceTitle || `Tài nguyên #${resource.draftResourceId || index + 1}`}
                          changeType={resource.changeType}
                          fieldChanges={resource.fieldChanges}
                          icon={<LinkIcon className="w-4 h-4 text-orange-500" />}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* No changes message */}
              {!hasChanges && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Không có thay đổi
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Không phát hiện thay đổi nào trong khóa học này
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
