import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  withdrawId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isProcessing: boolean;
  onApprove: (withdrawId: number) => Promise<void>;
  onReject: (withdrawId: number) => Promise<void>;
  tutorId?: number;
  withdrawAmount?: number;
  bankName?: string;
}

export function ActionButtons({
  withdrawId,
  status,
  isProcessing,
  onApprove,
  onReject,
  tutorId,
  withdrawAmount,
  bankName,
}: ActionButtonsProps) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // Only show buttons for PENDING status
  if (status !== 'PENDING') {
    return null;
  }

  const handleApproveClick = () => {
    setShowApproveConfirm(true);
  };

  const handleRejectClick = () => {
    setShowRejectConfirm(true);
  };

  const handleApproveConfirm = async () => {
    setShowApproveConfirm(false);
    await onApprove(withdrawId);
  };

  const handleRejectConfirm = async () => {
    setShowRejectConfirm(false);
    await onReject(withdrawId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={handleApproveClick}
          disabled={isProcessing}
          size="sm"
          className="bg-green-600 hover:bg-green-700 gap-1"
        >
          {isProcessing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          Duyệt
        </Button>

        <Button
          onClick={handleRejectClick}
          disabled={isProcessing}
          size="sm"
          variant="destructive"
          className="gap-1"
        >
          {isProcessing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          Từ chối
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              Xác nhận duyệt yêu cầu rút tiền
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn phê duyệt yêu cầu rút tiền này không?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
            <p className="text-sm text-gray-600 mb-1">🆔 Mã yêu cầu</p>
            <p className="font-semibold text-gray-900">#{withdrawId}</p>
            
            {tutorId && (
              <>
                <p className="text-sm text-gray-600 mt-2">👨‍🏫 Giảng viên</p>
                <p className="font-semibold text-gray-900">Tutor #{tutorId}</p>
              </>
            )}
            
            {withdrawAmount !== undefined && (
              <>
                <p className="text-sm text-gray-600 mt-2">💰 Số tiền rút</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(withdrawAmount)}
                </p>
              </>
            )}
            
            {bankName && (
              <>
                <p className="text-sm text-gray-600 mt-2">🏦 Ngân hàng</p>
                <p className="font-semibold text-gray-900">{bankName}</p>
              </>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApproveConfirm(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Xác nhận duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              Xác nhận từ chối yêu cầu rút tiền
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn từ chối yêu cầu rút tiền này không?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <p className="text-sm text-gray-600 mb-1">🆔 Mã yêu cầu</p>
            <p className="font-semibold text-gray-900">#{withdrawId}</p>
            
            {tutorId && (
              <>
                <p className="text-sm text-gray-600 mt-2">👨‍🏫 Giảng viên</p>
                <p className="font-semibold text-gray-900">Tutor #{tutorId}</p>
              </>
            )}
            
            {withdrawAmount !== undefined && (
              <>
                <p className="text-sm text-gray-600 mt-2">💰 Số tiền rút</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(withdrawAmount)}
                </p>
              </>
            )}
            
            {bankName && (
              <>
                <p className="text-sm text-gray-600 mt-2">🏦 Ngân hàng</p>
                <p className="font-semibold text-gray-900">{bankName}</p>
              </>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectConfirm(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleRejectConfirm}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1 gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
