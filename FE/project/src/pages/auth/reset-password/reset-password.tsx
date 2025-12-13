import  { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Languages, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/config/axiosConfig";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/errorMessages";

//  Validate theo BE
const resetPasswordSchema = z
    .object({
      newPassword: z
        .string()
        .min(1, "Mật khẩu là bắt buộc")
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
      confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Mật khẩu không khớp",
      path: ["confirmPassword"],
    });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const onSubmitResetPassword = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await api.post("/auth/set-new-password", data);

      if (response.data.code !== 0) {
        setApiError(response.data.message ?? "Đặt lại mật khẩu thất bại");
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate(ROUTES.SIGN_IN), 2000);
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err, "Đặt lại mật khẩu thất bại"));
    } finally {
      setIsLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  //  UI báo thành công — giữ nguyên
  if (success) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <motion.div className="max-w-md w-full space-y-8" initial="initial" animate="animate" variants={fadeInUp}>
            <div className="text-center">
              <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
                  <Languages className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  Lingua<span className="text-blue-500">Hub</span>
                </div>
              </Link>
            </div>

            <motion.div className="bg-white rounded-2xl shadow-xl p-8 text-center" variants={fadeInUp}>
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Cập nhật mật khẩu thành công!
                </h2>
                <p className="text-gray-600">Đang chuyển hướng đến trang đăng nhập...</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
    );
  }

  //  Form chính — UI giữ nguyên
  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div className="max-w-md w-full space-y-8" initial="initial" animate="animate" variants={fadeInUp}>
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
                <Languages className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-800">
                Lingua<span className="text-blue-500">Hub</span>
              </div>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu</h2>
            <p className="text-gray-600">Nhập và xác nhận mật khẩu mới của bạn bên dưới.</p>
          </div>

          <motion.div className="bg-white rounded-2xl shadow-xl p-8" variants={fadeInUp}>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmitResetPassword)}>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

                  <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      {...register("newPassword")}
                      placeholder="Nhập mật khẩu mới"
                      className="pl-10 pr-10"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.newPassword?.message && (
                    <ErrorMessage message={errors.newPassword.message} />
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      placeholder="Xác nhận mật khẩu mới"
                      className="pl-10 pr-10"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.confirmPassword?.message && (
                    <ErrorMessage message={errors.confirmPassword.message} />
                )}
              </div>

              {/* Show API error */}
              {apiError && <ErrorMessage message={apiError} />}

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
                {isLoading ? <LoadingSpinner size="sm" /> : "Cập nhật mật khẩu"}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </div>
  );
};

export default ResetPassword;
