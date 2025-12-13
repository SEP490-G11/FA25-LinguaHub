import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingPlan } from '@/pages/TutorPages/Schedule/type';
import { Pencil, Trash2, Clock, DollarSign, Link, Calendar, RefreshCw } from 'lucide-react';

interface BookingPlansListProps {
  bookingPlans: BookingPlan[];
  isLoading: boolean;
  isDeleting?: boolean;
  onEdit: (plan: BookingPlan) => void;
  onDelete: (planId: number) => void;
  onRefresh?: () => void;
}

export const BookingPlansList: React.FC<BookingPlansListProps> = memo(({
  bookingPlans,
  isLoading,
  isDeleting = false,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const formatTime = (timeObj: { hour: number; minute: number }) => {
    return `${timeObj.hour.toString().padStart(2, '0')}:${timeObj.minute.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteClick = (planId: number) => {
    setShowDeleteConfirm(planId);
  };

  const handleDeleteConfirm = async (planId: number) => {
    setDeletingPlanId(planId);
    setShowDeleteConfirm(null);
    await onDelete(planId);
    setDeletingPlanId(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col h-full overflow-hidden">
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="text-sm font-semibold">Danh sách lịch làm việc</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-xs">Đang tải...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookingPlans.length === 0) {
    return (
      <Card className="flex flex-col h-full overflow-hidden">
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="text-sm font-semibold">Danh sách lịch làm việc</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Chưa có lịch làm việc nào</p>
              <p className="text-xs mt-1">Tạo lịch mới để bắt đầu</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Danh sách lịch làm việc ({bookingPlans.length})
          </CardTitle>
          {onRefresh && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-6 w-6 p-0"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 overflow-y-auto">
        {bookingPlans.map((plan) => (
          <div
            key={plan.booking_planid}
            className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
          >
            {/* Header with title */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm text-gray-900">{plan.title}</h3>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(plan)}
                  disabled={isDeleting || deletingPlanId === plan.booking_planid}
                  className="h-7 w-7 p-0 disabled:opacity-50"
                  title="Chỉnh sửa"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteClick(plan.booking_planid)}
                  disabled={isDeleting || deletingPlanId === plan.booking_planid}
                  className="h-7 w-7 p-0 hover:bg-red-50 hover:border-red-200 disabled:opacity-50"
                  title="Xóa"
                >
                  {deletingPlanId === plan.booking_planid ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-red-500"></div>
                  ) : (
                    <Trash2 className="w-3 h-3 text-red-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {formatTime(plan.start_hours)} - {formatTime(plan.end_hours)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>{formatPrice(plan.price_per_hours)}/giờ</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Slot: {plan.slot_duration} phút</span>
              </div>
              <div className="flex items-center gap-1">
                <Link className="w-3 h-3" />
                <a 
                  href={plan.meeting_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate max-w-[100px]"
                  title={plan.meeting_url}
                >
                  Meeting
                </a>
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Tạo: {formatDate(plan.createdAt)}</span>
                <span>Cập nhật: {formatDate(plan.updatedAt)}</span>
              </div>
            </div>

            {/* Delete confirmation dialog */}
            {showDeleteConfirm === plan.booking_planid && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-700 mb-2">
                  Bạn có chắc chắn muốn xóa lịch làm việc "{plan.title}"?
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteConfirm(plan.booking_planid)}
                    disabled={isDeleting}
                    className="h-6 text-xs px-2 disabled:opacity-50"
                  >
                    {isDeleting ? 'Đang xóa...' : 'Xóa'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeleteCancel}
                    disabled={isDeleting}
                    className="h-6 text-xs px-2 disabled:opacity-50"
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
});