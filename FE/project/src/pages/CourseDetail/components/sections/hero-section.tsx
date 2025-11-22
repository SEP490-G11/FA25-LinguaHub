import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Star, Heart } from "lucide-react";
import api from "@/config/axiosConfig";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ROUTES } from "@/constants/routes.ts";
import { getUserId } from "@/lib/getUserId.ts";

/* ------------------- INTERFACES ĐÃ SỬA ĐÚNG ------------------- */
interface Lesson {
  lessonID: number;
  orderIndex: number;
}

interface Section {
  orderIndex: number;
  lessons: Lesson[];
}

interface CourseHeroSectionProps {
  course: {
    id: number;
    title: string;
    shortDescription?: string;
    description: string;
    duration: number;
    price: number;
    language: string;
    level?: string;
    thumbnailURL: string;
    tutorID: number;
    tutorName: string;
    avgRating: number;
    totalRatings: number;
    learnerCount: number;
    categoryName: string;
    createdAt: string;
    isPurchased: boolean;
    requirement?: string;
    isWishListed: boolean | null;
    section: Section[];
  };
  wishlisted: boolean;
  setWishlisted: (value: boolean) => void;
}

const CourseHeroSection = ({ course, wishlisted, setWishlisted }: CourseHeroSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();


  const normalizedCourse = {
    ...course,
    shortDescription: course.shortDescription || course.description.slice(0, 100),
    level: course.level || "All Levels",
    requirement: course.requirement || "No requirement specified",
    isPurchased: Boolean(course.isPurchased),
    isWishListed: Boolean(course.isWishListed),
  };


  const getFirstLessonId = () => {
    if (!course.section || course.section.length === 0) return null;

    const sortedSections = [...course.section].sort(
        (a, b) => a.orderIndex - b.orderIndex
    );

    const firstSection = sortedSections[0];
    if (!firstSection?.lessons || firstSection.lessons.length === 0) return null;

    const sortedLessons = [...firstSection.lessons].sort(
        (a, b) => a.orderIndex - b.orderIndex
    );

    return sortedLessons[0]?.lessonID || null;
  };

  /* ------------------- Button: Go To Course ------------------- */
  const goToFirstLesson = () => {
    const firstId = getFirstLessonId();

    if (!firstId) {
      toast({
        title: "No lessons available",
        description: "This course has no lessons yet.",
        variant: "destructive",
      });
      return;
    }

    navigate(`/lesson/${firstId}`, {
      state: { courseId: course.id },
    });
  };

  /* ------------------- Auto remove wishlist if purchased ------------------- */
  useEffect(() => {
    if (course.isPurchased) {
      setWishlisted(false);
    }
  }, [course.isPurchased]);

  /* ------------------- Wishlist toggle ------------------- */
  const toggleWishlist = async () => {
    const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

    if (!token) {
      const redirectURL = encodeURIComponent(window.location.pathname);
      navigate(`${ROUTES.SIGN_IN}?redirect=${redirectURL}`);

      toast({
        title: "Login Required",
        description: "Please sign in.",
        variant: "destructive",
      });

      return;
    }

    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${course.id}`);
        setWishlisted(false);
      } else {
        if (course.isPurchased) {
          toast({
            title: "Already Purchased",
            description: "You can't add purchased courses to your wishlist.",
            variant: "destructive",
          });
          return;
        }

        await api.post(`/wishlist/${course.id}`);
        setWishlisted(true);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update wishlist.",
        variant: "destructive",
      });
    }
  };

  /* ------------------- Thanh toán ------------------- */
  const handleBuyNow = async () => {
    const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

    if (!token) {
      const redirectURL = encodeURIComponent(window.location.pathname);
      navigate(`${ROUTES.SIGN_IN}?redirect=${redirectURL}`);

      toast({
        title: "Login Required",
        description: "Please sign in before buying the course.",
        variant: "destructive",
      });

      return;
    }

    const userId = await getUserId();
    if (!userId) {
      toast({
        title: "Error",
        description: "Cannot detect user ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.post("/api/payments/create", {
        userId,
        targetId: course.id,
        paymentType: "Course",
      });

      window.location.href = response.data.checkoutUrl;
    } catch {
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);

  const formatDate = (dateString: string) =>
      new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  return (
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* LEFT CONTENT */}
            <motion.div
                className="text-white"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3">
              <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                {normalizedCourse.language}
              </span>

                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                {normalizedCourse.level} Level
              </span>
              </div>

              <h1 className="text-4xl font-bold mt-4 mb-2">
                {normalizedCourse.title}
              </h1>

              <div className="flex items-center gap-4 text-blue-100 mb-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {normalizedCourse.categoryName}
              </span>
                <span className="text-sm opacity-90">
                Created on: {formatDate(normalizedCourse.createdAt)}
              </span>
              </div>

              <p className="text-xl text-blue-100 mb-6">
                {normalizedCourse.shortDescription}
              </p>

              <div className="flex items-center gap-4 text-blue-100 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  <span className="font-semibold">
                  {normalizedCourse.avgRating.toFixed(1)}
                </span>
                  <span className="opacity-80 text-sm">
                  ({normalizedCourse.totalRatings} reviews)
                </span>
                </div>

                <span>•</span>
                <span>{normalizedCourse.learnerCount} learners</span>
              </div>

              <div className="flex items-center space-x-2 mb-6">
                <Clock className="w-5 h-5 text-blue-200" />
                <span>{normalizedCourse.duration} hours</span>
              </div>

              <span className="text-3xl font-bold mb-6 block">
              {formatPrice(normalizedCourse.price)}
            </span>

              <div className="flex gap-4 mt-4">
                {/* Wishlist - Only show if not purchased */}
                {!normalizedCourse.isPurchased && (
                    <button
                        onClick={toggleWishlist}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all border border-white ${
                            wishlisted
                                ? "bg-white text-blue-600 hover:bg-gray-100"
                                : "bg-transparent text-white hover:bg-white hover:text-blue-600"
                        }`}
                    >
                      <Heart
                          className={`w-5 h-5 ${
                              wishlisted
                                  ? "fill-blue-600 text-blue-600"
                                  : "text-white"
                          }`}
                      />
                      {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    </button>
                )}

                {/* BUTTON: Go to Course or Buy Now */}
                {normalizedCourse.isPurchased ? (
                    <button
                        onClick={goToFirstLesson}
                        className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
                    >
                      Go to Course
                    </button>
                ) : (
                    <button
                        onClick={handleBuyNow}
                        className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
                    >
                      Buy Now
                    </button>
                )}
              </div>
            </motion.div>

            {/* RIGHT IMAGE */}
            <motion.div
                className="relative"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
            >
              <img
                  src={normalizedCourse.thumbnailURL}
                  alt={normalizedCourse.title}
                  className="rounded-2xl shadow-2xl"
              />
            </motion.div>

          </div>
        </div>
      </section>
  );
};

export default CourseHeroSection;
