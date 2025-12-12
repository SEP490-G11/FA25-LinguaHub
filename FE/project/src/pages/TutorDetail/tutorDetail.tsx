import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/config/axiosConfig";
import TutorHeroSection from "./components/sections/hero-section";
import CoursesSection from "./components/sections/courses-section";
import ReviewsSection from "./components/sections/reviews-section";
import SchedulePreview from "./components/sections/schedule-preview";
import { Button } from "@/components/ui/button";
import { Video, ChevronLeft, ChevronRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Course {
  id: number;
  title: string;
  description: string;
  duration: number;
  price: number;
  language: string;
  thumbnailURL: string;
  categoryName: string;
  status: string;
}

interface SlotContent {
  slot_number: number;
  content: string;
}

interface PackageItem {
  name: string;
  description: string;
  packageid: number;
  tutor_id: number;
  max_slots: number;
  is_active: boolean;
  requirement?: string;
  objectives?: string;
  min_booking_price_per_hour?: number;
  slot_content?: SlotContent[];
  created_at?: string;
  updated_at?: string;
}

interface Feedback {
  feedbackID: number;
  rating: number;
  comment: string;
  createdAt: string;
  learnerName: string;
  learnerAvatarURL: string;
}

interface Certificate {
  certificateID: number;
  certificateName: string;
  certificateURL: string;
  issuedDate?: string;
  expiryDate?: string;
}

interface Tutor {
  tutorId: number;
  userId: number;
  userName: string;
  userEmail: string;
  avatarURL: string | null;
  country: string | null;
  phone: string | null;
  bio: string | null;
  experience: string | null;
  specialization: string | null;
  teachingLanguage: string | null;
  rating: number;
  pricePerHour: number | null;
  status: string;
  courses: Course[];
  feedbacks?: Feedback[];
  certificates?: Certificate[];
}

const TutorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    setIsAuthenticated(Boolean(token));
  }, []);

  const PACKAGES_PER_PAGE = 2;
  const activePackages = packages.filter(p => p.is_active);
  const totalPages = Math.max(1, Math.ceil(activePackages.length / PACKAGES_PER_PAGE));
  const displayedPackages = activePackages.slice(
    currentPage * PACKAGES_PER_PAGE,
    currentPage * PACKAGES_PER_PAGE + PACKAGES_PER_PAGE
  );

  const getMaxSlot = (pkg: PackageItem) => pkg.max_slots || 0;

  const handleOpenDetail = (pkg: PackageItem) => {
    setSelectedPackage(pkg);
    setOpenDetail(true);
  };

  // FETCH TUTOR
  useEffect(() => {
    const fetchTutor = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/tutors/${id}`, { skipAuth: true });
        setTutor(res.data);
      } catch (err) {
        console.error("Failed to fetch tutor:", err);
        setError("Không thể tải thông tin gia sư.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTutor();
  }, [id]);

  // FETCH PACKAGES — FIXED
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoadingPackages(true);
        const res = await api.get(`/tutor/${id}/packages`, { skipAuth: true });

        setPackages(res.data.packages || []);
      } catch (err) {
        console.error("Failed to fetch packages:", err);
      } finally {
        setLoadingPackages(false);
      }
    };

    if (id) fetchPackages();
  }, [id]);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500 text-lg">Đang tải thông tin gia sư...</p>
        </div>
    );
  }

  if (error || !tutor) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-red-500 text-lg">{error || "Gia sư không tồn tại."}</p>
        </div>
    );
  }

  const checkAuthAndRedirect = () => {
    const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

    if (!token) {
      const redirectURL = encodeURIComponent(window.location.pathname);
      navigate(`${ROUTES.SIGN_IN}?redirect=${redirectURL}`);
      return false;
    }
    return true;
  };

  const heroData = {
    id: tutor.tutorId,
    name: tutor.userName,
    language: tutor.teachingLanguage || "Unknown",
    country: tutor.country || "Unknown",
    rating: tutor.rating || 0,
    image: tutor.avatarURL || "https://placehold.co/600x400?text=No+Image",
    experience: tutor.experience || "Hollow",
    price: tutor.pricePerHour || 0,
    teachingLanguage: tutor.teachingLanguage,
    description:
        tutor.bio ||
        "There is currently no detailed description for this tutor. Please come back later.",
    specialties: tutor.specialization
        ? tutor.specialization.split(",").map((s) => s.trim())
        : [],
  };

  return (
      <div className="min-h-screen bg-gray-50">
        {/* HERO SECTION */}
        <TutorHeroSection tutor={heroData} certificates={tutor.certificates || []} />

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-8 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* LEFT SIDE */}
              <div className="lg:col-span-2 space-y-12">

                {/* PACKAGES */}
                <div className="bg-blue-50/50 p-6 rounded-xl shadow-md border border-blue-100">
                  <h2 className="text-2xl font-bold mb-2 text-blue-900 flex items-center gap-2">
                    <span>📦</span> Gói học
                  </h2>
                  <p className="text-gray-600 mb-6">Xem các gói học có sẵn được cung cấp bởi gia sư này</p>

                  {loadingPackages ? (
                      <p className="text-gray-500">Đang tải gói học...</p>
                  ) : activePackages.length === 0 ? (
                      <p className="text-gray-500 italic">Không có gói học nào khả dụng.</p>
                  ) : (
                      <div className="relative">
                        {/* Previous Button */}
                        <button
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            className="absolute -left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed z-10"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Packages Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                          {displayedPackages.map((pkg) => (
                              <div 
                                  key={pkg.packageid} 
                                  className="p-6 rounded-2xl border-2 border-gray-200 bg-white shadow-md transition hover:bg-blue-50 flex flex-col h-full"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-yellow-500 flex-shrink-0">✨</span>
                                    <h3 className="font-bold text-gray-900 line-clamp-1">
                                      {pkg.name}
                                    </h3>
                                  </div>
                                  <Button
                                      className="bg-blue-600 text-white hover:bg-blue-700 flex-shrink-0"
                                      size="sm"
                                      onClick={() => handleOpenDetail(pkg)}
                                  >
                                    Chi tiết
                                  </Button>
                                </div>

                                <p className="text-sm text-gray-600 mt-2 mb-4 line-clamp-2 min-h-[40px]">
                                  {pkg.requirement || "Không có yêu cầu"}
                                </p>

                                <div className="space-y-2 text-sm text-gray-700 flex-1">
                                  <p className="line-clamp-2">
                                    <b>Mục tiêu:</b> {pkg.objectives || "Chưa có mục tiêu"}
                                  </p>
                                  <p>
                                    <b>Số buổi tối đa:</b> {getMaxSlot(pkg)}
                                  </p>
                                </div>
                              </div>
                          ))}
                        </div>

                        {/* Next Button */}
                        <button
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            className="absolute -right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed z-10"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                  )}
                </div>

                {/* Package Detail Modal */}
                <Dialog open={openDetail} onOpenChange={setOpenDetail}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-bold text-blue-900 flex items-center gap-2">
                        <span>✨</span> {selectedPackage?.name}
                      </DialogTitle>
                    </DialogHeader>
                    
                    {selectedPackage && (
                        <div className="space-y-3 text-gray-700">
                          <p>
                            <strong className="text-gray-900">Mô tả:</strong> {selectedPackage.description || "Chưa có mô tả"}
                          </p>

                          <p>
                            <strong className="text-gray-900">Yêu cầu:</strong> {selectedPackage.requirement || "Không có yêu cầu cụ thể"}
                          </p>

                          <p>
                            <strong className="text-gray-900">Mục tiêu:</strong> {selectedPackage.objectives || "Chưa có mục tiêu"}
                          </p>

                          <p>
                            <strong className="text-gray-900">Số buổi học:</strong> {selectedPackage.slot_content?.length || getMaxSlot(selectedPackage)}
                          </p>

                          <p>
                            <strong className="text-gray-900">Số buổi tối đa:</strong> {getMaxSlot(selectedPackage)}
                          </p>

                          {selectedPackage.min_booking_price_per_hour && (
                              <p>
                                <strong className="text-gray-900">Giá tối thiểu mỗi giờ:</strong> {selectedPackage.min_booking_price_per_hour.toLocaleString('vi-VN')} ₫
                              </p>
                          )}

                          {selectedPackage.slot_content && selectedPackage.slot_content.length > 0 && (
                              <div>
                                <strong className="text-gray-900 block mb-2">Nội dung bài học:</strong>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                  {selectedPackage.slot_content.map((slot) => (
                                      <li key={slot.slot_number}>
                                        Buổi {slot.slot_number}: {slot.content}
                                      </li>
                                  ))}
                                </ul>
                              </div>
                          )}
                        </div>
                    )}
                  </DialogContent>
                </Dialog>

                {/* SCHEDULE PREVIEW */}
                <SchedulePreview tutorId={tutor.tutorId} />

                {/* COURSES */}
                <CoursesSection courses={tutor.courses || []} />

                {/* REVIEWS */}
                <ReviewsSection tutorId={tutor.tutorId} initialFeedbacks={tutor.feedbacks || []} />
              </div>

              {/* RIGHT SIDEBAR */}
              <div className="lg:col-span-1 lg:sticky lg:top-20 lg:self-start">
                <div className="bg-white shadow-sm rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-2">Thông tin gia sư</h3>

                  <p className="text-gray-800 text-lg font-semibold mb-3">
                    {tutor.userName}
                  </p>

                  <p className="text-gray-600">
                    <strong>Email:</strong> {tutor.userEmail}
                  </p>

                  {tutor.phone && (
                      <p className="text-gray-600">
                        <strong>Điện thoại:</strong> {tutor.phone}
                      </p>
                  )}
                </div>

                {/* BOOKING CARD */}
                <div className="mt-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-2xl font-bold mb-2">Đặt buổi học 1-1!</h3>
                  <p className="text-white/90 text-sm mb-2">
                    💰 <strong>{tutor.pricePerHour?.toLocaleString('vi-VN') || '0'} ₫/giờ</strong> <span className="text-white/70">(1 slot = 1 giờ)</span>
                  </p>
                  <p className="text-white/90 text-sm mb-4">
                    {isAuthenticated 
                      ? "Trải nghiệm học tập cá nhân hóa với gia sư chuyên nghiệp. Chọn lịch phù hợp với bạn!"
                      : "Đăng ký ngay để nhận slot tốt nhất! Trải nghiệm học tập cá nhân hóa với gia sư chuyên nghiệp."
                    }
                  </p>

                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      <span className="text-green-300">✔</span>
                      Buổi học riêng 1-1
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-300">✔</span>
                      Kế hoạch học tập tùy chỉnh
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-300">✔</span>
                      Lịch trình linh hoạt & đặt lịch ngay lập tức
                    </li>
                  </ul>

                  <Button
                      onClick={() => {
                        if (!checkAuthAndRedirect()) return;
                        navigate(`/book-tutor/${tutor.tutorId}`);
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 text-lg font-semibold"
                  >
                    <Video className="w-5 h-5" />
                    <span>Đặt lịch</span>
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>
  );
};

export default TutorDetail;
