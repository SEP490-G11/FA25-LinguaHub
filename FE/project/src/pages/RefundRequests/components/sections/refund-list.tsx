import React, { useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, CreditCard, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { BookingSlot } from '@/types/MyBooking';
import { useNavigate } from 'react-router-dom';

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
  refundType: 'COMPLAINT' | 'SLOT_REJECT' | null;
  createdAt: string;
  processedAt: string | null;
  tutorId: number | null;
  reason: string | null;
  learnerJoin: boolean | null;
  tutorJoin: boolean | null;
  learnerEvidence: string | null;
  tutorEvidence: string | null;
}

interface RefundListProps {
  requests: RefundRequest[];
  currentUserId: number;
  isStudentView?: boolean;
  onRefresh?: () => void;
  slotsMap?: Map<number, BookingSlot>;
}

interface EvidenceModalState {
  isOpen: boolean;
  imageUrl: string | null;
  title: string;
}

interface BankInfoModalState {
  isOpen: boolean;
  bankName: string | null;
  bankOwnerName: string | null;
  bankAccountNumber: string | null;
}

const RefundList = ({ requests, currentUserId, onRefresh, slotsMap }: RefundListProps) => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [bankName, setBankName] = useState('');
  const [bankOwnerName, setBankOwnerName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceModal, setEvidenceModal] = useState<EvidenceModalState>({
    isOpen: false,
    imageUrl: null,
    title: '',
  });
  const [bankInfoModal, setBankInfoModal] = useState<BankInfoModalState>({
    isOpen: false,
    bankName: null,
    bankOwnerName: null,
    bankAccountNumber: null,
  });
  const { toast } = useToast();

  const openEvidenceModal = (imageUrl: string, title: string) => {
    setEvidenceModal({ isOpen: true, imageUrl, title });
  };

  const closeEvidenceModal = () => {
    setEvidenceModal({ isOpen: false, imageUrl: null, title: '' });
  };

  const openBankInfoModal = (bankName: string | null, bankOwnerName: string | null, bankAccountNumber: string | null) => {
    setBankInfoModal({ isOpen: true, bankName, bankOwnerName, bankAccountNumber });
  };

  const closeBankInfoModal = () => {
    setBankInfoModal({ isOpen: false, bankName: null, bankOwnerName: null, bankAccountNumber: null });
  };

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

  // Helper function để xác định trạng thái gia sư dựa trên tutorEvidence + learnerJoin
  const getTutorStatus = (request: RefundRequest) => {
    const hasTutorEvidence = !!request.tutorEvidence;
    
    // Có tutorEvidence → Gia sư đã phản đối
    if (hasTutorEvidence) {
      return { text: 'Đã phản đối (có bằng chứng)', color: 'text-purple-600' };
    }
    
    // Không có tutorEvidence + learnerJoin = true → Gia sư đã đồng ý hoàn tiền
    if (!hasTutorEvidence && request.learnerJoin === true) {
      return { text: 'Đã đồng ý hoàn tiền', color: 'text-blue-600' };
    }
    
    // Không có tutorEvidence + learnerJoin = false → Gia sư chưa phản hồi
    return { text: 'Chưa phản hồi', color: 'text-orange-500' };
  };

  return (
      <>
      <div className="space-y-4">
        {requests.map((request) => {
          // Get slot info from slotsMap
          const slotInfo = slotsMap?.get(request.slotId);
          const startTime = slotInfo ? new Date(slotInfo.startTime) : null;
          const endTime = slotInfo ? new Date(slotInfo.endTime) : null;
          const tutorStatus = getTutorStatus(request);
          
          return (
            <div key={request.refundRequestId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header với gradient */}
              <div className={`px-5 py-3 ${
                request.refundType === 'COMPLAINT' 
                  ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100' 
                  : request.refundType === 'SLOT_REJECT'
                    ? 'bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">
                    {request.refundType === 'COMPLAINT' 
                      ? '📋 Khiếu nại buổi học' 
                      : request.refundType === 'SLOT_REJECT' 
                        ? '❌ Slot bị hủy bởi gia sư'
                        : '💰 Yêu cầu hoàn tiền'}
                  </h3>
                  {getStatusBadge(request.status)}
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 space-y-3">
                    {/* Slot info */}
                    {slotInfo && startTime && endTime && (
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>{startTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-4 h-4 text-green-500" />
                          <span>{startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} - {endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                        </div>
                        {slotInfo.tutorFullName && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4 text-purple-500" />
                            <button
                              onClick={() => navigate(`/tutors/${slotInfo.tutorID}`)}
                              className="text-blue-600 font-medium hover:underline"
                            >
                              {slotInfo.tutorFullName}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lý do */}
                    {request.reason && (
                      <div className="bg-orange-50 rounded-lg px-3 py-2 text-sm">
                        <span className="text-orange-700 font-medium">Lý do:</span>{' '}
                        <span className="text-slate-700">{request.reason}</span>
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span>📅 Ngày tạo: {new Date(request.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span className="text-slate-300">|</span>
                      <span>🏷️ Loại: {request.refundType === 'COMPLAINT' ? 'Khiếu nại' : request.refundType === 'SLOT_REJECT' ? 'Gia sư hủy slot' : 'Hoàn tiền'}</span>
                      {request.refundType === 'COMPLAINT' && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span>👨‍🏫 Gia sư: <span className={`font-medium ${tutorStatus.color}`}>{tutorStatus.text}</span></span>
                        </>
                      )}
                    </div>

                    {/* Bằng chứng */}
                    {(request.learnerEvidence || request.tutorEvidence) && (
                      <div className="flex flex-wrap gap-2">
                        {request.learnerEvidence && (
                          <button 
                            onClick={() => openEvidenceModal(request.learnerEvidence!, 'Bằng chứng của bạn')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                          >
                            <Image className="w-4 h-4" />
                            Bằng chứng của bạn
                          </button>
                        )}
                        {request.tutorEvidence && (
                          <button 
                            onClick={() => openEvidenceModal(request.tutorEvidence!, 'Bằng chứng của gia sư')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 text-sm rounded-lg hover:bg-purple-100 transition-colors border border-purple-100"
                          >
                            <Image className="w-4 h-4" />
                            Bằng chứng gia sư
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Amount + Actions */}
                  <div className="lg:text-right space-y-3">
                    {/* Số tiền */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-3 border border-blue-100">
                      <p className="text-xs text-slate-500 mb-1">Số tiền hoàn</p>
                      <p className="text-xl font-bold text-blue-600">{request.refundAmount.toLocaleString()} đ</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {request.status === 'PENDING'
                            ? '⏳ Đang chờ xử lý'
                            : request.status === 'SUBMITTED'
                              ? '📤 Đã gửi thông tin'
                              : request.status === 'APPROVED'
                                ? '✅ Đã duyệt'
                                : request.status === 'PROCESSED'
                                  ? '💸 Đã chuyển khoản'
                                  : '❌ Từ chối'}
                      </p>
                    </div>

                    {/* Actions */}
                    {request.status === 'PENDING' && !request.bankAccountNumber && request.userId === currentUserId && (
                      <Button
                          onClick={() => openDialog(request)}
                          className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Điền thông tin TK
                      </Button>
                    )}
                    {request.bankAccountNumber && (
                      <Button
                          onClick={() => openBankInfoModal(request.bankName, request.bankOwnerName, request.bankAccountNumber)}
                          variant="outline"
                          className="w-full gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Xem thông tin TK
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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

      {/* Modal Xem ảnh bằng chứng */}
      {evidenceModal.isOpen && evidenceModal.imageUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                {evidenceModal.title}
              </h3>
              <button
                onClick={closeEvidenceModal}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50 rounded-b-2xl">
              <img
                src={evidenceModal.imageUrl}
                alt={evidenceModal.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem thông tin ngân hàng */}
      {bankInfoModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Thông tin tài khoản ngân hàng
              </h3>
              <button
                onClick={closeBankInfoModal}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 min-w-[100px] text-sm">Ngân hàng:</span>
                <span className="font-medium text-slate-900 text-sm">{bankInfoModal.bankName}</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 min-w-[100px] text-sm">Chủ tài khoản:</span>
                <span className="font-medium text-slate-900 text-sm">{bankInfoModal.bankOwnerName}</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 min-w-[100px] text-sm">Số tài khoản:</span>
                <span className="font-medium text-slate-900 text-sm">{bankInfoModal.bankAccountNumber}</span>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100">
              <Button onClick={closeBankInfoModal} className="w-full">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
      </>
  );
};

export default RefundList;
