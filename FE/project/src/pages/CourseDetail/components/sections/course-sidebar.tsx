import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, BookOpen, Globe, Heart } from "lucide-react";
import api from "@/config/axiosConfig";
import { ROUTES } from "@/constants/routes";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getUserId } from "@/lib/getUserId";

interface CourseSidebarProps {
  course: {
    id: number;
    title: string;
    description: string;
    duration: number;
    price: number;
    language: string;
    thumbnailURL: string;
    categoryName: string;
    tutorName: string;
    tutorAvatarURL: string | null;
    learnerCount: number;
    avgRating: number;
    totalRatings: number;
    tutorAddress: string;
    tutorID: number;
    isPurchased: boolean;
    section: {
      sectionID: number;
      orderIndex: number;
      title: string;
      lessons: {
        lessonID: number;
        title: string;
        duration: number;
        orderIndex: number;
      }[];
    }[];
    contentSummary: {
      totalVideoHours: number;
      totalPracticeTests: number;
      totalArticles: number;
      totalDownloadableResources: number;
    };
    objectives: string[];
  };

  wishlisted: boolean;
  setWishlisted: (value: boolean) => void;
}

const CourseSidebar = ({ course, wishlisted, setWishlisted }: CourseSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // Removed tutor ownership check - all users must purchase courses

  /** ===============================
   *  AUTO-REMOVE WISHLIST IF PURCHASED
   * =============================== */
  useEffect(() => {
    if (course.isPurchased && wishlisted) {
      const removeWishlist = async () => {
        try {
          await api.delete(`/wishlist/${course.id}`);
          setWishlisted(false);
        } catch {
          //no
        }
      };
      removeWishlist();
    }
  }, [course.isPurchased]);

  /** ===============================
   *  WISHLIST TOGGLE
   * =============================== */
  const toggleWishlist = async () => {
    const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

    if (!token) {
      navigate(`${ROUTES.SIGN_IN}?redirect=${window.location.pathname}`);
      toast({
        variant: "destructive",
        title: "You must be logged in",
      });
      return;
    }

    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${course.id}`);
        setWishlisted(false);
        toast({ title: "Removed from wishlist" });
      } else {
        await api.post(`/wishlist/${course.id}`);
        setWishlisted(true);
        toast({ title: "Added to wishlist" });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Wishlist error",
      });
    }
  };

  /** ===============================
   *  BUY NOW
   * =============================== */
  const handleBuyNow = async () => {
    const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

    if (!token) {
      navigate(`${ROUTES.SIGN_IN}?redirect=${window.location.pathname}`);
      toast({
        variant: "destructive",
        title: "Login required",
      });
      return;
    }

    const userId = await getUserId();
    if (!userId) {
      toast({
        variant: "destructive",
        title: "User not found",
      });
      return;
    }

    try {
      const response = await api.post("/api/payments/create", {
        userId,
        targetId: course.id,
        paymentType: "Course",
      });

      // Redirect to PayOS checkout URL
      if (response.data?.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        toast({
          variant: "destructive",
          title: "Payment Error",
          description: "Cannot get checkout URL",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: "Failed to initialize payment.",
      });
    }
  };

  /** ===============================
   *  GET FIRST LESSON ID
   * =============================== */
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

  /** ===============================
   *  GO TO COURSE
   * =============================== */
  const handleGoToCourse = () => {
    const firstLessonId = getFirstLessonId();

    if (!firstLessonId) {
      toast({
        title: "No lessons available",
        description: "This course has no lessons yet.",
        variant: "destructive",
      });
      return;
    }

    navigate(`/lesson/${firstLessonId}`, {
      state: { courseId: course.id },
    });
  };

  const handleViewProfile = () =>
      navigate(ROUTES.TUTOR_DETAIL.replace(":id", `${course.tutorID}`));

  const totalLessons = course.section?.reduce(
      (t, sec) => t + sec.lessons.length,
      0
  );

  const formatPrice = (price: number) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);

  return (
      <div className="lg:col-span-1 space-y-8">

        {/* ================= INSTRUCTOR CARD ================= */}
        <motion.div
            className="bg-white rounded-2xl p-6 shadow-lg"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Instructor</h3>

          <div className="flex items-center space-x-4 mb-4">
            <img
                src={course.tutorAvatarURL || "https://placehold.co/150x150/png"}
                className="w-16 h-16 rounded-full object-cover shadow"
            />

            <div>
              <h4 className="font-semibold text-gray-900">{course.tutorName}</h4>
              <p className="text-sm text-gray-500">{course.tutorAddress}</p>

              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm">{course.avgRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">
                ({course.totalRatings})
              </span>
              </div>
            </div>
          </div>

          <button
              onClick={handleViewProfile}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            View Profile
          </button>
        </motion.div>

        {/* ================= COURSE INFO ================= */}
        <motion.div
            className="bg-white rounded-2xl p-6 shadow-lg"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Course Information
          </h3>

          <div className="space-y-4">
            {/* Content Summary - Udemy style */}
            {course.contentSummary && (
                <div className="pb-4 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">This course includes:</h4>
                  <div className="space-y-2 text-sm">
                    {course.contentSummary.totalVideoHours > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{course.contentSummary.totalVideoHours} hours on-demand video</span>
                        </div>
                    )}
                    {course.contentSummary.totalPracticeTests > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <BookOpen className="w-4 h-4" />
                          <span>{course.contentSummary.totalPracticeTests} practice tests</span>
                        </div>
                    )}
                    {course.contentSummary.totalArticles > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <BookOpen className="w-4 h-4" />
                          <span>{course.contentSummary.totalArticles} articles</span>
                        </div>
                    )}
                    {course.contentSummary.totalDownloadableResources > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <BookOpen className="w-4 h-4" />
                          <span>{course.contentSummary.totalDownloadableResources} downloadable resources</span>
                        </div>
                    )}
                  </div>
                </div>
            )}

            <div className="flex justify-between">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>Duration</span>
              </div>
              <span className="font-semibold">{course.duration} hours</span>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center space-x-2 text-gray-600">
                <BookOpen className="w-5 h-5" />
                <span>Lessons</span>
              </div>
              <span className="font-semibold">{totalLessons}</span>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center space-x-2 text-gray-600">
                <Globe className="w-5 h-5" />
                <span>Language</span>
              </div>
              <span className="font-semibold">{course.language}</span>
            </div>
          </div>
        </motion.div>

        {/* ================= PAYMENT SECTION ================= */}
        <motion.div
            className="bg-white rounded-2xl p-6 shadow-lg"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
          {/* Price */}
          <div className="text-center mb-6">
          <span className="text-3xl font-bold text-blue-600">
            {formatPrice(course.price)}
          </span>
          </div>

          {/* If Purchased → Go To Course */}
          {course.isPurchased ? (
              <button
                  onClick={handleGoToCourse}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition mb-3"
              >
                Go to Course
              </button>
          ) : (
              <>
                {/* Buy Now */}
                <button
                    onClick={handleBuyNow}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition mb-3"
                >
                  Buy Now
                </button>

                {/* Wishlist */}
                <button
                    onClick={toggleWishlist}
                    className="w-full border flex items-center justify-center gap-2 border-blue-600 text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition"
                >
                  <Heart
                      className={`w-5 h-5 ${
                          wishlisted ? "fill-blue-600 text-blue-600" : ""
                      }`}
                  />
                  {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                </button>
              </>
          )}
        </motion.div>
      </div>
  );
};

export default CourseSidebar;
