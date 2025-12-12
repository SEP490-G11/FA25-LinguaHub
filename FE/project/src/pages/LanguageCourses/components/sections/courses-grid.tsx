import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Users, Star, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types/Course";
import api from "@/config/axiosConfig";
import { useToast } from "@/components/ui/use-toast";
import { ROUTES } from "@/constants/routes";
import { useState, useEffect } from "react";

interface CoursesGridProps {
    courses: Course[];
    loading?: boolean;
}

const CoursesGrid = ({ courses, loading }: CoursesGridProps) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    /** Wishlist local state */
    const [wishlistMap, setWishlistMap] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setWishlistMap(
            Object.fromEntries(
                courses.map((c) => [c.id, c.isWishListed ?? false])
            )
        );
    }, [courses]);

    /** Toggle wishlist */
    const handleToggleWishlist = async (courseId: number) => {
        const token =
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");

        if (!token) {
            const redirect = encodeURIComponent(window.location.pathname);
            navigate(`${ROUTES.SIGN_IN}?redirect=${redirect}`);

            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập.",
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

    /** Animation */
    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45 },
    };

    const staggerContainer = {
        animate: { transition: { staggerChildren: 0.08 } },
    };

    if (loading)
        return (
            <div className="py-20 text-center text-lg font-medium">
                Đang tải khóa học...
            </div>
        );

    if (courses.length === 0)
        return (
            <section className="py-16 text-center">
                <h2 className="text-xl font-semibold">Không có khóa học</h2>
                <p className="text-muted-foreground mt-2">
                    Bạn đã mua tất cả các khóa học có sẵn.
                </p>
            </section>
        );

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("vi-VN");

    return (
        <section className="py-16">
            <motion.div
                className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-8 lg:px-16"
                initial="initial"
                animate="animate"
                variants={staggerContainer}
            >
                {courses.map((course) => {
                    const isWishlisted = wishlistMap[course.id] ?? false;

                    return (
                        <motion.div key={course.id} variants={fadeInUp}>
                            <Link to={`/courses/${course.id}`} className="block h-full">
                                <Card className="overflow-hidden shadow-sm transition-all flex flex-col h-full rounded-xl border bg-white hover:shadow-lg">

                                    {/* Thumbnail */}
                                    <div className="relative">
                                        <img
                                            src={course.thumbnailURL}
                                            alt={course.title}
                                            className="w-full h-48 object-cover"
                                        />

                                        {/* Category + level */}
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <Badge className="bg-primary text-primary-foreground">
                                                {course.categoryName}
                                            </Badge>

                                            <Badge className="bg-white/80 backdrop-blur text-black border">
                                                {course.level}
                                            </Badge>
                                        </div>

                                        {/* Wishlist icon */}
                                        <button
                                            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all hover:scale-110"
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
                                    </div>

                                    {/* Content */}
                                    <CardContent className="p-5 flex flex-col flex-grow">

                                        {/* Title */}
                                        <div className="min-h-[60px] mb-2">
                                            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                                                {course.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                By {course.tutorName}
                                            </p>
                                        </div>

                                        {/* Short description */}
                                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[34px] mb-2">
                                            {course.shortDescription || ""}
                                        </p>

                                        {/* Rating + Learners */}
                                        <div className="flex items-center justify-between text-sm mb-2 text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>{course.learnerCount}</span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <span>{course.avgRating?.toFixed(1)}</span>
                                                <span className="text-xs opacity-70">
                                                    ({course.totalRatings})
                                                </span>
                                            </div>
                                        </div>

                                        {/* Duration + language */}
                                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>{course.duration} giờ</span>
                                            </div>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {course.language}
                                            </span>
                                        </div>

                                        {/* Price + Join */}
                                        <div className="mt-auto pt-3 border-t flex items-center justify-between">
                                            <div>
                                                <div className="text-primary font-bold text-xl">
                                                    {course.price.toLocaleString()}₫
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    Tạo: {formatDate(course.createdAt)}
                                                </span>
                                            </div>

                                            <Button
                                                className="min-w-[100px]"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    navigate(`/courses/${course.id}`);
                                                }}
                                            >
                                                Tham gia
                                            </Button>
                                        </div>

                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
};

export default CoursesGrid;
