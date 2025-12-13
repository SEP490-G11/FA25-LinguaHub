import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { WithdrawalResponse } from './types';
import { formatCurrency, formatDate } from '../Payment/utils';
import { ROUTES } from '@/constants/routes';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  data?: WithdrawalResponse;
  errorMessage?: string;
}

export default function WithdrawalModal({
  isOpen,
  onClose,
  type,
  data,
  errorMessage,
}: WithdrawalModalProps) {
  const navigate = useNavigate();

  const handleViewHistory = () => {
    onClose();
    navigate(ROUTES.PAYMENTS);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'Đang xử lý',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Đã từ chối',
      COMPLETED: 'Hoàn thành',
    };
    return statusMap[status] || status;
  };

  if (type === 'success' && data) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Yêu cầu rút tiền thành công
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mã yêu cầu:</span>
                <span className="font-semibold text-gray-900">#{data.withdrawId}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Số tiền rút:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(data.withdrawAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tổng số dư:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(data.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Phí xử lý:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(data.commission)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trạng thái:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {getStatusText(data.status)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ngày tạo:</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(data.createdAt)}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                {data.status === 'PENDING' 
                  ? 'Yêu cầu rút tiền của bạn đang chờ Admin xử lý. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.'
                  : 'Yêu cầu rút tiền của bạn đã được gửi. Chúng tôi sẽ xử lý trong thời gian sớm nhất.'}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Đóng
            </Button>
            <Button
              onClick={handleViewHistory}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Xem lịch sử
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (type === 'error') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Không thể tạo yêu cầu
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 text-center">
                {errorMessage || 'Đã xảy ra lỗi. Vui lòng thử lại.'}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Đóng
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Thử lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
