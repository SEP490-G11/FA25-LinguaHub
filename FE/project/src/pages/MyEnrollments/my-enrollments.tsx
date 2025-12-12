import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    BookOpen, Clock, Award, ChevronRight,
    Play
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/config/axiosConfig";
import { Input } from "@/components/ui/input";

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

interface StudentCourse {
    courseID: number;
    courseTitle: string;
    tutorName: string;
    price: number;
    language: string;
    thumbnailURL: string;
    status: string;
    enrolledAt: string;
    progressPercent: number;
    isCompleted: boolean;
    // Thêm fields để tính tiến độ chính xác
    totalLessons?: number;
    completedLessons?: number;
}

const ITEMS_PER_PAGE = 5;

const MyEnrollments = () => {
    const [selectedTab, setSelectedTab] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [enrollments, setEnrollments] = useState<StudentCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    // FETCH API - lấy chi tiết từng course để tính tiến độ chính xác
    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                const res = await api.get("/student/courses");
                const baseCourses: StudentCourse[] = res.data.result ?? [];

                // Fetch chi tiết từng course để tính tiến độ từ lessons
                const detailedCourses = await Promise.all(
                    baseCourses.map(async (course) => {
                        try {
                            const detailRes = await api.get(`/student/courses/${course.courseID}`);
                            const detail = detailRes.data?.result;

                            let totalLessons = 0;
                            let completedLessons = 0;

                            if (detail?.sectionProgress) {
                                detail.sectionProgress.forEach((section: SectionProgress) => {
                                    totalLessons += section.lessons.length;
                                    completedLessons += section.lessons.filter((l) => l.isDone).length;
                                });
                            }

                            // Tính tiến độ từ lessons thay vì dùng progressPercent từ API
                            const calculatedProgress = totalLessons > 0 
                                ? (completedLessons / totalLessons) * 100 
                                : 0;
                            const calculatedCompleted = calculatedProgress >= 100;

                            return {
                                ...course,
                                totalLessons,
                                completedLessons,
                                progressPercent: calculatedProgress,
                                isCompleted: calculatedCompleted,
                            };
                        } catch {
                            return course;
                        }
                    })
                );

                setEnrollments(detailedCourses);
            } finally {
                setLoading(false);
            }
        };
        fetchEnrollments();
    }, []);

    // FILTER + SEARCH
    const filteredEnrollments = useMemo(() => {
        let data = enrollments;

        if (selectedTab === "in-progress") data = data.filter((e) => !e.isCompleted);
        if (selectedTab === "completed") data = data.filter((e) => e.isCompleted);

        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(
                (e) =>
                    e.courseTitle.toLowerCase().includes(lower) ||
                    e.tutorName.toLowerCase().includes(lower)
            );
        }

        return data;
    }, [enrollments, selectedTab, searchTerm]);

    // PAGINATION
    const pageCount = Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE);
    const paginated = filteredEnrollments.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setPage(1);
    }, [selectedTab, searchTerm]);

    // STATS
    const stats = {
        total: enrollments.length,
        inProgress: enrollments.filter((e) => !e.isCompleted).length,
        completed: enrollments.filter((e) => e.isCompleted).length,
    };

    if (loading)
        return <div className="text-center py-20 text-lg font-medium">Đang tải...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">

                {/* HEADER */}
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Khóa học của tôi</h1>
                <p className="text-gray-600 mb-6">
                    Theo dõi tiến độ học tập và tiếp tục hành trình của bạn
                </p>

                {/* SEARCH */}
                <div className="mb-6">
                    <Input
                        placeholder="Tìm kiếm khóa học hoặc gia sư..."
                        className="max-w-md bg-white shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-600">Tổng khóa học</p>
                                    <p className="text-3xl font-bold">{stats.total}</p>
                                </div>
                                <BookOpen className="w-10 h-10 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-600">Đang học</p>
                                    <p className="text-3xl font-bold text-orange-600">{stats.inProgress}</p>
                                </div>
                                <Clock className="w-10 h-10 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-600">Đã hoàn thành</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                                </div>
                                <Award className="w-10 h-10 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* TABS */}
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="bg-white shadow-sm">
                        <TabsTrigger value="all">Tất cả ({stats.total})</TabsTrigger>
                        <TabsTrigger value="in-progress">Đang học ({stats.inProgress})</TabsTrigger>
                        <TabsTrigger value="completed">Đã hoàn thành ({stats.completed})</TabsTrigger>
                    </TabsList>

                    <TabsContent value={selectedTab} className="mt-6 space-y-6">

                        {/* COURSE CARDS */}
                        {paginated.map((course) => (
                            <Card
                                key={course.courseID}
                                className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-100 bg-white"
                            >
                                <div className="flex flex-col lg:flex-row">

                                    {/* IMAGE WITH OVERLAY */}
                                    <div className="relative lg:w-64 w-full">
                                        <img
                                            src={course.thumbnailURL}
                                            alt={course.courseTitle}
                                            className="h-48 lg:h-full w-full object-cover"
                                        />

                                        {/* OVERLAY */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>

                                        {/* LANGUAGE BADGE */}
                                        <Badge className="absolute top-3 left-3 bg-white/90 text-gray-900 shadow">
                                            {course.language}
                                        </Badge>

                                        {/* COMPLETED BADGE */}
                                        {course.isCompleted && (
                                            <Badge className="absolute top-3 right-3 bg-green-600 text-white shadow">
                                                <Award className="w-3 h-3 mr-1" /> Hoàn thành
                                            </Badge>
                                        )}
                                    </div>

                                    {/* RIGHT CONTENT */}
                                    <div className="flex-1 p-6 space-y-5">

                                        {/* TITLE + TUTOR */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900">
                                                    {course.courseTitle}
                                                </h3>
                                                <p className="text-gray-600 flex items-center gap-2 mt-1">
                                                    <BookOpen className="w-4 h-4" /> {course.tutorName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* PROGRESS */}
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span>Tiến độ</span>
                                                <span className="font-semibold text-blue-700">
                                                    {Math.round(course.progressPercent)}%
                                                </span>
                                            </div>

                                            <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-blue-600 transition-all"
                                                    style={{ width: `${course.progressPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* DATE */}
                                        <p className="text-gray-600 text-sm">
                                            Đã đăng ký:{" "}
                                            {new Date(course.enrolledAt).toLocaleDateString("vi-VN")}
                                        </p>

                                        {/* ACTIONS */}
                                        <div className="flex gap-3">
                                            {!course.isCompleted ? (
                                                <Button
                                                    asChild
                                                    className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                                >
                                                    <Link to={`/courses/${course.courseID}`}>
                                                        <Play className="w-4 h-4 mr-2" />
                                                        Tiếp tục học
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    asChild
                                                    className="flex-1 py-5 rounded-lg border-gray-300 hover:bg-gray-50"
                                                >
                                                    <Link to={`/courses/${course.courseID}`}>
                                                        Xem lại khóa học
                                                    </Link>
                                                </Button>
                                            )}

                                            <Button
                                                variant="outline"
                                                className="rounded-lg border-gray-300 hover:bg-gray-50"
                                                asChild
                                            >
                                                <Link to={`/courses/${course.courseID}`}>
                                                    <ChevronRight className="w-5 h-5" />
                                                </Link>
                                            </Button>
                                        </div>

                                    </div>
                                </div>
                            </Card>
                        ))}

                        {/* EMPTY STATE */}
                        {paginated.length === 0 && (
                            <div className="text-center py-20 text-gray-600 text-lg">
                                Không tìm thấy khóa học
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* PAGINATION */}
                <div className="flex justify-center mt-10 gap-4">

                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="rounded-full px-6"
                    >
                        Trước
                    </Button>

                    <div className="px-5 py-2 bg-white shadow rounded-full text-gray-700 font-medium">
                        Trang {page} / {pageCount}
                    </div>

                    <Button
                        variant="outline"
                        disabled={page === pageCount}
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        className="rounded-full px-6"
                    >
                        Sau
                    </Button>

                </div>

            </div>
        </div>
    );
};

export default MyEnrollments;
