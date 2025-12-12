import { memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SafeAvatar } from '@/components/ui/safe-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye } from 'lucide-react';
import { CourseStudent } from '../types';
import { getProgressColor } from '../utils';

interface CourseStudentsTableProps {
  students: CourseStudent[];
  onViewDetail: (studentId: number, buttonRef?: HTMLButtonElement) => void;
  loading: boolean;
}

export const CourseStudentsTable = memo(({
  students,
  onViewDetail,
  loading,
}: CourseStudentsTableProps) => {
  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Đang tải danh sách học viên">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
        <span className="sr-only">Đang tải danh sách học viên khóa học...</span>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground" role="status">
        <p>Không tìm thấy học viên nào</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Học viên</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-center">Khóa học</TableHead>
            <TableHead className="text-center">Hoàn thành</TableHead>
            <TableHead>Tiến độ TB</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.userId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <SafeAvatar
                    src={student.avatarURL}
                    alt={student.fullName}
                    fallback={student.fullName.charAt(0).toUpperCase()}
                    className="h-10 w-10"
                  />
                  <span className="font-medium">{student.fullName}</span>
                </div>
              </TableCell>
              <TableCell>{student.email}</TableCell>
              <TableCell className="text-center">
                {student.totalCourses}
              </TableCell>
              <TableCell className="text-center">
                {student.completedCourses}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div 
                    className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]"
                    role="progressbar"
                    aria-valuenow={student.averageProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Tiến độ trung bình ${student.averageProgress}%`}
                  >
                    <div
                      className={`h-2 rounded-full ${getProgressColor(
                        student.averageProgress
                      )}`}
                      style={{ width: `${student.averageProgress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium min-w-[45px]" aria-hidden="true">
                    {student.averageProgress}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => onViewDetail(student.userId, e.currentTarget)}
                  aria-label={`Xem chi tiết học viên ${student.fullName}`}
                >
                  <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                  Chi tiết
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

CourseStudentsTable.displayName = 'CourseStudentsTable';
