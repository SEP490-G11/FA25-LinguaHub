import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SafeAvatar } from '@/components/ui/safe-avatar';
import { Card, CardContent } from '@/components/ui/card';
import { BookingStudent } from '../types';
import { formatDateTime } from '../utils';
import { Mail, Calendar, BookOpen } from 'lucide-react';

interface BookingStudentDetailModalProps {
  open: boolean;
  student: BookingStudent | null;
  onClose: () => void;
}

export const BookingStudentDetailModal = memo(({
  open,
  student,
  onClose,
}: BookingStudentDetailModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[70vh] overflow-y-auto"
        aria-describedby="booking-student-detail-description"
      >
        {student ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4 mb-4">
                <SafeAvatar
                  src={student.avatarURL}
                  alt={student.fullName}
                  fallback={student.fullName.charAt(0).toUpperCase()}
                  className="h-16 w-16"
                  fallbackClassName="bg-violet-600 text-white"
                />
                <div>
                  <DialogTitle className="text-2xl">
                    {student.fullName}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <span>{student.email}</span>
                  </div>
                </div>
              </div>
              <p id="booking-student-detail-description" className="sr-only">
                Thông tin chi tiết về học viên 1-1 {student.fullName} bao gồm số buổi đã đặt và lịch học
              </p>
            </DialogHeader>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-violet-100" aria-hidden="true">
                      <BookOpen className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tổng buổi đã đặt
                      </p>
                      <p className="text-2xl font-bold text-violet-700">
                        {student.totalPaidSlots}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-violet-100" aria-hidden="true">
                      <Calendar className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Buổi học gần nhất
                      </p>
                      <p className="font-medium">
                        {formatDateTime(student.lastSlotTime)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
});

BookingStudentDetailModal.displayName = 'BookingStudentDetailModal';
