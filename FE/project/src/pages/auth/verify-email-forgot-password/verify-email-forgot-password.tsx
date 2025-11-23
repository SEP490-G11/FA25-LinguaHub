import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Languages, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { z } from "zod";
import { ROUTES } from "@/constants/routes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api, { CustomAxiosRequestConfig } from "@/config/axiosConfig";
import { AxiosError } from "axios";

//  Validate OTP
const verifyEmailSchema = z.object({
  otpCode: z.string().length(6, "OTP code must be 6 digits"),
});
type VerifyEmailForm = z.infer<typeof verifyEmailSchema>;

const VerifyEmailForgotPassword = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailFromParam = searchParams.get("email");
  const email =
      emailFromParam ?? localStorage.getItem("temp_forgot_password_email") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema),
  });

  //  Countdown resend OTP
  useEffect(() => {
    if (emailFromParam) {
      localStorage.setItem("temp_forgot_password_email", emailFromParam);
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown, emailFromParam]);

  const handleManualVerify = async (data: VerifyEmailForm) => {
    setIsVerifying(true);
    setApiError(null);

    try {
      await api.post("/auth/verify-reset-otp", { otp: data.otpCode }, { skipAuth: true } as CustomAxiosRequestConfig);

      localStorage.removeItem("temp_forgot_password_email");
      setTimeout(() => navigate(ROUTES.RESET_PASSWORD), 0);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      setApiError(error.response?.data?.message ?? "Invalid OTP");
    } finally {
      setIsVerifying(false);
    }
  };


  /**  Resend OTP */
  const handleResendOtp = async () => {
    setApiError(null);
    setResendMessage(null);
    setResending(true);

    try {
      await api.post("/auth/forgot-password", { email }, { skipAuth: true } as CustomAxiosRequestConfig);
      setCountdown(20);
      setCanResend(false);
      setResendMessage(" A new OTP has been sent to your email.");
    } catch {
      setResendMessage(" Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
                <Languages className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-800">
                Lingua<span className="text-blue-500">Hub</span>
              </div>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900">Verify OTP</h2>
            <p className="text-gray-600">
              Enter the OTP sent to <strong>{email}</strong>
            </p>
          </div>

          {/* CARD */}
          <motion.div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />

              <form onSubmit={handleSubmit(handleManualVerify)} className="space-y-4">
                <Input
                    type="text"
                    maxLength={6}
                    {...register("otpCode", { setValueAs: (v) => v.replace(/\D/g, "") })}
                    className="text-center text-2xl tracking-widest"
                    placeholder="000000"
                    disabled={isVerifying}
                />
                {formErrors.otpCode?.message && (
                    <ErrorMessage message={formErrors.otpCode.message} />
                )}
                {apiError && <ErrorMessage message={apiError} />}
                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? (
                      <div className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        Verifying...
                      </div>
                  ) : (
                      "Verify OTP"
                  )}
                </Button>
              </form>
            </div>

            {/* Resend OTP */}
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-500">Didn't receive the code?</p>

              <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendOtp}
                  disabled={!canResend || resending}
              >
                {resending ? (
                    <LoadingSpinner size="sm" />
                ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {canResend ? "Resend OTP" : `Resend in ${countdown}s`}
                    </>
                )}
              </Button>

              {resendMessage && <p className="text-sm text-green-700">{resendMessage}</p>}

              <Button asChild variant="ghost" className="w-full">
                <Link to={ROUTES.FORGOT_PASSWORD}>Back to Forgot Password</Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
  );
};

export default VerifyEmailForgotPassword;
