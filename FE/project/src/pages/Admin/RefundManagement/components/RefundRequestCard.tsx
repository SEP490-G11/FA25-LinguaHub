import { useState } from 'react';
import { Calendar, User, CheckCircle, XCircle, AlertCircle, CreditCard, Clock, FileText, Image, UserCheck, UserX } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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
  reason: string | null;
  refundType: 'COMPLAINT' | 'TUTOR_RESCHEDULE' | 'SLOT_REJECT' | null;
  learnerAttend: boolean | null;
  tutorAttend: boolean | null;
  learnerEvidence: string | null;
  tutorEvidence: string | null;
}

interface UserInfo {
  userID: number;
  fullName: string;
  avatarURL: string | null;
  email: string;
}

interface TutorInfo {
  tutorID: number;
  fullName: string;
  avatarURL: string | null;
  email: string;
}

interface SlotInfo {
  slotID: number;
  startTime: string;
  endTime: string;
}

interface RefundRequestCardProps {
  request: RefundRequest;
  userInfo?: UserInfo;
  tutorInfo?: TutorInfo;
  slotInfo?: SlotInfo;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

const RefundRequestCard = ({ request, userInfo, tutorInfo, slotInfo, onApprove, onReject }: RefundRequestCardProps) => {
  const [isBankInfoOpen, setIsBankInfoOpen] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  
  const learnerName = userInfo?.fullName || request.bankOwnerName || 'Learner';
  const learnerAvatar = userInfo?.avatarURL || '';
  const tutorName = tutorInfo?.fullName || `Tutor #${request.tutorId}`;
  const tutorAvatar = tutorInfo?.avatarURL || '';
  const tutorEmail = tutorInfo?.email || '';

  const getRefundTypeLabel = (type: RefundRequest['refundType']) => {
    switch (type) {
      case 'COMPLAINT': return 'Khiếu nại';
      case 'TUTOR_RESCHEDULE': return 'Tutor thay đổi lịch';
      case 'SLOT_REJECT': return 'Gia sư hủy slot';
      default: return 'Không xác định';
    }
  };

  const hasEvidence = request.learnerEvidence || request.tutorEvidence || request.reason;

  const getStatusBadge = (status: RefundRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5"><Clock className="w-3 h-3" />Chờ xử lý</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1.5"><AlertCircle className="w-3 h-3" />Đã gửi</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700 border-green-200 gap-1.5"><CheckCircle className="w-3 h-3" />Đã duyệt</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1.5"><XCircle className="w-3 h-3" />Từ chối</Badge>;
      case 'PROCESSED':
        return <Badge className="bg-green-100 text-green-700 border-green-200 gap-1.5"><CheckCircle className="w-3 h-3" />Đã xử lý</Badge>;
    }
  };

  const canApproveOrReject = request.status === 'SUBMITTED';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-12 h-12 border-2 border-blue-200 shadow-sm">
                <AvatarImage src={learnerAvatar} alt={learnerName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                  {learnerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs"><span className="text-slate-500">Learner</span></div>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="w-12 h-12 border-2 border-purple-200 shadow-sm">
                <AvatarImage src={tutorAvatar} alt={tutorName} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold text-sm">
                  {tutorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs"><span className="text-slate-500">Tutor</span></div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-blue-600 font-medium">Learner:</span>
                  <h3 className="text-lg font-bold text-slate-900">{learnerName}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                  <User className="w-3.5 h-3.5" />
                  <span>{userInfo?.email || `ID: ${request.userId}`}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-purple-600 font-medium">Tutor:</span>
                  <span className="text-sm font-medium text-slate-700">{tutorName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-3.5 h-3.5" />
                  <span>{tutorEmail || `ID: ${request.tutorId}`}</span>
                </div>
              </div>
              {getStatusBadge(request.status)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <div className="text-sm">
                  <span className="text-slate-500">Ngày tạo: </span>
                  <span className="font-medium text-slate-700">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              {request.processedAt && (
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <div className="text-sm">
                    <span className="text-slate-500">Ngày xử lý: </span>
                    <span className="font-medium text-slate-700">{new Date(request.processedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              )}
              {request.refundType && (
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <div className="text-sm">
                    <span className="text-slate-500">Loại: </span>
                    <span className="font-medium text-slate-700">{getRefundTypeLabel(request.refundType)}</span>
                  </div>
                </div>
              )}
            </div>

            {request.refundType === 'COMPLAINT' && (
              <div className="flex flex-wrap gap-3 mb-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${request.learnerAttend ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {request.learnerAttend ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  <span>Learner: {request.learnerAttend ? 'Có tham gia' : 'Không tham gia'}</span>
                </div>
                {/* Tutor đã phản hồi nếu: có evidence HOẶC (tutorAttend có giá trị VÀ status đã chuyển sang SUBMITTED) */}
                {(() => {
                  const hasTutorEvidence = !!request.tutorEvidence;
                  // Tutor đã phản hồi thực sự khi: có evidence hoặc (tutorAttend = false và status = SUBMITTED)
                  const hasTutorResponded = hasTutorEvidence || (request.tutorAttend === false && request.status === 'SUBMITTED');
                  
                  if (request.tutorAttend === true && hasTutorEvidence) {
                    // Tutor có tham gia + có evidence
                    return (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-700">
                        <UserCheck className="w-4 h-4" />
                        <span>Tutor: Có tham gia</span>
                      </div>
                    );
                  } else if (request.tutorAttend === false && hasTutorResponded) {
                    // Tutor đồng ý hoàn tiền
                    return (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-700">
                        <UserX className="w-4 h-4" />
                        <span>Tutor: Đồng ý hoàn tiền</span>
                      </div>
                    );
                  } else {
                    // Tutor chưa phản hồi
                    return (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-slate-100 text-slate-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Tutor: Chưa phản hồi</span>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-slate-600 font-medium">Số tiền hoàn:</span>
                <span className="font-bold text-purple-900 text-xl">{request.refundAmount.toLocaleString()} đ</span>
              </div>
              {slotInfo && (
                <div className="text-xs text-slate-600 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Buổi học: {new Date(slotInfo.startTime).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' '}
                    ({new Date(slotInfo.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(slotInfo.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {request.bankAccountNumber && (
                <Dialog open={isBankInfoOpen} onOpenChange={setIsBankInfoOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 min-w-[180px] border-purple-200 text-purple-700 hover:bg-purple-50 gap-2">
                      <CreditCard className="w-4 h-4" />Xem thông tin tài khoản
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-slate-900">Thông tin tài khoản ngân hàng</DialogTitle>
                      <DialogDescription className="text-slate-600">Thông tin tài khoản để chuyển tiền hoàn</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-purple-100 rounded-lg p-2"><CreditCard className="w-5 h-5 text-purple-600" /></div>
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
                          <p className="font-mono font-semibold text-slate-900 text-lg tracking-wider">{request.bankAccountNumber}</p>
                        </div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-sm text-slate-600 mb-1">Số tiền cần chuyển:</p>
                        <p className="text-2xl font-bold text-purple-900">{request.refundAmount.toLocaleString()} đ</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {hasEvidence && (
                <Dialog open={isEvidenceOpen} onOpenChange={setIsEvidenceOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 min-w-[180px] border-orange-200 text-orange-700 hover:bg-orange-50 gap-2">
                      <Image className="w-4 h-4" />Xem bằng chứng & lý do
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-slate-900">Bằng chứng & Lý do hoàn tiền</DialogTitle>
                      <DialogDescription className="text-slate-600">Đối chiếu thông tin từ Learner và Tutor để đưa ra quyết định</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Tabs defaultValue="learner" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="learner" className="gap-2"><User className="w-4 h-4" />Learner</TabsTrigger>
                          <TabsTrigger value="tutor" className="gap-2"><User className="w-4 h-4" />Tutor</TabsTrigger>
                        </TabsList>
                        <TabsContent value="learner" className="space-y-4 mt-4">
                          {request.reason && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <h4 className="font-semibold text-blue-900">Lý do hoàn tiền</h4>
                              </div>
                              <p className="text-slate-700 whitespace-pre-wrap">{request.reason}</p>
                            </div>
                          )}
                          {request.learnerEvidence ? (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Image className="w-5 h-5 text-slate-600" />
                                <h4 className="font-semibold text-slate-900">Bằng chứng từ Learner</h4>
                              </div>
                              <img src={request.learnerEvidence} alt="Learner Evidence" className="w-full rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(request.learnerEvidence!, '_blank')} />
                              <p className="text-xs text-slate-500 mt-2 text-center">Click vào ảnh để xem kích thước đầy đủ</p>
                            </div>
                          ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                              <Image className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                              <p className="text-slate-500">Learner chưa cung cấp bằng chứng</p>
                            </div>
                          )}
                          <div className={`flex items-center gap-2 p-3 rounded-lg ${request.learnerAttend ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            {request.learnerAttend ? (<><UserCheck className="w-5 h-5 text-green-600" /><span className="text-green-700 font-medium">Learner xác nhận đã tham gia buổi học</span></>) : (<><UserX className="w-5 h-5 text-red-600" /><span className="text-red-700 font-medium">Learner xác nhận không tham gia được</span></>)}
                          </div>
                        </TabsContent>
                        <TabsContent value="tutor" className="space-y-4 mt-4">
                          {request.tutorEvidence ? (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Image className="w-5 h-5 text-slate-600" />
                                <h4 className="font-semibold text-slate-900">Bằng chứng từ Tutor</h4>
                              </div>
                              <img src={request.tutorEvidence} alt="Tutor Evidence" className="w-full rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(request.tutorEvidence!, '_blank')} />
                              <p className="text-xs text-slate-500 mt-2 text-center">Click vào ảnh để xem kích thước đầy đủ</p>
                            </div>
                          ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                              <Image className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                              <p className="text-slate-500">Tutor chưa cung cấp bằng chứng</p>
                            </div>
                          )}
                          <div className={`flex items-center gap-2 p-3 rounded-lg ${request.tutorAttend ? 'bg-green-50 border border-green-200' : request.tutorAttend === false ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200'}`}>
                            {request.tutorAttend ? (<><UserCheck className="w-5 h-5 text-green-600" /><span className="text-green-700 font-medium">Tutor xác nhận đã tham gia buổi học</span></>) : request.tutorAttend === false ? (<><UserX className="w-5 h-5 text-red-600" /><span className="text-red-700 font-medium">Tutor đồng ý hoàn tiền (không tham gia)</span></>) : (<><AlertCircle className="w-5 h-5 text-slate-500" /><span className="text-slate-600 font-medium">Tutor chưa phản hồi</span></>)}
                          </div>
                        </TabsContent>
                      </Tabs>
                      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2"><AlertCircle className="w-5 h-5" />Tóm tắt cho Admin</h4>
                        <ul className="text-sm text-amber-800 space-y-1">
                          <li>• Loại yêu cầu: <strong>{getRefundTypeLabel(request.refundType)}</strong></li>
                          <li>• Learner: {request.learnerAttend ? 'Có tham gia' : 'Không tham gia'} {request.learnerEvidence ? '(có bằng chứng)' : '(không có bằng chứng)'}</li>
                          <li>• Tutor: {(() => {
                            const hasTutorEvidence = !!request.tutorEvidence;
                            const hasTutorResponded = hasTutorEvidence || (request.tutorAttend === false && request.status === 'SUBMITTED');
                            if (request.tutorAttend === true && hasTutorEvidence) return 'Có tham gia';
                            if (request.tutorAttend === false && hasTutorResponded) return 'Đồng ý hoàn tiền';
                            return 'Chưa phản hồi';
                          })()} {request.tutorEvidence ? '(có bằng chứng)' : '(không có bằng chứng)'}</li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {canApproveOrReject && (
          <div className="flex flex-col gap-2 lg:min-w-[200px]">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white gap-2">
                  <CheckCircle className="w-4 h-4" />Hoàn thành
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận đã chuyển tiền thành công</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn xác nhận đã chuyển thành công số tiền {request.refundAmount.toLocaleString()} đ vào tài khoản ngân hàng của học viên?
                    <br /><br />
                    <strong>Thông tin chuyển khoản:</strong><br />
                    • Ngân hàng: {request.bankName}<br />
                    • Chủ TK: {request.bankOwnerName}<br />
                    • Số TK: {request.bankAccountNumber}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onApprove(request.refundRequestId)} className="bg-green-600 hover:bg-green-700">Xác nhận đã chuyển</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 gap-2">
                  <XCircle className="w-4 h-4" />Thất bại
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận chuyển tiền thất bại</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn xác nhận việc chuyển tiền hoàn không thành công? Yêu cầu hoàn tiền này sẽ bị từ chối và học viên sẽ được thông báo.
                    <br /><br />
                    Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onReject(request.refundRequestId)} className="bg-red-600 hover:bg-red-700">Xác nhận thất bại</AlertDialogAction>
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
