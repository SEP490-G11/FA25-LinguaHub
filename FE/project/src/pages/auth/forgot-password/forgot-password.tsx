import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ROUTES } from '@/constants/routes.ts';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ErrorMessage } from '@/components/shared/ErrorMessage.tsx';
import api from "@/config/axiosConfig";
import { getApiErrorMessage } from "@/utils/errorMessages";

// ✅ Schema validate email
const emailVerificationSchema = z.object({
  email: z
    .string()
    .min(1, "Email là bắt buộc")
    .email("Định dạng email không hợp lệ")
    .max(100, "Email không được quá 100 ký tự"),
});
type EmailVerificationForm = z.infer<typeof emailVerificationSchema>;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<EmailVerificationForm>({
    resolver: zodResolver(emailVerificationSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: EmailVerificationForm) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: data.email,
      });
      console.log("✅ OTP sent:", response.data);
      navigate(ROUTES.VERIFY_EMAIL_FORGOT_PASSWORD, {
        state: { email: data.email },
      });
      localStorage.setItem("temp_forgot_password_email", data.email);
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err, "Gửi OTP thất bại. Vui lòng thử lại."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
            className="max-w-md w-full space-y-8"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
                <Languages className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-800">
                Lingua<span className="text-blue-500">Hub</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu?</h2>
            <p className="text-gray-600">Nhập email của bạn để nhận mã đặt lại</p>
          </div>

          {/* Form */}
          <motion.div
              className="bg-white rounded-2xl shadow-xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
          >
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {apiError && <ErrorMessage message={apiError} />}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                      id="email"
                      {...register('email')}
                      type="email"
                      required
                      autoComplete="email"
                      className="pl-10"
                      placeholder="Nhập địa chỉ email của bạn"
                      aria-invalid={errors.email ? 'true' : 'false'}
                  />
                </div>
                {errors.email && <ErrorMessage message={errors.email.message!} />}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
                {isLoading ? <LoadingSpinner size="sm" /> : 'Gửi mã xác nhận'}
              </Button>
            </form>

            {/* Back to Sign In */}
            <div className="mt-6 text-center">
              <Link
                  to={ROUTES.SIGN_IN}
                  className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại Đăng nhập</span>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
  );
};

export default ForgotPassword;
