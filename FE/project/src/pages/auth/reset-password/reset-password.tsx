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
import api, { CustomAxiosRequestConfig } from "@/config/axiosConfig";
import { ROUTES } from "@/constants/routes";

//  Validate theo BE
const resetPasswordSchema = z
    .object({
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string().min(8, "Please confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
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
      const response = await api.post("/auth/set-new-password", data, { skipAuth: true } as CustomAxiosRequestConfig);

      if (response.data.code !== 0) {
        setApiError(response.data.message ?? "Reset password failed");
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate(ROUTES.SIGN_IN), 2000);
    }  catch (err: unknown) {
    if (err && typeof err === "object" && "response" in err) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };

      setApiError(axiosErr.response?.data?.message ?? null);
    } else if (err instanceof Error) {
      setApiError(err.message);
    } else {
      setApiError("Something went wrong");
    }
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
                  Password updated successfully!
                </h2>
                <p className="text-gray-600">Redirecting to sign-in page...</p>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-600">Enter and confirm your new password below.</p>
          </div>

          <motion.div className="bg-white rounded-2xl shadow-xl p-8" variants={fadeInUp}>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmitResetPassword)}>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

                  <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      {...register("newPassword")}
                      placeholder="Enter new password"
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
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      placeholder="Confirm new password"
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
                {isLoading ? <LoadingSpinner size="sm" /> : "Update Password"}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </div>
  );
};

export default ResetPassword;
