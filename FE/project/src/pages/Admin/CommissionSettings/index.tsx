import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, AlertCircle, Loader2, Save, Percent } from 'lucide-react';
import { commissionSettingsApi } from './api';
import { CommissionFormData } from './types';
import { toast } from 'sonner';


export default function CommissionSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CommissionFormData>({
    commissionCourse: 10,
    commissionBooking: 10,
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CommissionFormData, string>>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await commissionSettingsApi.getSettings();
      setFormData({
        commissionCourse: data.commissionCourse,
        commissionBooking: data.commissionBooking,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CommissionFormData, string>> = {};

    if (formData.commissionCourse < 0 || formData.commissionCourse > 100) {
      errors.commissionCourse = 'Hoa hồng phải từ 0% đến 100%';
    }

    if (formData.commissionBooking < 0 || formData.commissionBooking > 100) {
      errors.commissionBooking = 'Hoa hồng phải từ 0% đến 100%';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof CommissionFormData, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      await commissionSettingsApi.updateSettings(formData);
      toast.success('Cập nhật cài đặt hoa hồng thành công!');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div>
        <div className="bg-gradient-to-r from-purple-600 via-purple-600 to-purple-500">
          <div className="max-w-4xl mx-auto px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Cài đặt hoa hồng</h1>
                <p className="text-purple-100 text-sm">Quản lý phần trăm hoa hồng nền tảng</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Đang tải cài đặt...</p>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Phần trăm hoa hồng
              </CardTitle>
              <CardDescription>
                Cài đặt phần trăm hoa hồng mà nền tảng nhận từ các giao dịch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="commissionCourse">
                      Hoa hồng khóa học (%) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="commissionCourse"
                        type="number"
                        placeholder="0"
                        value={formData.commissionCourse}
                        onChange={(e) =>
                          handleInputChange('commissionCourse', parseFloat(e.target.value) || 0)
                        }
                        className={formErrors.commissionCourse ? 'border-red-500' : ''}
                        min={0}
                        max={100}
                        step={0.1}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        %
                      </div>
                    </div>
                    {formErrors.commissionCourse && (
                      <p className="text-sm text-red-500">{formErrors.commissionCourse}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Phần trăm hoa hồng từ các giao dịch mua khóa học
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commissionBooking">
                      Hoa hồng đặt lịch (%) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="commissionBooking"
                        type="number"
                        placeholder="0"
                        value={formData.commissionBooking}
                        onChange={(e) =>
                          handleInputChange('commissionBooking', parseFloat(e.target.value) || 0)
                        }
                        className={formErrors.commissionBooking ? 'border-red-500' : ''}
                        min={0}
                        max={100}
                        step={0.1}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        %
                      </div>
                    </div>
                    {formErrors.commissionBooking && (
                      <p className="text-sm text-red-500">{formErrors.commissionBooking}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Phần trăm hoa hồng từ các giao dịch đặt lịch học
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Ví dụ:</h4>
                  <ul className="text-sm text-purple-800 space-y-2">
                    <li>
                      • Khóa học giá 1.000.000 ₫ với hoa hồng {formData.commissionCourse}%:
                      <br />
                      <span className="ml-4">
                        - Nền tảng nhận:{' '}
                        <strong>
                          {(1000000 * formData.commissionCourse / 100).toLocaleString('vi-VN')} ₫
                        </strong>
                      </span>
                      <br />
                      <span className="ml-4">
                        - Giảng viên nhận:{' '}
                        <strong>
                          {(1000000 * (100 - formData.commissionCourse) / 100).toLocaleString('vi-VN')} ₫
                        </strong>
                      </span>
                    </li>
                    <li>
                      • Đặt lịch giá 500.000 ₫ với hoa hồng {formData.commissionBooking}%:
                      <br />
                      <span className="ml-4">
                        - Nền tảng nhận:{' '}
                        <strong>
                          {(500000 * formData.commissionBooking / 100).toLocaleString('vi-VN')} ₫
                        </strong>
                      </span>
                      <br />
                      <span className="ml-4">
                        - Giảng viên nhận:{' '}
                        <strong>
                          {(500000 * (100 - formData.commissionBooking) / 100).toLocaleString('vi-VN')} ₫
                        </strong>
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
