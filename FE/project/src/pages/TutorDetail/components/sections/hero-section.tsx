import React from "react";
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Users,
  BookOpen,
  Video,
  MessageCircle,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import api from "@/config/axiosConfig";
import { ROUTES } from "@/constants/routes";
import axios from "axios";
import { renderText, processHtmlContent, quillViewerStyles, proseClasses } from "@/utils/textUtils";

interface Certificate {
  certificateId?: number;
  certificateID?: number;
  certificateName: string;
  certificateURL?: string;
  documentUrl?: string;
  issuedDate?: string;
  expiryDate?: string;
}

interface TutorHeroSectionProps {
  tutor: {
    id: number;
    name: string;
    language: string;
    country: string;
    rating: number;
    price: number;
    specialties: string[];
    description: string;
    image: string;
    experience?: string;
    coverImage?: string;
    teachingLanguage: string | null;
  };
  certificates?: Certificate[];
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

const TutorHeroSection = ({ tutor, certificates = [] }: TutorHeroSectionProps) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // Check authentication
  React.useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    setIsAuthenticated(Boolean(token));
  }, []);

  const getCertificateUrl = (cert: Certificate) => {
    return cert.certificateURL || cert.documentUrl || '';
  };

  // Animation preset
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };
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

  const handleSendMessage = async () => {
    if (!checkAuthAndRedirect()) return;
    try {
      const res = await api.post(`/chat/advice/${tutor.id}`);
      const room = res.data?.result;
      if (!room?.chatRoomID) {
        return alert("Unable to create chat room.");
      }
      navigate(`/messages/${room.chatRoomID}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          const redirectURL = encodeURIComponent(window.location.pathname);
          navigate(`${ROUTES.SIGN_IN}?redirect=${redirectURL}`);
          return;
        }
      }
      console.error(err);
      alert("Something went wrong.");
    }
  };


  // ========= Render =========
  return (
      <section className="relative">
        {/* Background / Cover */}
        <div className="h-64 bg-gradient-to-r from-blue-600 to-purple-700 relative overflow-hidden">
          <img
              src={
                  tutor.coverImage ||
                  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&w=1200&q=80"
              }
              alt="Background"
              className="w-full h-full object-cover opacity-20"
          />
        </div>

        <div className="max-w-7xl mx-auto px-8 lg:px-16 relative -mt-32">
          <motion.div
              className="bg-white rounded-2xl shadow-xl p-8"
              initial="initial"
              animate="animate"
              variants={fadeInUp}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Info */}
              <div className="lg:col-span-2">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
                  <img
                      src={
                          tutor.image || "https://placehold.co/200x200?text=No+Image"
                      }
                      alt={tutor.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />

                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                      {tutor.name}
                    </h1>

                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-lg text-blue-600 font-medium">
                        Gia sư {tutor.teachingLanguage || tutor.language || "Chưa rõ"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                      {tutor.country || "Chưa rõ quốc gia"}
                    </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                      {tutor.rating?.toFixed(2) || "5.00"}
                    </span>
                      <span className="text-gray-500">(Đánh giá)</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <BookOpen className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-600">
                      Kinh nghiệm: {tutor.experience || "Chưa cập nhật"}
                    </span>
                    </div>
                  </div>
                </div>

                {/* Specialties Only */}
                {tutor.specialties.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Chuyên môn
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {tutor.specialties.map((specialty, index) => (
                        <Badge
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-medium"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Về tôi</h3>
                  {tutor.description ? (
                    tutor.description.includes('<') ? (
                      // Rich text content from Quill
                      <>
                        <div
                          className={proseClasses + " prose-sm"}
                          dangerouslySetInnerHTML={{
                            __html: processHtmlContent(tutor.description),
                          }}
                        />
                        <style>{quillViewerStyles}</style>
                      </>
                    ) : (
                      // Plain text
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {renderText(tutor.description)}
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Gia sư này chưa có mô tả chi tiết. Vui lòng quay lại sau.
                    </p>
                  )}
                </div>
              </div>

              {/* Booking Card */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-3 space-x-2">
                    <span className="text-3xl font-bold text-green-500">
                      {formatPrice(tutor.price)}
                    </span>
                      <span className="text-gray-500">/slot</span>
                    </div>
                    
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium mb-3">
                      <span className="text-xs">⏱️</span>
                      <span>1 slot = 1 giờ</span>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {isAuthenticated 
                        ? "Chọn lịch phù hợp và bắt đầu học ngay!"
                        : "Đăng ký ngay để nhận slot tốt nhất"
                      }
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <Button
                        onClick={() => {
                          if (!checkAuthAndRedirect()) return;
                          navigate(`/book-tutor/${tutor.id}`);
                        }}
                        className="w-full bg-orange-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-orange-600 transition"
                    >
                      <Video className="w-5 h-5"/>
                      <span>Đặt lịch</span>
                    </Button>

                    <Button
                        onClick={handleSendMessage}
                        variant="outline"
                        className="w-full border border-blue-500 text-blue-500 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5"/>
                      <span>Nhắn tin ngay</span>
                    </Button>
                  </div>

                  {/* Certificates Section - Horizontal Scroll */}
                  {certificates && certificates.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-base font-semibold text-gray-900">
                          Chứng chỉ
                        </h3>
                        <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5">
                          {certificates.length}
                        </Badge>
                      </div>
                      
                      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <div className="flex gap-3 pb-2">
                          {certificates.map((cert, index) => {
                            const certUrl = getCertificateUrl(cert);
                            const certId = cert.certificateID || cert.certificateId || index;
                            
                            return (
                              <a
                                key={certId}
                                href={certUrl || '#'}
                                target={certUrl ? "_blank" : undefined}
                                rel={certUrl ? "noopener noreferrer" : undefined}
                                className="group relative flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-yellow-400 transition-all duration-200 shadow-sm hover:shadow-lg cursor-pointer"
                                onClick={(e) => {
                                  if (!certUrl) {
                                    e.preventDefault();
                                  }
                                }}
                                title={cert.certificateName}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center gap-3 px-3">
                                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Award className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-700 line-clamp-2">
                                      {cert.certificateName}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-medium">
                                  ✓
                                </div>
                                
                                <div className="absolute inset-0 bg-yellow-500/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                  <Award className="w-8 h-8 text-white" />
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
  );
};

export default TutorHeroSection;
