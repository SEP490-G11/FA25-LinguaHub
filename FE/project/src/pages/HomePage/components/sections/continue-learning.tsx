import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Clock, BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import api from "@/config/axiosConfig";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

interface Lesson {
    lessonId: number;
    lessonTitle: string;
    isDone: boolean;
}

interface SectionProgress {
    sectionId: number;
    sectionTitle: string;
    progress: number;
    isCompleted: boolean;
    lessons: Lesson[];
}

interface EnrolledCourse {
    courseID: number;
    courseTitle: string;
    tutorName: string;
    thumbnailURL: string;
    progressPercent: number;
    isCompleted: boolean;
    enrolledAt: string;

    language?: string;
    level?: string;
    categoryName?: string;

    totalLessons?: number;
    completedLessons?: number;
    currentLesson?: string | null;
}

export default function ContinueLearning() {
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get("/student/courses");
                const baseCourses: EnrolledCourse[] = res.data?.result || [];

                const detailedCourses = await Promise.all(
                    baseCourses.map(async (course) => {
                        const detailRes = await api.get(`/student/courses/${course.courseID}`);
                        const detail = detailRes.data?.result;

                        let totalLessons = 0;
                        let completedLessons = 0;
                        let currentLesson: string | null = null;

                        detail.sectionProgress.forEach((section: SectionProgress) => {
                            totalLessons += section.lessons.length;
                            completedLessons += section.lessons.filter((l) => l.isDone).length;

                            if (!currentLesson) {
                                const nextUnfinished = section.lessons.find((l) => !l.isDone);
                                if (nextUnfinished) currentLesson = nextUnfinished.lessonTitle;
                            }
                        });

                        return {
                            ...course,
                            language: detail.language,
                            level: detail.level,
                            categoryName: detail.categoryName,
                            enrolledAt: detail.enrolledAt,
                            totalLessons,
                            completedLessons,
                            currentLesson: currentLesson || "Đã hoàn thành tất cả bài học",
                        };
                    })
                );

                // 🔥 Chỉ giữ các khóa CHƯA hoàn thành (tính từ completedLessons/totalLessons)
                const ongoing = detailedCourses.filter((c) => {
                    const progress = c.totalLessons ? (c.completedLessons || 0) / c.totalLessons * 100 : 0;
                    return progress < 100;
                });

                // 🔥 Sort theo: enrolledAt gần nhất → progress cao hơn (tính từ completedLessons/totalLessons)
                const sorted = ongoing.sort((a, b) => {
                    const dateA = new Date(a.enrolledAt).getTime();
                    const dateB = new Date(b.enrolledAt).getTime();

                    if (dateA !== dateB) return dateB - dateA;
                    
                    const progressA = a.totalLessons ? (a.completedLessons || 0) / a.totalLessons : 0;
                    const progressB = b.totalLessons ? (b.completedLessons || 0) / b.totalLessons : 0;
                    return progressB - progressA;
                });

                // 🔥 Chỉ lấy 3 khóa
                setCourses(sorted.slice(0, 3));

            } catch (err) {
                console.error("Failed to load courses:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    if (loading) return null;

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                            <Play className="w-8 h-8 text-blue-600" />
                            Tiếp tục học
                        </h2>
                        <p className="text-gray-600">Tiếp tục từ nơi bạn đã dừng lại</p>
                    </div>

                    {courses.length > 0 && (
                        <Button variant="ghost">
                            <Link to="/my-enrollments" className="flex items-center gap-2 text-blue-600">
                                Xem tất cả <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    )}
                </motion.div>

                {/* Empty State */}
                {courses.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="p-10 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg"
                    >
                        <h3 className="text-2xl font-bold mb-3">Bạn chưa đăng ký khóa học nào</h3>
                        <p className="text-gray-600 mb-6">Bắt đầu học để mở khóa cơ hội mới!</p>

                        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 text-lg" asChild>
                            <Link to={ROUTES.LANGUAGES}>
                                Duyệt khóa học <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </Button>
                    </motion.div>
                )}

                {/* Courses */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course, index) => (
                        <motion.div
                            key={course.courseID}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex"
                        >
                            <Card className="overflow-hidden shadow-lg hover:shadow-2xl hover:scale-105 transition-all flex flex-col w-full">
                                <div className="relative h-48">
                                    <img src={course.thumbnailURL} className="w-full h-full object-cover" />

                                    <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm font-bold">
                                        Hoàn thành {course.totalLessons ? Math.round((course.completedLessons || 0) / course.totalLessons * 100) : 0}%
                                    </div>

                                    <div className="absolute bottom-4 left-4 right-4">
                                        <Progress value={course.totalLessons ? ((course.completedLessons || 0) / course.totalLessons * 100) : 0} className="h-2 bg-white/40" />
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold mb-2 line-clamp-2 min-h-[3.5rem]">{course.courseTitle}</h3>
                                    <p className="text-sm text-gray-600 mb-4">by {course.tutorName}</p>

                                    <div className="flex flex-wrap gap-3 mb-4 text-sm">
                                        <span className="px-3 py-1 bg-blue-50 rounded-full text-blue-700">
                                            🌍 {course.language}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                        <BookOpen className="w-4 h-4" />
                                        <span>
                                            {course.completedLessons} / {course.totalLessons} bài học
                                        </span>
                                    </div>

                                    <div className="p-3 bg-blue-50 rounded-lg mb-4">
                                        <p className="text-sm font-medium">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            Tiếp theo: {course.currentLesson}
                                        </p>
                                    </div>

                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto" asChild>
                                        <Link to={`/courses/${course.courseID}`}>
                                            <Play className="w-4 h-4 mr-2" />
                                            Tiếp tục học
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
