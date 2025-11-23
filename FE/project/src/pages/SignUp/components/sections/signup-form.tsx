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

const signUpSchema = z
    .object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      fullName: z.string().min(3, "Full name is required"),
      email: z.string().email("Email is invalid"),
      phone: z
          .string()
          .min(1, "Phone number is required")
          .refine((val) => /^\d{10,}$/.test(val.replace(/\D/g, "")), {
            message: "Phone number must be at least 10 digits",
          }),
      dob: z
          .string()
          .min(1, "Date of birth is required")
          .refine(
              (val) => {
                const age =
                    (new Date().getTime() - new Date(val).getTime()) /
                    (1000 * 3600 * 24 * 365.25);
                return age >= 13;
              },
              { message: "You must be at least 13 years old" }
          ),
      gender: z.enum(["Male", "Female", "Other"]),
      password: z
          .string()
          .min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
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
      const errorMessage =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          "Signup failed";
      setApiError(errorMessage);
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Start your language learning journey today</p>
          </div>

          <motion.div className="bg-white rounded-2xl shadow-xl p-8" variants={fadeInUp} transition={{ delay: 0.1 }}>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

              {apiError && <ErrorMessage message={apiError} />}

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("username")}
                      type="text"
                      className="pl-12"
                      placeholder="Enter your username"
                      disabled={isLoading}
                  />
                </div>
                {errors.username?.message && (
                    <ErrorMessage message={errors.username.message ?? ""} />
                )}
              </div>


              {/* Full Name – tự động điền từ username nếu trống */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("fullName")}
                      className="pl-12"
                      placeholder="Enter your full name"
                      disabled={isLoading}
                  />
                </div>
                {errors.fullName?.message && (
                    <ErrorMessage message={errors.fullName.message ?? ""} />
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("email")}
                      className="pl-12"
                      placeholder="Enter your email"
                      disabled={isLoading}
                  />
                </div>
                {errors.email?.message && (
                    <ErrorMessage message={errors.email.message ?? ""} />
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("phone")}
                      className="pl-12"
                      placeholder="Enter your phone number"
                      disabled={isLoading}
                  />
                </div>
                {errors.phone?.message && (
                    <ErrorMessage message={errors.phone.message ?? ""} />
                )}
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <select
                      {...register("gender")}
                      className="block w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      disabled={isLoading}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.gender?.message && (
                    <ErrorMessage message={errors.gender.message ?? ""} />
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      className="pl-12 pr-10"
                      placeholder="Enter your password"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-6 w-6 text-gray-400" />
                  </div>
                  <Input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-12 pr-10"
                      placeholder="Re-enter your password"
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
                      <LoadingSpinner size="sm" className="mr-2" /> Creating Account...
                    </>
                ) : (
                    "Create Account"
                )}
              </Button>
            </form>
            <Button asChild variant="ghost" className="w-full mt-2">
              <Link to={ROUTES.SIGN_IN}>Back to Login</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
  );
};

export default SignUpForm;