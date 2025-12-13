import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Languages, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { z } from "zod";
import { ROUTES } from "@/constants/routes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api, { CustomAxiosRequestConfig } from "@/config/axiosConfig";
import { getApiErrorMessage } from "@/utils/errorMessages";


const verifyEmailSchema = z.object({
  otpCode: z.string().length(6, "Mã OTP phải có 6 chữ số"),
});

type VerifyEmailForm = z.infer<typeof verifyEmailSchema>;

const VerifyEmail = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(20);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailFromParam = searchParams.get("email");
  const email =
    emailFromParam ?? 
    localStorage.getItem("temp_verify_email") ?? 
    sessionStorage.getItem("temp_verify_email") ?? 
    "";

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema),
  });

  //  countdown resend button
  useEffect(() => {
    if (emailFromParam) {
      localStorage.setItem("temp_verify_email", emailFromParam);
      sessionStorage.setItem("temp_verify_email", emailFromParam);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [emailFromParam]);

  /**  Verify OTP */
  const handleManualVerify = async (data: VerifyEmailForm) => {
    setApiError(null);
    setIsVerifying(true);

    try {
      await api.post("/auth/verify", { 
        otp: data.otpCode 
      }, {
        skipAuth: true
      } as CustomAxiosRequestConfig);

      setIsVerified(true);
      localStorage.removeItem("temp_verify_email");
      sessionStorage.removeItem("temp_verify_email");

      setTimeout(() => navigate(`${ROUTES.SIGN_IN}?verified=true`), 2000);
    } catch (error) {
      setApiError(getApiErrorMessage(error, "Xác thực OTP thất bại."));
    } finally {
      setIsVerifying(false);
    }
  };

  /**  Resend OTP  */
  const handleResendEmail = async () => {
    setResending(true);
    setResendMessage(null);

    try {
      const savedForm = localStorage.getItem("temp_signup_data");

      if (!savedForm) {
        setResendMessage("Không tìm thấy dữ liệu đăng ký. Vui lòng đăng ký lại.");
        return;
      }

      const signupData = JSON.parse(savedForm) as Record<string, unknown>;
      await api.post("/auth/register", signupData, { skipAuth: true } as CustomAxiosRequestConfig);

      setResendMessage("Mã OTP mới đã được gửi đến email của bạn.");

      // 🔥 Reset countdown sau khi BE trả về thành công
      setCountdown(20);
      setCanResend(false);
    } catch (error) {
      setResendMessage(getApiErrorMessage(error, "Gửi lại OTP thất bại."));
    } finally {
      setResending(false);
    }
  };

  /* ---------------- UI ---------------- */

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div className="max-w-md w-full space-y-8" {...fadeInUp}>
          <div className="text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900 mt-4">
              Email đã được xác thực!
            </h2>
            <p className="text-gray-600">Đang chuyển hướng đến trang đăng nhập...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <motion.div className="max-w-md w-full space-y-8" {...fadeInUp}>
        {/* header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Languages className="w-8 h-8 text-white bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg" />
            <div className="text-3xl font-bold text-gray-800">
              Lingua<span className="text-blue-500">Hub</span>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Xác thực Email để hoàn tất đăng ký
          </h2>
          <p className="text-gray-600">
            Mã OTP đã được gửi đến <strong>{email}</strong>
          </p>
        </div>

        {/* card */}
        <motion.div className="bg-white rounded-2xl shadow-xl p-8" {...fadeInUp}>
          {/*  Shield icon added */}
          <div className="flex justify-center mb-6">
            <Shield className="w-14 h-14 text-blue-500" />
          </div>

          <form onSubmit={handleSubmit(handleManualVerify)} className="space-y-4">
            <Input
              type="text"
              maxLength={6}
              {...register("otpCode", { setValueAs: (v: string) => v.replace(/\D/g, "") })}
              className="text-center text-2xl tracking-widest"
              placeholder="000000"
              disabled={isVerifying}
            />

            {formErrors.otpCode && <ErrorMessage message={formErrors.otpCode.message!} />}
            {apiError && <ErrorMessage message={apiError} />}

            <Button type="submit" className="w-full" disabled={isVerifying}>
              {isVerifying ? <LoadingSpinner size="sm" /> : "Xác thực OTP"}
            </Button>
          </form>

          {/* resend button */}
          <div className="mt-6 space-y-4 text-center">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              disabled={!canResend || resending}
            >
              {resending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {canResend ? "Gửi lại mã" : `Gửi lại sau ${countdown}s`}
                </>
              )}
            </Button>

            {resendMessage && <p className="text-sm text-green-700">{resendMessage}</p>}

            <Button asChild variant="ghost" className="w-full">
              <Link to={ROUTES.SIGN_UP}>Quay lại Đăng ký</Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
