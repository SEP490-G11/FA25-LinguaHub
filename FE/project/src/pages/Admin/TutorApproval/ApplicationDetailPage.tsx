import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Languages,
  Briefcase,
  Award,
  FileText,
  ExternalLink,
  Calendar,
  Mail,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Phone,
  Globe,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tutorApprovalApi } from './api';
import { Application } from './types';
import { ROUTES } from '@/constants/routes';
import { processHtmlContent, proseClasses, quillViewerStyles } from '@/utils/textUtils';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch application detail
  const {
    data: application,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tutor-application', id],
    queryFn: () => tutorApprovalApi.getApplicationById(id!),
    enabled: !!id,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: () => tutorApprovalApi.approveApplication(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-applications'] });
      queryClient.invalidateQueries({ queryKey: ['tutor-application', id] });
      setSuccessMessage('✅ Đã phê duyệt đơn đăng ký thành công!');
      setTimeout(() => {
        navigate(ROUTES.ADMIN_TUTOR_APPROVAL);
      }, 2000);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || 'Không thể phê duyệt đơn đăng ký');
      setTimeout(() => setErrorMessage(null), 4000);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (reason: string) => tutorApprovalApi.rejectApplication(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-applications'] });
      queryClient.invalidateQueries({ queryKey: ['tutor-application', id] });
      setSuccessMessage('✅ Đã từ chối đơn đăng ký thành công!');
      setTimeout(() => {
        navigate(ROUTES.ADMIN_TUTOR_APPROVAL);
      }, 2000);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || 'Không thể từ chối đơn đăng ký');
      setTimeout(() => setErrorMessage(null), 4000);
    },
  });

  const handleApprove = () => {
    if (window.confirm('Bạn có chắc chắn muốn phê duyệt đơn đăng ký này?')) {
      approveMutation.mutate();
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do từ chối');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    if (window.confirm('Bạn có chắc chắn muốn từ chối đơn đăng ký này?')) {
      rejectMutation.mutate(rejectionReason);
    }
  };

  const getStatusBadge = (status: Application['status']) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
    };

    const labels = {
      pending: 'Đang chờ',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
    };

    return (
      <Badge className={`${variants[status]} text-sm px-3 py-1 border`}>
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Đang tải thông tin đơn đăng ký...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lỗi tải đơn đăng ký</h3>
              <p className="text-gray-600 mb-4">
                {(error as Error)?.message || 'Không tìm thấy đơn đăng ký'}
              </p>
              <Button onClick={() => navigate(ROUTES.ADMIN_TUTOR_APPROVAL)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại danh sách
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProcessing = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-600 to-purple-500 text-white py-8 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.ADMIN_TUTOR_APPROVAL)}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Chi tiết đơn đăng ký</h1>
              <p className="text-purple-100 text-lg">Xem xét thông tin đăng ký làm gia sư</p>
            </div>
            {getStatusBadge(application.status)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top shadow-md">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 justify-between animate-in fade-in slide-in-from-top shadow-sm">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="flex-shrink-0 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Information */}
            <Card className="shadow-lg border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <CardTitle className="flex items-center text-purple-900">
                  <User className="w-5 h-5 mr-2" />
                  Thông tin người đăng ký
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Họ và tên</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {application.applicantName}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {application.applicantEmail}
                    </p>
                  </div>

                  {application.userPhone && (
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Số điện thoại</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {application.userPhone}
                      </p>
                    </div>
                  )}

                  {application.country && (
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <Globe className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Quốc gia</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {application.country}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Ngày đăng ký</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(application.appliedDate)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Kinh nghiệm</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {application.experience} năm
                    </p>
                  </div>

                  {application.pricePerHour && application.pricePerHour > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Giá mỗi giờ</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        ${application.pricePerHour}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Teaching Information */}
            <Card className="shadow-lg border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <CardTitle className="flex items-center text-purple-900">
                  <Languages className="w-5 h-5 mr-2" />
                  Thông tin giảng dạy
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center">
                    <Languages className="h-4 w-4 mr-2" />
                    Ngôn ngữ giảng dạy
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {application.teachingLanguages.map((lang, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-sm px-3 py-1 bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    Chuyên môn
                  </Label>
                  <p className="text-base text-gray-900 font-medium">
                    {application.specialization}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Giới thiệu
                  </Label>
                  <style>{quillViewerStyles}</style>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div 
                      className={proseClasses}
                      dangerouslySetInnerHTML={{ __html: processHtmlContent(application.bio) }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificates */}
            {application.certificates && application.certificates.length > 0 && (
              <Card className="shadow-lg border-purple-100">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                  <CardTitle className="flex items-center text-purple-900">
                    <Award className="w-5 h-5 mr-2" />
                    Chứng chỉ
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {application.certificates.map((cert, index) => (
                      <div
                        key={cert.certificateId}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-2">
                              {cert.certificateName}
                            </p>
                            <a
                              href={cert.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors text-sm"
                            >
                              Xem chứng chỉ
                              <ExternalLink className="h-4 w-4 ml-1" />
                            </a>
                          </div>
                          <Badge variant="outline" className="ml-4">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Panel - Right Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {application.status === 'pending' && (
                <Card className="shadow-lg border-purple-200">
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-500 text-white">
                    <CardTitle className="text-lg">Hành động xét duyệt</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {!showRejectForm ? (
                      <>
                        <Button
                          onClick={handleApprove}
                          disabled={isProcessing}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
                        >
                          {approveMutation.isPending ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Đang phê duyệt...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Phê duyệt đơn đăng ký
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => setShowRejectForm(true)}
                          disabled={isProcessing}
                          variant="destructive"
                          className="w-full font-semibold py-6 text-lg"
                        >
                          <XCircle className="w-5 h-5 mr-2" />
                          Từ chối đơn đăng ký
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="rejectionReason" className="text-red-700 font-semibold">
                            Lý do từ chối *
                          </Label>
                          <Textarea
                            id="rejectionReason"
                            placeholder="Vui lòng nhập lý do từ chối chi tiết..."
                            rows={6}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="resize-none border-red-300 focus:border-red-500 focus:ring-red-500"
                            disabled={isProcessing}
                          />
                          <p className="text-xs text-gray-600">
                            Lý do này sẽ được gửi cho người đăng ký
                          </p>
                        </div>

                        <Button
                          onClick={handleReject}
                          disabled={isProcessing || !rejectionReason.trim()}
                          variant="destructive"
                          className="w-full font-semibold py-6"
                        >
                          {rejectMutation.isPending ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Đang từ chối...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 mr-2" />
                              Xác nhận từ chối
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectionReason('');
                          }}
                          disabled={isProcessing}
                          variant="outline"
                          className="w-full"
                        >
                          Hủy
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {application.status !== 'pending' && (
                <Card className="shadow-xl border-0 overflow-hidden">
                  <CardHeader className={`${
                    application.status === 'approved' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-red-500 to-rose-500'
                  } text-white py-6`}>
                    <CardTitle className="text-xl font-bold text-center">
                      Trạng thái đơn đăng ký
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 pb-8 px-6">
                    <div className="space-y-6">
                      {/* Review Time Box */}
                      <div className={`${
                        application.status === 'approved'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      } rounded-xl p-6 border-2`}>
                        {application.reviewedAt && (
                          <div className="flex items-center gap-3 text-gray-700">
                            <Calendar className="w-5 h-5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                {application.status === 'approved' ? 'Phê duyệt vào' : 'Xét duyệt vào'}
                              </p>
                              <p className="text-base font-semibold text-gray-900">
                                {formatDate(application.reviewedAt)}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Reviewer - Only for approved */}
                        {application.status === 'approved' && application.reviewedBy && (
                          <div className="flex items-center gap-3 text-gray-700 mt-4 pt-4 border-t border-green-200">
                            <User className="w-5 h-5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Người phê duyệt</p>
                              <p className="text-base font-semibold text-gray-900">{application.reviewedBy}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Rejection Reason - Only for rejected */}
                      {application.status === 'rejected' && application.reasonForReject && (
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-6 shadow-md">
                          <div className="flex items-start gap-3 mb-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-base font-bold text-red-800">
                              Lý do từ chối:
                            </p>
                          </div>
                          <p className="text-sm text-red-900 leading-relaxed whitespace-pre-wrap">
                            {application.reasonForReject}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
