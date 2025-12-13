import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SafeAvatar } from '@/components/ui/safe-avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CourseStudentDetail } from '../types';
import { formatDate, getCourseStatusConfig, getProgressColor } from '../utils';
import { Mail, Phone, Calendar, Activity, TrendingUp } from 'lucide-react';

interface CourseStudentDetailModalProps {
  open: boolean;
  studentDetail: CourseStudentDetail | null;
  loading: boolean;
  onClose: () => void;
}

export const CourseStudentDetailModal = memo(({
  open,
  studentDetail,
  loading,
  onClose,
}: CourseStudentDetailModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl max-h-[80vh] overflow-y-auto"
        aria-describedby="course-student-detail-description"
      >
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        ) : studentDetail ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4 mb-4">
                <SafeAvatar
                  src={studentDetail.avatarURL}
                  alt={studentDetail.fullName}
                  fallback={studentDetail.fullName.charAt(0).toUpperCase()}
                  className="h-16 w-16"
                />
                <div>
                  <DialogTitle className="text-2xl">
                    {studentDetail.fullName}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <span>{studentDetail.email}</span>
                  </div>
                </div>
              </div>
              <p id="course-student-detail-description" className="sr-only">
                Thông tin chi tiết về học viên {studentDetail.fullName} bao gồm thông tin liên hệ và tiến độ học tập
              </p>
            </DialogHeader>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100" aria-hidden="true">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Số điện thoại
                      </p>
                      <p className="font-medium">
                        {studentDetail.phone || 'Chưa có thông tin'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100" aria-hidden="true">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Ngày tham gia
                      </p>
                      <p className="font-medium">
                        {formatDate(studentDetail.joinedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100" aria-hidden="true">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Hoạt động gần nhất
                      </p>
                      <p className="font-medium">
                        {formatDate(studentDetail.lastActivity)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100" aria-hidden="true">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tiến độ trung bình
                      </p>
                      <p className="font-medium">
                        {studentDetail.averageProgress}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enrolled Courses */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Khóa học đã đăng ký ({studentDetail.courses.length})
              </h3>
              <div className="space-y-3">
                {studentDetail.courses.map((course) => (
                  <Card key={course.courseId}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">
                            {course.courseTitle}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Đăng ký: {formatDate(course.enrolledAt)}
                          </p>
                        </div>
                        {(() => {
                          const config = getCourseStatusConfig(course.status);
                          return config ? (
                            <Badge className={config.className}>{config.label}</Badge>
                          ) : null;
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="flex-1 bg-gray-200 rounded-full h-2"
                          role="progressbar"
                          aria-valuenow={course.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Tiến độ khóa học ${course.courseTitle}: ${course.progress}%`}
                        >
                          <div
                            className={`h-2 rounded-full ${getProgressColor(
                              course.progress
                            )}`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium min-w-[45px]" aria-hidden="true">
                          {course.progress}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
});

CourseStudentDetailModal.displayName = 'CourseStudentDetailModal';
