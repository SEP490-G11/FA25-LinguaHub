import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/config/axiosConfig";
import { Camera, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ================== VALIDATION ==================
const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(9, "Invalid phone number"),
  dob: z.string().optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  avatarURL: z.string().optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

// Read-only fields (not in form data)
interface UserDisplayData extends ProfileFormData {
  username: string;
  email: string;
}

// ==================================================

export const ProfileForm = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Read-only display fields
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // =============== Fetch user info ==================
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await api.get("/users/myInfo");

        const user = res.data.result;
        setUserId(user.userID);
        setUsername(user.username);
        setEmail(user.email);
        setAvatarPreview(user.avatarURL);

        reset({
          fullName: user.fullName,
          phone: user.phone,
          dob: user.dob,
          gender: user.gender || "Other",
          country: user.country,
          address: user.address,
          bio: user.bio,
          avatarURL: user.avatarURL,
        });
      } catch (error) {
        console.error("❌ Failed to fetch user info:", error);
      }
    };

    fetchUserInfo();
  }, [reset]);

  // ================== Update profile ==================
  const onSubmit = async (data: ProfileFormData) => {
    if (!userId) return;
    setLoading(true);

    try {
      // Tạo payload với các field được phép update
      const payload: Record<string, unknown> = {
        fullName: data.fullName,
        phone: data.phone,
        dob: data.dob,
        gender: data.gender,
        country: data.country,
        address: data.address,
        bio: data.bio,
      };

      // Nếu có avatar mới (base64), thêm vào payload
      if (avatarBase64) {
        payload.avatarURL = avatarBase64;
      }

      const res = await api.patch(`/users/${userId}`, payload);
      const updatedUser = res.data; // Backend trả về user object trực tiếp

      // Update lại form với data mới
      setAvatarPreview(updatedUser.avatarURL);
      setAvatarBase64(null);
      
      reset({
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        dob: updatedUser.dob,
        gender: updatedUser.gender,
        country: updatedUser.country,
        address: updatedUser.address,
        bio: updatedUser.bio,
        avatarURL: updatedUser.avatarURL,
      });

      setIsEditing(false);
      alert("✅ Profile updated successfully!");
    } catch (error) {
      console.error("❌ Failed to update profile:", error);
      alert("❌ Update failed!");
    } finally {
      setLoading(false);
    }
  };

  // ================== Cancel ==================
  const handleCancel = () => setIsEditing(false);

  // ================== Avatar preview & convert to base64 ==================
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra kích thước file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("❌ File size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);
        setAvatarBase64(base64String);
        setValue("avatarURL", base64String, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  // ================== UI ==================
  return (
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4 pb-6 border-b">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview ?? undefined} />
                <AvatarFallback className="bg-blue-500 text-white text-2xl">
                  {avatarPreview ? "" : "U"}
                </AvatarFallback>
              </Avatar>

              {isEditing && (
                  <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                  </label>
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Username</label>
              <Input value={username} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <Input {...register("fullName")} disabled={!isEditing} />
              {errors.fullName && (
                  <p className="text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input type="email" value={email} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <Input {...register("phone")} disabled={!isEditing} />
              {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <Input type="date" {...register("dob")} disabled={!isEditing} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <select
                  {...register("gender")}
                  disabled
                  className="h-10 rounded border px-3"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Country</label>
              <Input {...register("country")} disabled={!isEditing} />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <Input {...register("address")} disabled={!isEditing} />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">About me</label>
              <Textarea {...register("bio")} disabled={!isEditing} rows={4} />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            {!isEditing ? (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
            ) : (
                <>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>

                  <Button type="submit" disabled={!isDirty || loading}>
                    {loading ? (
                        <Save className="animate-spin w-4 h-4 mr-2" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
            )}
          </div>
        </form>
      </Card>
  );
};
