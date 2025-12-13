/**
 * Withdrawal Page - Tutor Withdrawal Request
 * 
 * Migration Notes:
 * - Migrated to use StandardPageHeading with blue-indigo gradient
 * - Kept existing balance card with gradient design (already well-designed)
 * - All functionality preserved: form validation, submission, modal
 * 
 * @see .kiro/specs/tutor-pages-migration/design.md
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { withdrawalApi } from './api';
import { WithdrawalFormData, WithdrawalRequestPayload, WithdrawalResponse } from './types';
import { getApiErrorMessage } from '@/utils/errorMessages';
import { formatCurrency } from '../Payment/utils';
import { toast } from 'sonner';
import { getTutorIdFromToken } from '@/utils/jwt-decode';
import WithdrawalModal from './WithdrawalModal';

import { StandardPageHeading } from '@/components/shared/StandardPageHeading';

export default function WithdrawalPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tutorIdError, setTutorIdError] = useState<string | null>(null);

  const [formData, setFormData] = useState<WithdrawalFormData>({
    bankName: '',
    bankAccountNumber: '',
    bankOwnerName: '',
    withdrawAmount: 0,
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof WithdrawalFormData, string>>>({});

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    data?: WithdrawalResponse;
    errorMessage?: string;
  }>({
    isOpen: false,
    type: 'success',
  });

  useEffect(() => {
    // Validate JWT token on component mount
    const tutorId = getTutorIdFromToken();
    if (!tutorId) {
      setTutorIdError('Không tìm thấy thông tin tutor. Vui lòng đăng nhập lại.');
    }
    
    fetchTotalEarnings();
  }, []);

  const fetchTotalEarnings = async () => {
    try {
      setIsLoadingEarnings(true);
      const balance = await withdrawalApi.getBalance();
      setTotalEarnings(balance);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingEarnings(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof WithdrawalFormData, string>> = {};

    if (!formData.bankName.trim()) {
      errors.bankName = 'Vui lòng nhập tên ngân hàng';
    }

    if (!formData.bankAccountNumber.trim()) {
      errors.bankAccountNumber = 'Vui lòng nhập số tài khoản';
    } else if (!/^\d+$/.test(formData.bankAccountNumber)) {
      errors.bankAccountNumber = 'Số tài khoản chỉ được chứa số';
    }

    if (!formData.bankOwnerName.trim()) {
      errors.bankOwnerName = 'Vui lòng nhập tên chủ tài khoản';
    }

    if (formData.withdrawAmount <= 0) {
      errors.withdrawAmount = 'Số tiền phải lớn hơn 0';
    } else if (formData.withdrawAmount > totalEarnings) {
      errors.withdrawAmount = `Số tiền không được vượt quá ${formatCurrency(totalEarnings)}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof WithdrawalFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const openSuccessModal = (data: WithdrawalResponse) => {
    setModalState({
      isOpen: true,
      type: 'success',
      data,
    });
  };

  const openErrorModal = (errorMessage: string) => {
    setModalState({
      isOpen: true,
      type: 'error',
      errorMessage,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: 'success',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Transform form data to API payload structure
      const payload: WithdrawalRequestPayload = {
        withdrawAmount: formData.withdrawAmount,
        bankAccountNumber: formData.bankAccountNumber,
        bankName: formData.bankName,
        bankOwnerName: formData.bankOwnerName,
      };

      const response = await withdrawalApi.createWithdrawal(payload);
      
      // Show success modal with response data
      openSuccessModal(response);
      toast.success('Yêu cầu rút tiền đã được gửi thành công!');
    } catch (err: any) {
      // Extract error message using getApiErrorMessage
      const errorMessage = getApiErrorMessage(err, 'Đã xảy ra lỗi. Vui lòng thử lại.');
      
      // Show error modal
      openErrorModal(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <WithdrawalModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        data={modalState.data}
        errorMessage={modalState.errorMessage}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Migrated to StandardPageHeading with blue-indigo gradient */}
        <StandardPageHeading
          title="Rút tiền"
          description="Gửi yêu cầu rút tiền từ thu nhập của bạn"
          icon={DollarSign}
          gradientFrom="from-blue-600"
          gradientVia="via-indigo-600"
          gradientTo="to-indigo-600"
        />
        
        <div className="max-w-3xl mx-auto px-6 py-8">

          <div className="grid gap-6">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                Số dư khả dụng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEarnings ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tải...</span>
                </div>
              ) : (
                <div className="text-4xl font-bold">{formatCurrency(totalEarnings)}</div>
              )}
            </CardContent>
          </Card>

          {tutorIdError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{tutorIdError}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Thông tin rút tiền
              </CardTitle>
              <CardDescription>
                Vui lòng điền đầy đủ thông tin tài khoản ngân hàng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bankName">
                    Tên ngân hàng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bankName"
                    placeholder="VD: Vietcombank, Techcombank, MB Bank..."
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className={formErrors.bankName ? 'border-red-500' : ''}
                  />
                  {formErrors.bankName && (
                    <p className="text-sm text-red-500">{formErrors.bankName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">
                    Số tài khoản <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bankAccountNumber"
                    placeholder="Nhập số tài khoản ngân hàng"
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                    className={formErrors.bankAccountNumber ? 'border-red-500' : ''}
                  />
                  {formErrors.bankAccountNumber && (
                    <p className="text-sm text-red-500">{formErrors.bankAccountNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankOwnerName">
                    Tên chủ tài khoản <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bankOwnerName"
                    placeholder="Nhập tên chủ tài khoản"
                    value={formData.bankOwnerName}
                    onChange={(e) => handleInputChange('bankOwnerName', e.target.value)}
                    className={formErrors.bankOwnerName ? 'border-red-500' : ''}
                  />
                  {formErrors.bankOwnerName && (
                    <p className="text-sm text-red-500">{formErrors.bankOwnerName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount">
                    Số tiền muốn rút <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="withdrawAmount"
                      type="number"
                      placeholder="0"
                      value={formData.withdrawAmount || ''}
                      onChange={(e) => handleInputChange('withdrawAmount', parseFloat(e.target.value) || 0)}
                      className={formErrors.withdrawAmount ? 'border-red-500' : ''}
                      min={0}
                      max={totalEarnings}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      ₫
                    </div>
                  </div>
                  {formErrors.withdrawAmount && (
                    <p className="text-sm text-red-500">{formErrors.withdrawAmount}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Số tiền tối đa: {formatCurrency(totalEarnings)}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Lưu ý:</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Yêu cầu rút tiền sẽ được xử lý trong vòng 3-5 ngày làm việc</li>
                    <li>Vui lòng kiểm tra kỹ thông tin tài khoản trước khi gửi</li>
                    <li>Bạn có thể theo dõi trạng thái yêu cầu trong trang thanh toán</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  
                  <Button
                    type="submit"
                    disabled={isLoading || isLoadingEarnings || totalEarnings <= 0 || !!tutorIdError}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        Gửi 
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </>
  );
}
