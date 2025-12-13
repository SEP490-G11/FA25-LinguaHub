import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/config/axiosConfig";
import { Camera, Save, User, Mail, Phone, Calendar, MapPin, Globe, FileText, Edit, Loader2, Award, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";
import { uploadFileToBackend } from "@/utils/fileUpload";
import { getTutorIdFromToken } from "@/utils/jwt-decode";

interface TutorCertificate {
  certificateId: number;
  certificateName: string;
  documentUrl: string;
}

// ================== VALIDATION ==================
const profileSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Định dạng email không hợp lệ"),
  phone: z.string().min(9, "Số điện thoại không hợp lệ"),
  dob: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

// ==================================================

export const ProfileForm = () => {
  const { toast } = useToast();
  const { user, refreshUser } = useUser();
  const [userId, setUserId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [gender, setGender] = useState<string>("Male"); // State riêng cho gender (chỉ hiển thị)
  const [fullName, setFullName] = useState<string>(""); // State để lưu fullName cho fallback avatar
  const [avatarError, setAvatarError] = useState(false); // Track if avatar failed to load
  const [certificates, setCertificates] = useState<TutorCertificate[]>([]); // Chứng chỉ của tutor
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [selectedCertIndex, setSelectedCertIndex] = useState<number | null>(null); // Index của chứng chỉ đang xem trong modal
  const [certPage, setCertPage] = useState(0); // Trang hiện tại của danh sách chứng chỉ
  const CERTS_PER_PAGE = 4; // Số chứng chỉ mỗi trang

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // =============== Fetch user info ==================
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await api.get("/users/myInfo");

        const userData = res.data.result;
        setUserId(userData.userID);
        setAvatarPreview(userData.avatarURL);
        setFullName(userData.fullName || "");
        setAvatarError(!userData.avatarURL); // Set error if no avatar
        setGender(userData.gender || "Male"); // Lưu gender vào state riêng

        reset({
          username: userData.username,
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          dob: userData.dob,
          country: userData.country,
          address: userData.address,
          bio: userData.bio,
        });
      } catch (error) {
        console.error(" Failed to fetch user info:", error);
      }
    };

    fetchUserInfo();
  }, [reset]);

  // Fetch certificates nếu là Tutor
  useEffect(() => {
    const fetchCertificates = async () => {
      if (user?.role !== "Tutor") return;
      
      const tutorId = getTutorIdFromToken();
      if (!tutorId) return;

      setLoadingCertificates(true);
      try {
        const res = await api.get(`/tutors/${tutorId}`, { skipAuth: true });
        const tutorData = res.data;
        setCertificates(tutorData.certificates || []);
      } catch (error) {
        console.error("Failed to fetch tutor certificates:", error);
      } finally {
        setLoadingCertificates(false);
      }
    };

    fetchCertificates();
  }, [user?.role]);

  // ================== Update profile ==================
  const onSubmit = async (data: ProfileFormData) => {
    if (!userId) return;
    setLoading(true);

    try {
      // CHỉ gửi các field được backend cho phép update
      const allowedFields: (keyof ProfileFormData)[] = [
        "fullName",
        "country",
        "address",
        "phone",
        "bio",
        "dob",
      ];

      const payload: Partial<ProfileFormData> & { avatarURL?: string } = {};

      allowedFields.forEach((key) => {
        if (data[key] !== undefined) {
          payload[key] = data[key];
        }
      });

      // Thêm avatar nếu có thay đổi
      if (newAvatarUrl) {
        payload.avatarURL = newAvatarUrl;
      }

      const res = await api.patch(`/users/${userId}`, payload);
      const updatedUser = res.data;

      reset({
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        dob: updatedUser.dob,
        country: updatedUser.country,
        address: updatedUser.address,
        bio: updatedUser.bio,
      });

      setIsEditing(false);
      setNewAvatarUrl(null); // Reset avatar mới sau khi lưu thành công
      setAvatarPreview(updatedUser.avatarURL); // Cập nhật avatar từ server
      
      // Refresh user context để update header
      await refreshUser();
      
      toast({
        title: "Thành công!",
        description: "Cập nhật hồ sơ thành công!",
        variant: "default",
        duration: 3000,
      });
    } catch (error) {
      console.error(" Failed to update profile:", error);
      const errorMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Cập nhật thất bại!";
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================== Cancel ==================
  const handleCancel = async () => {
    // Reset về dữ liệu gốc từ server
    try {
      const res = await api.get("/users/myInfo");
      const user = res.data.result;
      
      reset({
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        country: user.country,
        address: user.address,
        bio: user.bio,
      });
      
      setAvatarPreview(user.avatarURL);
      setFullName(user.fullName || "");
      setAvatarError(!user.avatarURL);
      setGender(user.gender || "Male"); // Reset gender
      setNewAvatarUrl(null); // Reset avatar mới
    } catch (error) {
      console.error("Failed to reset profile:", error);
    }
    
    setIsEditing(false);
  };

  // ================== Avatar upload via Cloudinary ==================
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Reset input để có thể chọn lại cùng file
    e.target.value = '';

    // Kiểm tra định dạng file theo MIME type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type.toLowerCase())) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)!",
        variant: "destructive",
      });
      return;
    }

    // Kiểm tra kích thước file (giới hạn 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước ảnh không được vượt quá 5MB!",
        variant: "destructive",
      });
      return;
    }

    // Kiểm tra file có thực sự là ảnh hợp lệ bằng cách load nó
    const isValidImage = await new Promise<boolean>((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        // Kiểm tra kích thước ảnh hợp lý (tối thiểu 50x50, tối đa 10000x10000)
        if (img.width < 50 || img.height < 50) {
          toast({
            title: "Lỗi",
            description: "Ảnh quá nhỏ! Kích thước tối thiểu là 50x50 pixels.",
            variant: "destructive",
          });
          resolve(false);
          return;
        }
        if (img.width > 10000 || img.height > 10000) {
          toast({
            title: "Lỗi",
            description: "Ảnh quá lớn! Kích thước tối đa là 10000x10000 pixels.",
            variant: "destructive",
          });
          resolve(false);
          return;
        }
        resolve(true);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        toast({
          title: "Lỗi",
          description: "File không phải là ảnh hợp lệ hoặc bị hỏng!",
          variant: "destructive",
        });
        resolve(false);
      };
      
      img.src = objectUrl;
    });

    if (!isValidImage) {
      return;
    }

    setUploadingAvatar(true);

    try {
      // Upload lên Cloudinary qua backend
      const { viewUrl } = await uploadFileToBackend(file);
      
      // Sử dụng viewUrl để hiển thị (đã được tối ưu hóa)
      setAvatarPreview(viewUrl);
      setNewAvatarUrl(viewUrl);
      setAvatarError(false);
      
      toast({
        title: "Upload thành công!",
        description: "Nhấn 'Lưu thay đổi' để cập nhật ảnh đại diện",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload thất bại",
        description: error.message || "Không thể tải ảnh lên. Vui lòng thử lại!",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ================== UI ==================
  return (
      <Card className="p-8 shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4 pb-8 border-b-2 border-gray-100">
            <div className="relative group">
              {avatarPreview && !avatarError ? (
                <img
                  src={avatarPreview}
                  alt="Ảnh đại diện"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg ring-4 ring-blue-100 transition-all group-hover:ring-blue-200"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-white shadow-lg ring-4 ring-blue-100 flex items-center justify-center transition-all group-hover:ring-blue-200">
                  <span className="text-white text-4xl font-bold">
                    {fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                  </span>
                </div>
              )}

              {isEditing && (
                  <label
                      htmlFor="avatar-upload"
                      className={`absolute bottom-0 right-0 bg-blue-600 p-3 rounded-full shadow-lg transition-all ${
                        uploadingAvatar 
                          ? 'cursor-not-allowed opacity-75' 
                          : 'cursor-pointer hover:bg-blue-700 hover:shadow-xl hover:scale-110'
                      }`}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={uploadingAvatar}
                    />
                  </label>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing ? "Đang chỉnh sửa hồ sơ" : "Xem và quản lý thông tin của bạn"}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Account Info Section */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Thông tin tài khoản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Tên đăng nhập
                  </label>
                  <Input {...register("username")} disabled className="bg-gray-100" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    {...register("fullName")} 
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {errors.fullName && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        ⚠️ {errors.fullName.message}
                      </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    Email
                  </label>
                  <Input type="email" {...register("email")} disabled className="bg-gray-100" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    Số điện thoại
                  </label>
                  <Input 
                    {...register("phone")} 
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {errors.phone && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        ⚠️ {errors.phone.message}
                      </p>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Info Section */}
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Thông tin cá nhân
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Ngày sinh
                  </label>
                  <Input 
                    type="date" 
                    {...register("dob")} 
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Giới tính
                  </label>
                  <select
                    value={gender}
                    disabled
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-gray-700 bg-gray-100 cursor-not-allowed"
                  >
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    Quốc gia
                  </label>
                  <Input 
                    {...register("country")} 
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    Địa chỉ
                  </label>
                  <Input 
                    {...register("address")} 
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                    placeholder="Nhập địa chỉ của bạn"
                  />
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Giới thiệu bản thân
              </h3>
              <div className="space-y-2">
                <Textarea 
                  {...register("bio")} 
                  disabled={!isEditing}
                  rows={5}
                  className={!isEditing ? "bg-gray-50" : ""}
                  placeholder="Viết vài dòng giới thiệu về bản thân..."
                />
              </div>
            </div>

            {/* Certificates Section - Only for Tutor */}
            {user?.role === "Tutor" && (
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Chứng chỉ
                </h3>
                {loadingCertificates ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                    <span className="ml-2 text-gray-500">Đang tải chứng chỉ...</span>
                  </div>
                ) : certificates.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Chưa có chứng chỉ nào</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {certificates
                        .slice(certPage * CERTS_PER_PAGE, (certPage + 1) * CERTS_PER_PAGE)
                        .map((cert) => (
                        <div
                          key={cert.certificateId}
                          className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-amber-100 p-2 rounded-lg">
                                <Award className="w-5 h-5 text-amber-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{cert.certificateName}</h4>
                              </div>
                            </div>
                            {cert.documentUrl && (
                              <button
                                type="button"
                                onClick={() => setSelectedCertIndex(certificates.findIndex(c => c.certificateId === cert.certificateId))}
                                className="text-amber-600 hover:text-amber-700 p-2 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Xem chứng chỉ"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination cho danh sách chứng chỉ */}
                    {certificates.length > CERTS_PER_PAGE && (
                      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-amber-200">
                        <button
                          type="button"
                          onClick={() => setCertPage(prev => Math.max(0, prev - 1))}
                          disabled={certPage === 0}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Trước
                        </button>
                        
                        <span className="text-sm text-gray-600">
                          Trang {certPage + 1} / {Math.ceil(certificates.length / CERTS_PER_PAGE)}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => setCertPage(prev => Math.min(Math.ceil(certificates.length / CERTS_PER_PAGE) - 1, prev + 1))}
                          disabled={certPage >= Math.ceil(certificates.length / CERTS_PER_PAGE) - 1}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Sau
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Certificate Image Modal */}
            {selectedCertIndex !== null && certificates[selectedCertIndex] && (
              <div 
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedCertIndex(null)}
              >
                {/* Nút Back - bên trái */}
                {certificates.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCertIndex(prev => prev !== null ? (prev - 1 + certificates.length) % certificates.length : 0);
                    }}
                    className="absolute left-4 md:left-8 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                    title="Chứng chỉ trước"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>
                )}

                <div 
                  className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="w-6 h-6 text-white" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">{certificates[selectedCertIndex].certificateName}</h3>
                        {certificates.length > 1 && (
                          <p className="text-white/80 text-sm">{selectedCertIndex + 1} / {certificates.length}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCertIndex(null)}
                      className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex items-center justify-center bg-gray-100 overflow-auto max-h-[calc(90vh-80px)]">
                    <img
                      src={certificates[selectedCertIndex].documentUrl}
                      alt={certificates[selectedCertIndex].certificateName}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden flex-col items-center justify-center py-12 text-gray-500">
                      <Award className="w-16 h-16 mb-4 text-gray-300" />
                      <p className="text-center">Không thể tải ảnh chứng chỉ</p>
                      <a
                        href={certificates[selectedCertIndex].documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 text-amber-600 hover:text-amber-700 underline"
                      >
                        Mở link gốc
                      </a>
                    </div>
                  </div>
                </div>

                {/* Nút Next - bên phải */}
                {certificates.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCertIndex(prev => prev !== null ? (prev + 1) % certificates.length : 0);
                    }}
                    className="absolute right-4 md:right-8 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                    title="Chứng chỉ tiếp theo"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-100">
            {!isEditing ? (
                <Button 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa hồ sơ
                </Button>
            ) : (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                    className="px-6 py-2 border-2 hover:bg-gray-50"
                  >
                    Hủy bỏ
                  </Button>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? (
                        <>
                          <Save className="animate-spin w-4 h-4 mr-2" />
                          Đang lưu...
                        </>
                    ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Lưu thay đổi
                        </>
                    )}
                  </Button>
                </>
            )}
          </div>
        </form>
      </Card>
  );
};
