import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApplicationStatusResponse } from '../types';
import * as date from 'date-and-time';

interface ApplicationStatusProps {
  data: ApplicationStatusResponse;
}

export function ApplicationStatus({ data }: ApplicationStatusProps) {
  const { status, submittedAt, reasonForReject } = data;

  // Format the submission date
  const formattedDate = date.format(new Date(submittedAt), 'DD/MM/YYYY');

  // Determine badge variant and color based on status
  const getBadgeVariant = () => {
    switch (status) {
      case 'APPROVED':
        return 'default'; // Green/primary color
      case 'REJECTED':
        return 'destructive'; // Red color
      case 'PENDING':
      default:
        return 'secondary'; // Gray/secondary color
    }
  };

  // Get status label in Vietnamese
  const getStatusLabel = () => {
    switch (status) {
      case 'APPROVED':
        return 'Đã chấp thuận';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'PENDING':
      default:
        return 'Đang chờ xét duyệt';
    }
  };

  // Get status message based on status
  const getStatusMessage = () => {
    switch (status) {
      case 'APPROVED':
        return 'Chúc mừng! Đơn đăng ký của bạn đã được chấp thuận. Bây giờ bạn có thể tạo và giảng dạy các khóa học trên nền tảng.';
      case 'REJECTED':
        return 'Rất tiếc, đơn đăng ký của bạn đã bị từ chối.';
      case 'PENDING':
      default:
        return 'Đơn đăng ký của bạn hiện đang được xem xét. Chúng tôi sẽ thông báo cho bạn ngay khi có quyết định.';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Trạng Thái Đơn Đăng Ký</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
            <Badge variant={getBadgeVariant()}>
              {getStatusLabel()}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Đã Gửi:</span>
            <span className="text-sm">{formattedDate}</span>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              {getStatusMessage()}
            </p>
          </div>

          {status === 'REJECTED' && reasonForReject && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Lý do từ chối:</p>
              <p className="text-sm text-destructive">{reasonForReject}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
