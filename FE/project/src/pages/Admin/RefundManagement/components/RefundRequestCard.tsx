import { useState } from 'react';
import { Calendar, User, CheckCircle, XCircle, AlertCircle, CreditCard, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RefundRequest {
  refundRequestId: number;
  bookingPlanId: number;
  slotId: number;
  userId: number;
  packageId: number | null;
  refundAmount: number;
  bankAccountNumber: string | null;
  bankOwnerName: string | null;
  bankName: string | null;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  createdAt: string;
  processedAt: string | null;
  tutorId: number;
}

interface UserInfo {
  userID: number;
  fullName: string;
  avatarURL: string | null;
  email: string;
}

interface RefundRequestCardProps {
  request: RefundRequest;
  userInfo?: UserInfo;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

const RefundRequestCard = ({ request, userInfo, onApprove, onReject }: RefundRequestCardProps) => {
  const [isBankInfoOpen, setIsBankInfoOpen] = useState(false);
  
  const displayName = userInfo?.fullName || request.bankOwnerName || 'Người dùng';
  const avatarUrl = userInfo?.avatarURL || '';

  const getStatusBadge = (status: RefundRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5">
            <Clock className="w-3 h-3" />
            Chờ xử lý
          </Badge>
        );
      case 'SUBMITTED':
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1.5">
            <AlertCircle className="w-3 h-3" />
            Đã gửi
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 gap-1.5">
            <CheckCircle className="w-3 h-3" />
            Đã duyệt
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1.5">
            <XCircle className="w-3 h-3" />
            Từ chối
          </Badge>
        );
      case 'PROCESSED':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 gap-1.5">
            <CheckCircle className="w-3 h-3" />
            Đã xử lý
          </Badge>
        );
    }
  };

  const canApproveOrReject = request.status === 'SUBMITTED';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="w-16 h-16 border-2 border-white shadow-md ring-2 ring-slate-100">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold">
              {displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {displayName}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-3.5 h-3.5" />
                  <span>{userInfo?.email || `ID: ${request.userId}`}</span>
                </div>
              </div>
              {getStatusBadge(request.status)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <div className="text-sm">
                  <span className="text-slate-500">Ngày tạo: </span>
                  <span className="font-medium text-slate-700">
                    {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
              {request.processedAt && (
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <div className="text-sm">
                    <span className="text-slate-500">Ngày xử lý: </span>
                    <span className="font-medium text-slate-700">
                      {new Date(request.processedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-slate-600 font-medium">Số tiền hoàn:</span>
                <span className="font-bold text-purple-900 text-xl">
                  {request.refundAmount.toLocaleString()} đ
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-2">
                <span>Booking Plan ID: {request.bookingPlanId}</span>
                <span className="mx-2">•</span>
                <span>Slot ID: {request.slotId}</span>
              </div>
            </div>

            {/* Bank Information Button */}
            {request.bankAccountNumber && (
              <Dialog open={isBankInfoOpen} onOpenChange={setIsBankInfoOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Xem thông tin tài khoản
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">
                      Thông tin tài khoản ngân hàng
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                      Thông tin tài khoản để chuyển tiền hoàn
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 rounded-lg p-2">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 mb-1">Ngân hàng</p>
                          <p className="font-semibold text-slate-900 text-lg">{request.bankName}</p>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs text-slate-500 mb-1">Chủ tài khoản</p>
                        <p className="font-medium text-slate-900">{request.bankOwnerName}</p>
                      </div>
                      
                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs text-slate-500 mb-1">Số tài khoản</p>
                        <p className="font-mono font-semibold text-slate-900 text-lg tracking-wider">
                          {request.bankAccountNumber}
                        </p>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-1">Số tiền cần chuyển:</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {request.refundAmount.toLocaleString()} đ
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {canApproveOrReject && (
          <div className="flex flex-col gap-2 lg:min-w-[200px]">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Hoàn thành
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận đã chuyển tiền thành công</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn xác nhận đã chuyển thành công số tiền {request.refundAmount.toLocaleString()} đ 
                    vào tài khoản ngân hàng của học viên?
                    <br /><br />
                    <strong>Thông tin chuyển khoản:</strong><br />
                    • Ngân hàng: {request.bankName}<br />
                    • Chủ TK: {request.bankOwnerName}<br />
                    • Số TK: {request.bankAccountNumber}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onApprove(request.refundRequestId)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Xác nhận đã chuyển
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Thất bại
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận chuyển tiền thất bại</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn xác nhận việc chuyển tiền hoàn không thành công?
                    Yêu cầu hoàn tiền này sẽ bị từ chối và học viên sẽ được thông báo.
                    <br /><br />
                    Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onReject(request.refundRequestId)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Xác nhận thất bại
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundRequestCard;
