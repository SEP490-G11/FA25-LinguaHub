import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Users, Star, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/config/axiosConfig";
import { ROUTES } from "@/constants/routes";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";


interface RecommendedCourse {
    id: number;
    title: string;
    shortDescription: string;
    tutorName: string;
    thumbnailURL: string;
    categoryName: string;
    level: string;
    learnerCount: number;
    avgRating: number;
    totalRatings: number;
    duration: number;
    price: number;
    language: string;
    isWishListed: boolean;
    isPurchased: boolean;
}

function RecommendedCourses() {
    const [courses, setCourses] = useState<RecommendedCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { toast } = useToast();

    const [wishlistMap, setWishlistMap] = useState<Record<number, boolean>>({});


    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get("/courses/public/approved");
                let list: RecommendedCourse[] = res.data.result || [];
                list = list.filter((c) => !c.isPurchased && !c.isWishListed);
                const top4 = [...list]
                    .sort((a, b) => b.avgRating - a.avgRating)
                    .slice(0, 4);
                setCourses(top4);
                setWishlistMap(
                    Object.fromEntries(
                        top4.map((c) => [c.id, c.isWishListed ?? false])
                    )
                );
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);


    const toggleWishlist = async (courseId: number) => {
        const token =
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");

        if (!token) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập.",
                variant: "destructive",
            });
            navigate(ROUTES.SIGN_IN);
            return;
        }

        const current = wishlistMap[courseId];

        try {
            if (current) await api.delete(`/wishlist/${courseId}`);
            else await api.post(`/wishlist/${courseId}`);

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

    /** Animation presets */
    const fadeInUp = {
        initial: { opacity: 0, y: 25 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45 },
    };
    const stagger = {
        animate: { transition: { staggerChildren: 0.07 } },
    };

    if (loading)
        return (
            <div className="py-20 text-center text-lg font-medium">
                Đang tải khóa học đề xuất…
            </div>
        );

    if (courses.length === 0)
        return (
            <section className="py-16 text-center">
                <h2 className="text-2xl font-semibold">Không có khóa học đề xuất</h2>
                <p className="text-muted-foreground mt-2">
                    Bạn đã đăng ký tất cả các khóa học có sẵn.
                </p>
            </section>
        );

    return (
        <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-bold">Khóa học đề xuất</h2>

                    <Button
                        variant="outline"
                        className="font-medium"
                        onClick={() => navigate(ROUTES.LANGUAGES)}
                    >
                        Xem tất cả khóa học
                    </Button>
                </div>

                {/* Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    initial="initial"
                    animate="animate"
                    variants={stagger}
                >
                    {courses.map((course) => {
                        const isWishlisted = wishlistMap[course.id] ?? false;

                        return (
                            <motion.div key={course.id} variants={fadeInUp}>
                                <Link to={`/courses/${course.id}`} className="block h-full">
                                    <Card className="overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-all h-full flex flex-col bg-white">

                                        {/* Thumbnail */}
                                        <div className="relative">
                                            <img
                                                src={course.thumbnailURL || "/placeholder.jpg"}
                                                alt={course.title}
                                                className="w-full h-48 object-cover"
                                            />

                                            <div className="absolute top-3 left-3 flex gap-2">
                                                <Badge className="bg-primary text-white">
                                                    {course.categoryName}
                                                </Badge>

                                                <Badge className="bg-white/90 backdrop-blur text-black border">
                                                    {course.level}
                                                </Badge>
                                            </div>

                                            {/* Wishlist */}
                                            <button
                                                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all hover:scale-110"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    toggleWishlist(course.id);
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
                                            <h3 className="font-semibold text-lg leading-tight line-clamp-2 min-h-[48px]">
                                                {course.title}
                                            </h3>

                                            <p className="text-sm text-gray-500 mb-2">
                                                by {course.tutorName}
                                            </p>

                                            {/* Description */}
                                            <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mb-3">
                                                {course.shortDescription}
                                            </p>

                                            {/* Rating + Learners */}
                                            <div className="flex items-center justify-between text-sm text-gray-500 mb-2 h-[24px]">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {course.learnerCount}
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    {course.avgRating.toFixed(1)}
                                                    <span className="text-xs opacity-60">
                                                        ({course.totalRatings})
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Duration + Language */}
                                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4 h-[24px]">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    {course.duration} hrs
                                                </div>

                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {course.language}
                                                </span>
                                            </div>

                                            {/* Price + Join */}
                                            <div className="flex items-center justify-between mt-auto pt-3 border-t">
                                                <div className="text-xl font-bold text-primary">
                                                    {course.price.toLocaleString("vi-VN")}₫
                                                </div>

                                                <Button
                                                    onClick={(e) => {
                                                        e.preventDefault();
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
            </div>
        </section>
    );
}

export default RecommendedCourses;
