import  { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    CreditCard,
    Download,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    Search,
    ArrowUpDown,
    Calendar,
    Bookmark,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import api from "@/config/axiosConfig";

// Interfaces for data types
interface Payment {
    paymentID: number;
    userId: number;
    tutorId: number;
    targetId: number;
    paymentType: string;
    paymentMethod: string;
    status: string;
    amount: number;
    isPaid: boolean;
    isRefund: boolean;
    orderCode: string;
    createdAt: string;
    paidAt: string | null;
    description: string;
    expiresAt: string;
}

interface Course {
    id: number;
    title: string;
    tutorName: string;
}

// Main Payment History Component
const PaymentHistory = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Sort filters
    const [dateSort, setDateSort] = useState("newest");
    const [priceSort, setPriceSort] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 5;

    // Get User ID
    const getUserId = async (): Promise<number | null> => {
        try {
            const res = await api.get("/users/myInfo");
            return res.data?.result?.userID || null;
        } catch {
            return null;
        }
    };

    // Fetch Payments + Courses
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userId = await getUserId();
                if (!userId) return;

                const [paymentsRes, coursesRes] = await Promise.all([
                    api.get(`/api/payments/user/${userId}`),
                    api.get("/courses/public/approved")
                ]);

                const sortedPayments = [...paymentsRes.data].sort(
                    (a: Payment, b: Payment) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                setPayments(sortedPayments);
                setCourses(coursesRes.data.result || []);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Currency format helper
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("vi-VN").format(amount) + " đ";

    // Status Badge Mapping
    const statusBadgeMap: Record<string, JSX.Element> = {
        PAID: <Badge className="bg-green-100 text-green-700 px-3 py-1">Đã thanh toán</Badge>,
        EXPIRED: <Badge className="bg-orange-100 text-orange-700 px-3 py-1">Hết hạn</Badge>,
        FAILED: <Badge className="bg-red-100 text-red-700 px-3 py-1">Thất bại</Badge>,
    };

    const statusIconMap: Record<string, JSX.Element> = {
        PAID: <CheckCircle className="w-6 h-6 text-green-600" />,
        EXPIRED: <Clock className="w-6 h-6 text-orange-600" />,
        FAILED: <XCircle className="w-6 h-6 text-red-600" />,
    };

    const getStatusBadge = (status: string) =>
        statusBadgeMap[status.toUpperCase()] || <Badge>{status}</Badge>;

    const getStatusIcon = (status: string) =>
        statusIconMap[status.toUpperCase()] || <Clock className="w-6 h-6" />;

    const getCourseInfo = (courseId: number) =>
        courses.find((c) => c.id === courseId);

    // Filter and sort logic
    const filtered = payments
        .filter((p) => {
            const course = getCourseInfo(p.targetId);
            const query = searchQuery.toLowerCase();

            const searchMatch =
                (!p.paymentType.includes("Booking") &&
                    course?.title?.toLowerCase().includes(query)) ||
                p.orderCode.toLowerCase().includes(query);

            const statusMatch =
                statusFilter === "all" ||
                p.status.toUpperCase() === statusFilter.toUpperCase();

            return searchMatch && statusMatch;
        })
        .sort((a, b) => {
            if (priceSort === "high-low") return b.amount - a.amount;
            if (priceSort === "low-high") return a.amount - b.amount;

            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();

            return dateSort === "newest" ? dateB - dateA : dateA - dateB;
        });

    // Pagination logic
    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, statusFilter, dateSort, priceSort]);

    // Stats
    const stats = {
        totalPaid: payments.filter((p) => p.status === "PAID").length,
        totalAmount: payments
            .filter((p) => p.status === "PAID")
            .reduce((sum, p) => sum + p.amount, 0),
        expired: payments.filter((p) => p.status === "EXPIRED").length,
        failed: payments.filter((p) => p.status === "FAILED").length,
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl">Đang tải lịch sử thanh toán...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">

            {/* TITLE */}
            <h1 className="text-3xl font-bold mb-6">Lịch sử thanh toán</h1>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[{ label: "Đã thanh toán", value: stats.totalPaid }, { label: "Tổng chi tiêu", value: formatCurrency(stats.totalAmount) }, { label: "Hết hạn", value: stats.expired }, { label: "Thất bại", value: stats.failed }].map((item) => (
                    <Card key={item.label} className="shadow-sm rounded-xl">
                        <CardContent className="pt-6">
                            <p className="text-gray-600">{item.label}</p>
                            <p className="text-3xl font-bold">{item.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* FILTER BAR */}
            <Card className="mb-6 shadow-md rounded-xl">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold">Giao dịch</CardTitle>
                        <div className="flex gap-3">

                            {/* Search */}
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm theo tên khóa học hoặc mã đơn hàng..."
                                    className="pl-12"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Status Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Filter className="w-4 h-4" />
                                        {statusFilter.toUpperCase()}
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                    {["all", "PAID", "EXPIRED", "FAILED"].map((s) => (
                                        <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                                            {s}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Price Sort */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <ArrowUpDown className="w-4 h-4" />
                                        Giá
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setPriceSort("high-low")}>
                                        Cao → Thấp
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setPriceSort("low-high")}>
                                        Thấp → Cao
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setPriceSort("")}>
                                        Mặc định
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Date Sort */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Clock className="w-4 h-4" />
                                        Ngày
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setDateSort("newest")}>
                                        Mới nhất
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDateSort("oldest")}>
                                        Cũ nhất
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5">

                    {/* LIST ITEMS */}
                    {paginated.map((p) => {
                        const course = getCourseInfo(p.targetId);
                        const isBooking = p.paymentType === "Booking";

                        return (
                            <div
                                key={p.paymentID}
                                className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row justify-between gap-5"
                            >
                                {/* LEFT INFO */}
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shadow-inner">
                                        {getStatusIcon(p.status)}
                                    </div>

                                    <div className="space-y-1">

                                        {/* TITLE */}
                                        {!isBooking ? (
                                            <h3 className="font-bold text-lg text-gray-800">
                                                {course?.title || "Khóa học không xác định"}
                                            </h3>
                                        ) : (
                                            <h3 className="font-bold text-lg text-blue-600 flex items-center gap-2">
                                                <Bookmark className="w-4 h-4" />
                                                Đặt lịch #{p.targetId}
                                            </h3>
                                        )}

                                        {/* SUB INFO */}
                                        <p className="text-gray-600 text-sm flex gap-2 items-center">
                                            <Calendar className="w-4 h-4" />
                                            Tạo lúc: {new Date(p.createdAt).toLocaleString("vi-VN")}
                                        </p>

                                        <p className="text-gray-600 text-sm flex gap-2 items-center">
                                            <Clock className="w-4 h-4" />
                                            Hết hạn: {new Date(p.expiresAt).toLocaleString("vi-VN")}
                                        </p>

                                        {!isBooking && (
                                            <p className="text-gray-600 text-sm">
                                                Gia sư: {course?.tutorName || "N/A"}
                                            </p>
                                        )}

                                        {!isBooking && (
                                            <p className="text-gray-600 text-sm">
                                                Mã đơn hàng: {p.orderCode}
                                            </p>
                                        )}

                                        <div className="mt-2">{getStatusBadge(p.status)}</div>
                                    </div>
                                </div>

                                {/* RIGHT SIDE */}
                                <div className="text-right flex flex-col justify-between">
                                    <p className="text-2xl font-extrabold text-blue-600">
                                        {formatCurrency(p.amount)}
                                    </p>

                                    <div className="flex justify-end gap-2 mt-3">
                                        {/*{p.status === "PAID" && (*/}
                                        {/*    <Button variant="outline" size="sm">*/}
                                        {/*        <Download className="mr-2 w-4 h-4" />*/}
                                        {/*        Receipt*/}
                                        {/*    </Button>*/}
                                        {/*)}*/}

                                        {!isBooking && (
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to={`/courses/${p.targetId}`}>
                                                    <FileText className="mr-2 w-4 h-4" />
                                                    Xem khóa học
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* EMPTY */}
                    {filtered.length === 0 && (
                        <div className="text-center py-14">
                            <CreditCard className="w-16 h-16 mx-auto text-gray-400" />
                            <p className="text-xl font-semibold mt-4 text-gray-600">
                                Không tìm thấy giao dịch
                            </p>
                        </div>
                    )}

                    {/* PAGINATION */}
                    {filtered.length > 0 && (
                        <div className="flex justify-center gap-3 pt-6">
                            <Button
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Trước
                            </Button>

                            <span className="px-4 py-2">
                                Trang {page} / {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Sau
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentHistory;
