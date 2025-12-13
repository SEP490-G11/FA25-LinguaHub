import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Phone, Languages, Calendar, UserCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/config/axiosConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/errorMessages";

/* SCHEMA – đã tối ưu */
const signUpSchema = z
    .object({
      username: z
          .string()
          .min(1, "Tên đăng nhập là bắt buộc")
          .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
      fullName: z
          .string()
          .min(1, "Họ và tên là bắt buộc"),
      email: z
          .string()
          .min(1, "Email là bắt buộc")
          .email("Email không hợp lệ"),
      phone: z
          .string()
          .min(1, "Số điện thoại là bắt buộc")
          .refine((val) => /^\d{10,}$/.test(val.replace(/\D/g, "")), {
            message: "Số điện thoại phải có ít nhất 10 chữ số",
          }),
      dob: z
          .string()
          .min(1, "Ngày sinh là bắt buộc")
          .refine(
              (val) => {
                const age =
                    (new Date().getTime() - new Date(val).getTime()) /
                    (1000 * 3600 * 24 * 365.25);
                return age >= 10;
              },
              { message: "Bạn phải ít nhất 10 tuổi" }
          ),
      gender: z.enum(["Male", "Female", "Other"]),
      password: z
          .string()
          .min(1, "Mật khẩu là bắt buộc")
          .min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
      confirmPassword: z
          .string()
          .min(1, "Vui lòng xác nhận mật khẩu"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Mật khẩu không khớp",
      path: ["confirmPassword"],
    });

type SignUpFormData = z.infer<typeof signUpSchema>;

const SignUpForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      phone: "",
      dob: "",
      gender: "Male",
      password: "",
      confirmPassword: "",
    },
  });

  const { register, handleSubmit, formState: { errors, isValid }, reset } = form;


  const onSubmit = async (data: SignUpFormData) => {
    setApiError(null);
    setIsLoading(true);

    try {
      await api.post("/auth/register", {
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        dob: data.dob,
        gender: data.gender,
        password: data.password,
      });
      localStorage.setItem("temp_signup_data", JSON.stringify(data));
      reset();
      navigate(`${ROUTES.VERIFY_EMAIL}?email=${data.email}`);
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Đăng ký thất bại"));
    } finally {
      setIsLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };




  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div className="max-w-md w-full space-y-8" {...fadeInUp}>

          {/* HEADER */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
                <Languages className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-800">
                Lingua<span className="text-blue-500">Hub</span>
              </div>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tạo tài khoản</h2>
            <p className="text-gray-600">Bắt đầu hành trình học ngôn ngữ của bạn ngay hôm nay</p>
          </div>

          <motion.div className="bg-white rounded-2xl shadow-xl p-8" variants={fadeInUp} transition={{ delay: 0.1 }}>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

              {apiError && <ErrorMessage message={apiError} />}

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("username")}
                      type="text"
                      className="pl-12"
                      placeholder="Nhập tên đăng nhập"
                      disabled={isLoading}
                  />
                </div>
                {errors.username?.message && (
                    <ErrorMessage message={errors.username.message ?? ""} />
                )}
              </div>


              {/* Full Name – tự động điền từ username nếu trống */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("fullName")}
                      className="pl-12"
                      placeholder="Nhập họ và tên"
                      disabled={isLoading}
                  />
                </div>
                {errors.fullName?.message && (
                    <ErrorMessage message={errors.fullName.message ?? ""} />
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("email")}
                      className="pl-12"
                      placeholder="Nhập email của bạn"
                      disabled={isLoading}
                  />
                </div>
                {errors.email?.message && (
                    <ErrorMessage message={errors.email.message ?? ""} />
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("phone")}
                      className="pl-12"
                      placeholder="Nhập số điện thoại"
                      disabled={isLoading}
                  />
                </div>
                {errors.phone?.message && (
                    <ErrorMessage message={errors.phone.message ?? ""} />
                )}
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("dob")}
                      type="date"
                      className="pl-12"
                      disabled={isLoading}
                  />
                </div>
                {errors.dob?.message && (
                    <ErrorMessage message={errors.dob.message ?? ""} />
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <select
                      {...register("gender")}
                      className="block w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      disabled={isLoading}
                  >
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>
                {errors.gender?.message && (
                    <ErrorMessage message={errors.gender.message ?? ""} />
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      className="pl-12 pr-10"
                      placeholder="Nhập mật khẩu"
                      disabled={isLoading}
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password?.message && (
                    <ErrorMessage message={errors.password.message ?? ""} />
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-12 pr-10"
                      placeholder="Nhập lại mật khẩu"
                      disabled={isLoading}
                  />
                  <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword?.message && (
                    <ErrorMessage message={errors.confirmPassword.message ?? ""} />
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={!isValid || isLoading}>
                {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" /> Đang tạo tài khoản...
                    </>
                ) : (
                    "Tạo tài khoản"
                )}
              </Button>
            </form>
            <Button asChild variant="ghost" className="w-full mt-2">
              <Link to={ROUTES.SIGN_IN}>Quay lại Đăng nhập</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
  );
};

export default SignUpForm;