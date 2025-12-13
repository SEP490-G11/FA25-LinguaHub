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
import { BookingStudent } from '../types';
import { formatDate } from '../utils';

interface BookingStudentsTableProps {
  students: BookingStudent[];
  onViewDetail: (studentId: number, buttonRef?: HTMLButtonElement) => void;
  loading: boolean;
}

export const BookingStudentsTable = memo(({
  students,
  onViewDetail,
  loading,
}: BookingStudentsTableProps) => {
  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Đang tải danh sách học viên">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
        <span className="sr-only">Đang tải danh sách học viên 1-1...</span>
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
            <TableHead className="text-center">Tổng buổi đã đặt</TableHead>
            <TableHead>Buổi học gần nhất</TableHead>
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
                    fallbackClassName="bg-violet-600 text-white"
                  />
                  <div>
                    <p className="font-medium">{student.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-violet-100 text-violet-800 font-medium">
                  {student.totalPaidSlots}
                </span>
              </TableCell>
              <TableCell>{formatDate(student.lastSlotTime)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => onViewDetail(student.userId, e.currentTarget)}
                  className="border-violet-300 text-violet-700 hover:bg-violet-50"
                  aria-label={`Xem chi tiết học viên ${student.fullName}`}
                >
                  <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                  Xem chi tiết
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

BookingStudentsTable.displayName = 'BookingStudentsTable';
