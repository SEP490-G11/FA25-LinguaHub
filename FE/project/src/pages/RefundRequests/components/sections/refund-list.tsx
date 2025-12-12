import React, { useState } from 'react';
import { Calendar, User, CheckCircle, XCircle, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/config/axiosConfig.ts';
import { getApiErrorMessage } from '@/utils/errorMessages';

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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'SUBMITTED';
  createdAt: string;
  processedAt: string | null;
}

interface RefundListProps {
  requests: RefundRequest[];
  currentUserId: number;
  isStudentView?: boolean;
  onRefresh?: () => void;
}

const RefundList = ({ requests, currentUserId, isStudentView = false, onRefresh }: RefundListProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [bankName, setBankName] = useState('');
  const [bankOwnerName, setBankOwnerName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const openDialog = (request: RefundRequest) => {
    setSelectedRequest(request);
    setBankName('');
    setBankOwnerName('');
    setBankAccountNumber('');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedRequest(null);
    setBankName('');
    setBankOwnerName('');
    setBankAccountNumber('');
  };

  const getStatusBadge = (status: RefundRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5">
              <AlertCircle className="w-3 h-3" />
              Chờ xử lý
            </Badge>
        );
      case 'APPROVED':
        return (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1.5">
              <CheckCircle className="w-3 h-3" />
              Đã xử lý
            </Badge>
        );
      case 'PROCESSED':
        return (
            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1.5">
              <CheckCircle className="w-3 h-3" />
              Đã xử lý
            </Badge>
        );
      case 'REJECTED':
        return (
            <Badge className="bg-red-100 text-red-700 border-red-200 gap-1.5">
              <XCircle className="w-3 h-3" />
              Từ chối
            </Badge>
        );
      case 'SUBMITTED':
        return (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1.5">
              <AlertCircle className="w-3 h-3" />
              Đã gửi
            </Badge>
        );
    }
  };

  const handleSubmitForm = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedRequest) return;

    // Validation
    if (!bankName.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên ngân hàng',
        variant: 'destructive',
      });
      return;
    }

    if (!bankOwnerName.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên chủ tài khoản',
        variant: 'destructive',
      });
      return;
    }

    if (!bankAccountNumber.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập số tài khoản',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.put(`/learner/refund/${selectedRequest.refundRequestId}`, {
        bankName: bankName.trim(),
        bankOwnerName: bankOwnerName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
      });

      if (response.data.code === 0) {
        toast({
          title: 'Thành công!',
          description: 'Đã cập nhật thông tin tài khoản ngân hàng thành công',
          variant: 'default',
        });
        closeDialog();
        // Refresh data without full page reload
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        const errorMsg = getApiErrorMessage(response, 'Không thể cập nhật thông tin');
        toast({
          title: 'Lỗi',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error updating refund request:', error);
      const errorMsg = getApiErrorMessage(error, 'Không thể cập nhật thông tin tài khoản');
      toast({
        title: 'Lỗi',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <>
      <div className="space-y-4">
        {requests.map((request) => (
            <div key={request.refundRequestId} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="w-16 h-16 border-2 border-white shadow-md ring-2 ring-slate-100">
                    <AvatarImage src={request.bankOwnerName || 'default-avatar.jpg'} alt={request.bankOwnerName || 'No name provided'} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      {request.bankOwnerName?.split(' ').map((n) => n[0]).join('') || 'NA'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                          {request.bankOwnerName || 'Yêu cầu hoàn tiền'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <User className="w-3.5 h-3.5" />
                          <span>{isStudentView ? 'Học viên' : 'Quản trị viên'}</span>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <div className="text-sm">
                          <span className="text-slate-500">Ngày tạo: </span>
                          <span className="font-medium text-slate-700">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-slate-600 font-medium">Số tiền hoàn:</span>
                        <span className="font-bold text-blue-900 text-xl">{request.refundAmount.toLocaleString()} đ</span>
                      </div>
                      <p className="text-xs text-blue-800">
                        {request.status === 'PENDING'
                            ? 'Yêu cầu hoàn tiền đang được xem xét bởi quản trị viên'
                            : request.status === 'APPROVED'
                                ? 'Đã được duyệt! Sẽ sớm được chuyển vào tài khoản ngân hàng của bạn'
                                : request.status === 'PROCESSED'
                                    ? 'Số tiền này đã được chuyển vào tài khoản ngân hàng của bạn'
                                    : 'Yêu cầu hoàn tiền đã bị từ chối'}
                      </p>
                    </div>
                  </div>
                </div>

                {request.status === 'PENDING' && !request.bankAccountNumber && !request.bankOwnerName && !request.bankName && request.userId === currentUserId && (
                    <div className="flex flex-col gap-2 lg:min-w-[180px]">
                      <Button
                          onClick={() => openDialog(request)}
                          className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Điền thông tin TK
                      </Button>
                    </div>
                )}

                {/* Hiển thị thông tin ngân hàng cho TẤT CẢ các đơn đã có thông tin */}
                {request.bankAccountNumber && (
                    <div className="flex flex-col gap-2 lg:min-w-[250px] bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Thông tin tài khoản:</div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 min-w-[80px]">Ngân hàng:</span>
                          <span className="font-medium text-slate-900">{request.bankName}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 min-w-[80px]">Chủ TK:</span>
                          <span className="font-medium text-slate-900">{request.bankOwnerName}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 min-w-[80px]">Số TK:</span>
                          <span className="font-medium text-slate-900">{request.bankAccountNumber}</span>
                        </div>
                      </div>
                    </div>
                )}
              </div>
            </div>
        ))}
      </div>

      {/* Dialog for Bank Details */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Thông tin tài khoản ngân hàng
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Vui lòng điền đầy đủ thông tin tài khoản ngân hàng để nhận tiền hoàn
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitForm} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="bankName" className="text-sm font-medium text-slate-700">
                Tên ngân hàng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankName"
                placeholder="VD: Vietcombank, Techcombank, BIDV..."
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankOwnerName" className="text-sm font-medium text-slate-700">
                Tên chủ tài khoản <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankOwnerName"
                placeholder="VD: NGUYEN VAN A"
                value={bankOwnerName}
                onChange={(e) => setBankOwnerName(e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber" className="text-sm font-medium text-slate-700">
                Số tài khoản <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankAccountNumber"
                placeholder="VD: 1234567890"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            {selectedRequest && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Số tiền hoàn:</p>
                <p className="text-2xl font-bold text-blue-900">
                  {selectedRequest.refundAmount.toLocaleString()} đ
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </>
  );
};

export default RefundList;
