import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface PendingTasksSectionProps {
  pendingRefundRequests: number;
}

/**
 * PendingTasksSection component displays pending tasks that require tutor attention.
 * Currently shows pending refund requests with visual emphasis when count > 0.
 * 
 * Requirements:
 * - 9.1: Display pending refund requests count
 * - 9.3: Display zero when there are no pending refunds
 * - 9.4: Provide visual indication when there are pending refunds
 * 
 * @param pendingRefundRequests - Count of pending refund requests (status "PENDING" or "SUBMITTED")
 */
export const PendingTasksSection: React.FC<PendingTasksSectionProps> = ({
  pendingRefundRequests,
}) => {
  const hasPendingRefunds = pendingRefundRequests > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Công việc cần xử lý</span>
          {hasPendingRefunds && (
            <Badge variant="destructive" className="ml-2" aria-label={`${pendingRefundRequests} yêu cầu hoàn tiền đang chờ`}>
              {pendingRefundRequests} đang chờ
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasPendingRefunds ? (
          <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950" role="alert" aria-live="polite">
            <AlertCircle className="h-4 w-4 text-orange-600" aria-hidden="true" />
            <AlertTitle className="text-orange-800 dark:text-orange-200">
              Yêu cầu hoàn tiền cần xử lý
            </AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              Bạn có {pendingRefundRequests} yêu cầu hoàn tiền đang chờ cần được xem xét.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950" role="status">
            <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              Tất cả đã xong
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Không có yêu cầu hoàn tiền đang chờ xử lý.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
