import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Save, CheckCircle, Lock, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import api from "@/config/axiosConfig"; // axios with token interceptor
import { useToast } from "@/components/ui/use-toast";
import { getApiErrorMessage } from "@/utils/errorMessages";

//  Validation schema
const changePasswordSchema = z
    .object({
      oldPassword: z.string().min(8, "Mật khẩu hiện tại phải có ít nhất 8 ký tự"),
      newPassword: z
          .string()
          .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Mật khẩu không khớp",
      path: ["confirmPassword"],
    });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const ChangePasswordForm = () => {
  const { toast } = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });

  const newPasswordValue = watch("newPassword");
  const confirmPasswordValue = watch("confirmPassword");
  
  // Password strength calculator - simplified (only length matters)
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };
    
    const length = password.length;
    
    if (length < 8) return { strength: 0, label: "Quá ngắn", color: "text-red-600 bg-red-100" };
    if (length < 12) return { strength: 1, label: "Đủ dùng", color: "text-yellow-600 bg-yellow-100" };
    if (length < 16) return { strength: 2, label: "Tốt", color: "text-green-600 bg-green-100" };
    return { strength: 3, label: "Rất mạnh", color: "text-green-700 bg-green-200" };
  };
  
  const passwordStrength = getPasswordStrength(newPasswordValue || "");

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await api.post("/users/change-password", {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      setSuccess(true);
      reset();
      
      toast({
        title: "Thành công!",
        description: "Mật khẩu của bạn đã được thay đổi.",
        variant: "default",
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, "Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại của bạn.");
      
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
      
      console.error("Error changing password:", err);
    }
  };

  return (
      <Card className="p-8 shadow-lg">
        {success && (
            <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl flex items-center space-x-3 shadow-md animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-green-900 font-semibold">Đổi mật khẩu thành công!</p>
                <p className="text-sm text-green-700">Mật khẩu của bạn đã được cập nhật an toàn.</p>
              </div>
            </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Security Notice */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Bảo mật tài khoản</p>
              <p className="text-blue-700">Mật khẩu phải có ít nhất 8 ký tự. Để tăng cường bảo mật, nên sử dụng mật khẩu dài hơn (12-16 ký tự).</p>
            </div>
          </div>

          {/* Current Password */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-600" />
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                  {...register("oldPassword")}
                  type={showCurrent ? "text" : "password"}
                  placeholder="Nhập mật khẩu hiện tại của bạn"
                  className="pr-12 h-12 text-base"
              />
              <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.oldPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.oldPassword.message}
                </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-100"></div>

          {/* New Password */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-600" />
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                  {...register("newPassword")}
                  type={showNew ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới"
                  className="pr-12 h-12 text-base"
              />
              <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.newPassword.message}
                </p>
            )}

            {/* Password Strength Indicator */}
            {newPasswordValue && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">Độ mạnh mật khẩu:</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.strength === 0 ? 'bg-red-500' : 
                      passwordStrength.strength === 1 ? 'bg-yellow-500' : 
                      passwordStrength.strength === 2 ? 'bg-green-500' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${passwordStrength.strength === 0 ? 25 : (passwordStrength.strength / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Password Requirements - Simplified */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Yêu cầu mật khẩu:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className={newPasswordValue?.length >= 8 ? "text-green-600 font-bold" : "text-gray-400"}>
                    {newPasswordValue?.length >= 8 ? "✓" : "○"}
                  </span>
                  <span className={newPasswordValue?.length >= 8 ? "text-green-700 font-medium" : ""}>
                    Ít nhất 8 ký tự {newPasswordValue ? `(${newPasswordValue.length}/8)` : ""}
                  </span>
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-2 italic">
                💡 Gợi ý: Mật khẩu dài hơn sẽ an toàn hơn (12-16 ký tự)
              </p>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-600" />
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                  {...register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`pr-12 h-12 text-base ${
                      confirmPasswordValue && confirmPasswordValue !== newPasswordValue
                          ? "border-red-500 focus:ring-red-500"
                          : confirmPasswordValue && confirmPasswordValue === newPasswordValue
                          ? "border-green-500 focus:ring-green-500"
                          : ""
                  }`}
              />
              <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword.message}
                </p>
            )}
            {confirmPasswordValue && confirmPasswordValue === newPasswordValue && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Mật khẩu khớp!
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => reset()}
              className="px-6 py-2 border-2 hover:bg-gray-50"
            >
              Đặt lại
            </Button>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Save className="animate-spin w-4 h-4 mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu mật khẩu mới
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
  );
};
