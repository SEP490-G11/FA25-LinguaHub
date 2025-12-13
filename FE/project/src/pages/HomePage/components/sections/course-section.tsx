import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Users, Star, ChevronRight, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/config/axiosConfig.ts";
import { ROUTES } from "@/constants/routes.ts";
import { useToast } from "@/components/ui/use-toast";

interface Course {
  id: number;
  title: string;
  shortDescription: string;
  duration: number;
  price: number;
  language: string;
  thumbnailURL: string;
  categoryName: string;
  level: string;
  tutorName: string;
  learnerCount: number;
  avgRating: number;
  totalRatings: number;
  createdAt: string;
  isPurchased: boolean;
  isWishListed: boolean;
}

const CourseSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [wishlistMap, setWishlistMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get<{ code: number; result: Course[] }>(
            "/courses/public/approved"
        );

        const sorted = res.data.result
            .sort((a, b) => b.avgRating - a.avgRating)
            .slice(0, 6);

        setCourses(sorted);

        setWishlistMap(
            Object.fromEntries(
                sorted.map((c) => [c.id, c.isWishListed ?? false])
            )
        );
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleToggleWishlist = async (courseId: number) => {
    const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

    if (!token) {
      navigate(`${ROUTES.SIGN_IN}`);
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để sử dụng danh sách yêu thích.",
        variant: "destructive",
      });
      return;
    }

    const current = wishlistMap[courseId];

    try {
      if (current) {
        await api.delete(`/wishlist/${courseId}`);
      } else {
        await api.post(`/wishlist/${courseId}`);
      }

      setWishlistMap((prev) => ({
        ...prev,
        [courseId]: !current,
      }));
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật danh sách yêu thích.",
        variant: "destructive",
      });
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45 },
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } },
  };

  const formatDate = (date: string) =>
      new Date(date).toLocaleDateString("vi-VN");

  if (loading)
    return (
        <section className="py-16 text-center">
          <p className="text-lg">Đang tải khóa học...</p>
        </section>
    );

  return (
      <section className="py-16 bg-muted/50">
        <div className="w-full px-8 lg:px-16">

          {/* Header */}
          <motion.div
              className="text-center mb-12"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Bài học ngôn ngữ phổ biến
            </h2>
            <p className="text-lg text-muted-foreground">
              Học từ các giảng viên giàu kinh nghiệm và được đánh giá cao nhất.
            </p>
          </motion.div>

          {/* Course List */}
          <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
          >
            {courses.map((course) => {
              const isWishlisted = wishlistMap[course.id];

              return (
                  <motion.div key={course.id} variants={fadeInUp}>
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer relative">

                      {/* Wishlist */}
                      <button
                          className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all hover:scale-110"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleWishlist(course.id);
                          }}
                      >
                        <Heart
                            className={`w-5 h-5 transition-all ${
                                isWishlisted
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-600 hover:text-red-500 hover:fill-red-100"
                            }`}
                        />
                      </button>

                      <Link to={`/courses/${course.id}`}>
                        <div className="relative overflow-hidden h-48 bg-gray-100">
                          <img
                              src={course.thumbnailURL}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          <div className="absolute top-4 left-4 flex gap-2">
                            <Badge className="bg-primary text-primary-foreground">
                              {course.categoryName}
                            </Badge>
                            <Badge className="bg-white/80 backdrop-blur text-black border">
                              {course.level}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-6 flex flex-col min-h-[280px]">

                          {/* Title */}
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {course.title}
                          </h3>

                          {/* Tutor + Rating */}
                          <div className="flex items-center justify-between text-muted-foreground mt-1">
                            <p>By {course.tutorName}</p>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">
                            {course.avgRating.toFixed(1)}
                          </span>
                              <span className="text-xs opacity-70">
                            ({course.totalRatings})
                          </span>
                            </div>
                          </div>

                          {/* Learners */}
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-3">
                            <Users className="w-4 h-4" />
                            <span>{course.learnerCount} học viên</span>
                          </div>

                          {/* Duration + Language */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{course.duration} giờ</span>
                            </div>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {course.language}
                        </span>
                          </div>

                          {/* Price + Join */}
                          <div className="flex justify-between items-end mt-4 pt-4 border-t">
                            <div>
                              <div className="text-xl font-bold text-primary">
                                {course.price.toLocaleString()}₫
                              </div>
                              <span className="text-xs text-muted-foreground">
                            Tạo: {formatDate(course.createdAt)}
                          </span>
                            </div>

                            <Button
                                className={`min-w-[100px] ${
                                    course.isPurchased
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : ""
                                }`}
                            >
                              {course.isPurchased ? "Tiếp tục" : "Tham gia"}
                            </Button>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  </motion.div>
              );
            })}
          </motion.div>

          {/* View All */}
          <motion.div
              className="text-center mt-12"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
          >
            <Button size="lg" asChild>
              <Link to={ROUTES.LANGUAGES}>
                Xem tất cả khóa học <ChevronRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>

        </div>
      </section>
  );
};

export default CourseSection;
 `-+`