import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Award, ChevronRight, Star, Languages, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/config/axiosConfig";
import { ROUTES } from "@/constants/routes";


interface ApprovedTutor {
  verificationId: number;
  tutorId: number;
  userId: number;
  userEmail: string;
  userName: string;
  avatarURL: string | null;
  country: string | null;
  specialization: string | null;
  teachingLanguage: string | null;
  pricePerHour: number;
  status: string;
  submittedAt: string;
  reviewedAt: string;
}


interface TutorDetail {
  tutorId: number;
  userId: number;
  userName: string;
  userEmail: string;
  avatarURL: string;
  country: string;
  phone: string;
  bio: string;
  experience: number;
  specialization: string;
  teachingLanguage: string;
  rating: number;
  status: string;
  pricePerHour: number;
}

const TopTutors = () => {
  const [tutors, setTutors] = useState<TutorDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopTutors = async () => {
      try {
        console.log("Fetching approved tutors...");
        const res = await api.get<ApprovedTutor[]>("/tutors/approved");
        const approvedList = res.data;
        console.log("Approved tutors:", approvedList?.length || 0);

        if (!approvedList || approvedList.length === 0) {
          console.warn("No approved tutors found");
          setLoading(false);
          return;
        }

        // Lấy chi tiết từng tutor (không dùng any)
        console.log("Fetching tutor details...");
        const detailPromises = approvedList.map((tutor: ApprovedTutor) =>
            api.get<TutorDetail>(`/tutors/${tutor.tutorId}`)
              .then((r) => r.data)
              .catch((err) => {
                console.error(`Failed to fetch tutor ${tutor.tutorId}:`, err);
                return null;
              })
        );

        const detailedTutors = (await Promise.all(detailPromises)).filter(
          (t): t is TutorDetail => t !== null
        );

        console.log("Detailed tutors:", detailedTutors.length);

        // Lấy top 4 theo rating
        const top4 = detailedTutors
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 4);

        console.log("Top 4 tutors:", top4);
        setTutors(top4);
      } catch (error) {
        console.error("Failed to fetch tutors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopTutors();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55 },
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.12 } },
  };

  const formatPrice = (price: number) =>
      new Intl.NumberFormat("vi-VN").format(price) + " ₫";

  return (
      <section className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="w-full px-8 lg:px-16">

          <motion.div
              className="text-center mb-12"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Award className="w-4 h-4" />
              <span>Gia sư hàng đầu</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">Gặp gỡ các giáo viên xuất sắc nhất</h2>
          </motion.div>

          {loading && (
              <p className="text-center text-muted-foreground text-lg">Đang tải gia sư...</p>
          )}

          {!loading && tutors.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">Chưa có gia sư nào được phê duyệt</p>
                <Button asChild>
                  <Link to={ROUTES.BECOME_TUTOR}>Trở thành gia sư</Link>
                </Button>
              </div>
          )}

          {/* GRID */}
          {!loading && tutors.length > 0 && (
          <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
          >
            {tutors.map((tutor) => (
                <motion.div key={tutor.tutorId} variants={fadeInUp} className="h-full">
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer border-0 bg-white/80 backdrop-blur-sm h-full flex flex-col">

                    <Link to={`/tutors/${tutor.tutorId}`} className="flex flex-col h-full">

                      {/* Avatar — TĂNG SIZE TỪ h-72 → h-80 */}
                      <div className="relative w-full h-80 overflow-hidden rounded-t-xl bg-gray-100">
                        <img
                            src={tutor.avatarURL || "https://via.placeholder.com/300"}
                            alt={tutor.userName}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <CardContent className="p-6 flex flex-col flex-1">

                        {/* NAME + RATING */}
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-indigo-600 transition">
                            {tutor.userName}
                          </h3>

                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-yellow-400" />
                            <span className="font-medium">{tutor.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* COUNTRY */}
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{tutor.country || "Unknown"}</span>
                        </div>

                        {/* LANGUAGE + EXPERIENCE */}
                        <div className="flex justify-between text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Languages className="w-4 h-4" />
                        {tutor.teachingLanguage}
                      </span>

                          <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                            {tutor.experience} yrs
                      </span>
                        </div>

                        {/* BIO - Fixed height with ellipsis */}
                        <p 
                          className="text-sm text-muted-foreground mb-4 overflow-hidden"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            height: '4.5rem',
                            lineHeight: '1.5rem'
                          }}
                        >
                          {tutor.bio || "Chưa có giới thiệu"}
                        </p>

                        {/* PRICE - Push to bottom */}
                        <div className="flex justify-end mt-auto">
                      <span className="text-lg font-bold text-indigo-600">
                        {formatPrice(tutor.pricePerHour)}
                      </span>
                          <span className="text-sm text-muted-foreground ml-1">/slot</span>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                </motion.div>
            ))}
          </motion.div>
          )}

          {/* VIEW ALL */}
          {!loading && tutors.length > 0 && (
          <motion.div
              className="text-center"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
          >
            <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <Link to={ROUTES.TUTORS}>
                Xem tất cả giáo viên
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
          )}

        </div>
      </section>
  );
};

export default TopTutors;
