import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import api from "@/config/axiosConfig";
import { ROUTES } from "@/constants/routes";

interface Language {
  id: number;
  nameVi: string;
  nameEn: string;
  isActive: boolean;
  difficulty: string;
  certificates: string;
  thumbnailUrl: string;
}

const PopularLanguages = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await api.get<{ code: number; result: Language[] }>(
          "/languages/all"
        );
        // Lấy 6 ngôn ngữ đầu tiên (có thể filter theo isActive nếu cần)
        setLanguages(response.data.result.slice(0, 6));
      } catch (error) {
        console.error("Error fetching languages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45 },
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } },
  };

  const getDifficultyInfo = (difficulty: string) => {
    const normalizedDifficulty = (difficulty?.trim() || "").toLowerCase();
    
    // Dễ / Easy
    if (normalizedDifficulty.includes("dễ") || normalizedDifficulty.includes("easy")) {
      return {
        bgStyle: { backgroundColor: "#a7f3d0" }, // emerald-200
        textStyle: { color: "#064e3b" }, // emerald-900
        label: difficulty
      };
    }
    
    // Trung bình / Medium
    if (normalizedDifficulty.includes("trung bình") || normalizedDifficulty.includes("medium")) {
      return {
        bgStyle: { backgroundColor: "#fde68a" }, // amber-200
        textStyle: { color: "#78350f" }, // amber-900
        label: difficulty
      };
    }
    
    // Rất khó / Very Hard (check this first before "Khó")
    if (normalizedDifficulty.includes("rất khó") || normalizedDifficulty.includes("very hard") || normalizedDifficulty.includes("veryhard")) {
      return {
        bgStyle: { backgroundColor: "#fecaca" }, // red-200
        textStyle: { color: "#7f1d1d" }, // red-900
        label: difficulty
      };
    }
    
    // Khó / Hard
    if (normalizedDifficulty.includes("khó") || normalizedDifficulty.includes("hard")) {
      return {
        bgStyle: { backgroundColor: "#fed7aa" }, // orange-200
        textStyle: { color: "#7c2d12" }, // orange-900
        label: difficulty
      };
    }
    
    // Default
    console.log("Unknown difficulty:", difficulty);
    return {
      bgStyle: { backgroundColor: "#e5e7eb" }, // gray-200
      textStyle: { color: "#111827" }, // gray-900
      label: difficulty || "Chưa xác định"
    };
  };

  const parseCertificates = (certificates: string): string[] => {
    if (!certificates) return [];
    try {
      return certificates.split(",").map((cert) => cert.trim());
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <section className="py-16 text-center">
        <p className="text-lg">Đang tải ngôn ngữ...</p>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      <div className="w-full px-8 lg:px-16 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="inline-block mb-4">
            <span className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">
              🌍 Học ngôn ngữ mới
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Ngôn ngữ phổ biến
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Khám phá các ngôn ngữ được yêu thích nhất và bắt đầu hành trình học tập của bạn.
          </p>
        </motion.div>

        {/* Languages Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {languages.map((language) => {
            const certificates = parseCertificates(language.certificates);
            const difficultyInfo = getDifficultyInfo(language.difficulty);
            const maxCerts = 3;
            const displayCerts = certificates.slice(0, maxCerts);
            const remainingCerts = certificates.length - maxCerts;

            return (
              <motion.div
                key={language.id}
                variants={fadeInUp}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer flex flex-col border border-gray-100 hover:border-blue-300 hover:-translate-y-2"
              >
                {/* IMAGE + STATUS + NAME */}
                <div className="relative h-56 overflow-hidden bg-gray-200">
                  <SafeImage
                    src={language.thumbnailUrl}
                    alt={language.nameVi}
                    className="w-full h-full group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <Badge
                      className={`${
                        language.isActive
                          ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg"
                          : "bg-slate-500 hover:bg-slate-600 shadow-lg"
                      } backdrop-blur-md border-0`}
                    >
                      {language.isActive ? "✓ Đang mở" : "⏸ Tạm ngừng"}
                    </Badge>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 to-transparent">
                    <h3 className="text-2xl font-bold text-white drop-shadow-2xl mb-1 tracking-tight">
                      {language.nameVi}
                    </h3>
                    <p className="text-sm text-white/95 drop-shadow-lg font-medium">
                      {language.nameEn}
                    </p>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-6 space-y-5 flex flex-col flex-1 bg-gradient-to-b from-white via-gray-50/30 to-gray-50/50">
                  {/* Difficulty Level */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">Độ khó:</span>
                    <span 
                      className="px-4 py-1.5 rounded-full text-sm font-bold shadow-sm"
                      style={{ ...difficultyInfo.bgStyle, ...difficultyInfo.textStyle }}
                    >
                      {difficultyInfo.label}
                    </span>
                  </div>

                  {/* Certificates */}
                  <div className="flex-1 min-h-[80px]">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                      <span className="text-lg">🏆</span> 
                      <span>Chứng chỉ</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {certificates.length > 0 ? (
                        <>
                          {displayCerts.map((cert, i) => (
                            <span
                              key={i}
                              className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-semibold border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow"
                            >
                              {cert}
                            </span>
                          ))}
                          {remainingCerts > 0 && (
                            <span className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 text-xs px-3 py-1.5 rounded-lg font-bold border border-purple-200/50 shadow-sm">
                              +{remainingCerts}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Chưa có chứng chỉ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    to={`/languages/${language.nameEn.toLowerCase()}`}
                    className={`block w-full text-center py-3.5 rounded-xl font-bold transition-all duration-300 mt-auto shadow-md ${
                      language.isActive
                        ? "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    onClick={(e) => !language.isActive && e.preventDefault()}
                  >
                    {language.isActive ? "Khám phá khóa học →" : "Tạm ngừng"}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All Button */}
        <motion.div
          className="text-center mt-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Button 
            size="lg" 
            asChild
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base"
          >
            <Link to={ROUTES.LANGUAGES}>
              Xem tất cả ngôn ngữ <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default PopularLanguages;
