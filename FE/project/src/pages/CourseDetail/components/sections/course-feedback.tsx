import { useState, useEffect, useMemo } from "react";
import { Star, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/config/axiosConfig";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AxiosError } from "axios";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";
type FilterRating = "all" | "5" | "4" | "3" | "2" | "1";

interface CourseFeedbackProps {
    feedbacks?: {
        feedbackID: number;
        userFullName: string;
        userAvatarURL: string;
        rating: number;
        comment: string;
        createdAt: string;
        userID?: number;
    }[];
    courseId: number;
    isPurchased: boolean | null;
}

const CourseFeedback = ({ feedbacks = [], courseId, isPurchased }: CourseFeedbackProps) => {

    const { toast } = useToast();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [localFeedbacks, setLocalFeedbacks] = useState(feedbacks);
    const [loading, setLoading] = useState(false);
    const [currentProgress, setCurrentProgress] = useState<number>(0);
    const [hasReviewed, setHasReviewed] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);

    // Filter and pagination state
    const [sortBy, setSortBy] = useState<SortOption>("date-desc");
    const [filterRating, setFilterRating] = useState<FilterRating>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const reviewsPerPage = 5;

    // Fetch current user's progress
    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
                if (!token || !isPurchased) return;

                // Lấy progress từ API student/courses giống như lesson detail
                const courseRes = await api.get(`/student/courses/${courseId}`);
                const courseData = courseRes.data.result;
                
                if (courseData?.progressPercent !== undefined) {
                    setCurrentProgress(courseData.progressPercent);
                }

                // Check if user already reviewed
                const userRes = await api.get('/users/myInfo');
                const currentUserID = userRes.data.result?.userID;
                
                const userReview = feedbacks.find((fb) => fb.userID === currentUserID);
                setHasReviewed(!!userReview);
            } catch (error) {
                console.error('Failed to fetch progress:', error);
            }
        };

        fetchProgress();
    }, [courseId, isPurchased, feedbacks]);

    const getUserInitial = (fullName: string) => {
        if (!fullName) return "U";
        return fullName.trim()[0].toUpperCase();
    };

    /**  Submit Review */
    const submitReview = async () => {
        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

        if (!token) {
            toast({
                variant: "destructive",
                title: "You are not logged in",
                description: "Please login before submitting a review.",
            });
            return;
        }

        if (!isPurchased) {
            toast({
                variant: "destructive",
                title: "Purchase required",
                description: "You must purchase the course before rating.",
            });
            return;
        }

        if (rating < 1 || rating > 5) {
            toast({
                variant: "destructive",
                title: "Invalid rating",
                description: "Rating must be between 1 and 5 stars.",
            });
            return;
        }

        if (!comment.trim()) {
            toast({
                variant: "destructive",
                title: "Empty review",
                description: "Please enter your review.",
            });
            return;
        }

        setLoading(true);
        try {
            // Check progress before submitting - phải >= 50% (bằng 50% là được)
            const courseRes = await api.get(`/student/courses/${courseId}`);
            const progress = courseRes.data.result?.progressPercent || 0;
            
            if (progress < 50) {
                toast({
                    variant: "destructive",
                    title: "Chưa đủ tiến độ",
                    description: `Bạn phải hoàn thành ít nhất 50% khóa học để đánh giá. Tiến độ hiện tại: ${Math.round(progress)}%`,
                });
                setLoading(false);
                return;
            }

            const res = await api.post(`/review/${courseId}`, { rating, comment });
            const newReview = res.data.result;

            setLocalFeedbacks((prev) => [{ ...newReview }, ...prev]);
            setRating(0);
            setComment("");

            toast({
                variant: "success",
                title: "Review submitted 🎉",
            });

        } catch (error) {
            const err = error as AxiosError<{ message?: string }>;
            const errorMsg = err.response?.data?.message || "Something went wrong.";
            
            toast({
                variant: "destructive",
                title: "Review submission failed",
                description: errorMsg,
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteReview = async () => {
        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

        if (!token) {
            toast({
                variant: "destructive",
                title: "You are not logged in",
                description: "Please login before deleting a review.",
            });
            setDeleteDialogOpen(false);
            return;
        }

        if (!selectedReviewId) {
            setDeleteDialogOpen(false);
            return;
        }

        try {
            await api.delete(`/review/${selectedReviewId}`);

            setLocalFeedbacks((prev) =>
                prev.filter((fb) => fb.feedbackID !== selectedReviewId)
            );

            setDeleteDialogOpen(false);


            toast({
                variant: "success",
                title: "Review deleted successfully",
            });

        } catch (error) {
            const err = error as AxiosError<{ message?: string }>;

            toast({
                variant: "destructive",
                title: "Delete failed",
                description: err.response?.data?.message || "Something went wrong.",
            });
        }
    };

    // Filter and sort reviews
    const filteredAndSortedReviews = useMemo(() => {
        let filtered = [...localFeedbacks];

        // Filter by rating
        if (filterRating !== "all") {
            const targetRating = parseInt(filterRating);
            filtered = filtered.filter(r => Math.floor(r.rating) === targetRating);
        }

        // Sort reviews
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "date-desc":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "date-asc":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "rating-desc":
                    return b.rating - a.rating;
                case "rating-asc":
                    return a.rating - b.rating;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [localFeedbacks, sortBy, filterRating]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedReviews.length / reviewsPerPage);
    const paginatedReviews = useMemo(() => {
        const startIndex = (currentPage - 1) * reviewsPerPage;
        const endIndex = startIndex + reviewsPerPage;
        return filteredAndSortedReviews.slice(startIndex, endIndex);
    }, [filteredAndSortedReviews, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, filterRating]);

    return (
        <div className="bg-white rounded-xl p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Đánh giá của học viên</h2>

            <div className="mb-8 border rounded-xl p-6 bg-gray-50">
                <h3 className="font-semibold mb-3">Viết đánh giá</h3>
                
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    <p className="font-medium mb-1">📝 Hướng dẫn đánh giá:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Bạn chỉ có thể gửi một đánh giá cho mỗi khóa học</li>
                        <li>Bạn phải hoàn thành ít nhất 50% khóa học để có thể đánh giá</li>
                        {isPurchased && (
                            <li className="font-semibold">
                                Tiến độ hiện tại của bạn: {currentProgress.toFixed(1)}%
                                {currentProgress < 50 && <span className="text-red-600"> (Cần thêm {(50 - currentProgress).toFixed(1)}%)</span>}
                                {currentProgress >= 50 && <span className="text-green-600"> ✓ Đủ điều kiện đánh giá (≥50%)</span>}
                            </li>
                        )}
                        {hasReviewed && (
                            <li className="font-semibold text-orange-600">
                                ⚠️ Bạn đã gửi đánh giá cho khóa học này rồi
                            </li>
                        )}
                    </ul>
                </div>

                <div className="flex gap-1 mb-3 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <Star
                            key={num}
                            onClick={() => setRating(num)}
                            className={`w-6 h-6 ${
                                num <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                            }`}
                        />
                    ))}
                </div>

                <textarea
                    className="w-full border rounded-lg p-3 text-gray-700 focus:ring-blue-500"
                    rows={3}
                    placeholder="Viết đánh giá của bạn..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                <button
                    onClick={submitReview}
                    disabled={loading || !isPurchased || currentProgress < 50 || hasReviewed}
                    className="mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {loading ? "Đang gửi..." : 
                     !isPurchased ? "Yêu cầu mua khóa học" :
                     currentProgress < 50 ? `Cần ≥50% tiến độ (hiện tại: ${currentProgress.toFixed(1)}%)` :
                     hasReviewed ? "Đã đánh giá" :
                     "Gửi đánh giá"}
                </button>
            </div>

            {/* Reviews List */}
            {localFeedbacks.length > 0 && (
                <>
                    {/* Filters Section */}
                    <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Lọc theo sao:
                                </label>
                                <Select value={filterRating} onValueChange={(value: FilterRating) => setFilterRating(value)}>
                                    <SelectTrigger className="w-[140px] bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="5">
                                            <div className="flex items-center gap-1">
                                                <span>5 sao</span>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="4">
                                            <div className="flex items-center gap-1">
                                                <span>4 sao</span>
                                                {[...Array(4)].map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="3">
                                            <div className="flex items-center gap-1">
                                                <span>3 sao</span>
                                                {[...Array(3)].map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="2">
                                            <div className="flex items-center gap-1">
                                                <span>2 sao</span>
                                                {[...Array(2)].map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="1">
                                            <div className="flex items-center gap-1">
                                                <span>1 sao</span>
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Sắp xếp:
                                </label>
                                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                                    <SelectTrigger className="w-[180px] bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="date-desc">Mới nhất</SelectItem>
                                        <SelectItem value="date-asc">Cũ nhất</SelectItem>
                                        <SelectItem value="rating-desc">Sao cao nhất</SelectItem>
                                        <SelectItem value="rating-asc">Sao thấp nhất</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="text-sm text-gray-600">
                            Hiển thị {filteredAndSortedReviews.length} đánh giá
                        </div>
                    </div>
                </>
            )}

            <div className="space-y-6 mt-4">
                {(localFeedbacks?.length ?? 0) === 0 && (
                    <p className="text-gray-500">Chưa có đánh giá nào.</p>
                )}

                {filteredAndSortedReviews.length === 0 && localFeedbacks.length > 0 && (
                    <p className="text-gray-500 text-center py-4">
                        Không tìm thấy đánh giá phù hợp với bộ lọc.
                    </p>
                )}

                {paginatedReviews.map((fb) => (
                    <div key={fb.feedbackID} className="border-b pb-6">
                        <div className="flex items-center gap-4 mb-2">
                            {fb.userAvatarURL ? (
                                <img 
                                    src={fb.userAvatarURL} 
                                    className="w-12 h-12 rounded-full object-cover" 
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${fb.userAvatarURL ? 'hidden' : ''}`}>
                                {getUserInitial(fb.userFullName)}
                            </div>

                            <div>
                                <h3 className="font-semibold flex gap-2 items-center">
                                    {fb.userFullName}
                                    <span className="text-gray-500 text-xs">
                                        {new Date(fb.createdAt).toLocaleString("vi-VN", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </h3>

                                <div className="flex text-yellow-400">
                                    {Array.from({ length: fb.rating }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400" />
                                    ))}
                                </div>
                            </div>

                            {(localStorage.getItem("access_token") || sessionStorage.getItem("access_token")) && (
                                <Trash2
                                    onClick={() => {
                                        setSelectedReviewId(fb.feedbackID);
                                        setDeleteDialogOpen(true);
                                    }}
                                    className="w-5 h-5 text-red-500 ml-auto cursor-pointer hover:text-red-700"
                                />
                            )}
                        </div>

                        <p className="text-gray-700">{fb.comment}</p>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Trước
                    </Button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // Show first page, last page, current page, and pages around current
                            const showPage = 
                                page === 1 || 
                                page === totalPages || 
                                (page >= currentPage - 1 && page <= currentPage + 1);
                            
                            const showEllipsis = 
                                (page === currentPage - 2 && currentPage > 3) ||
                                (page === currentPage + 2 && currentPage < totalPages - 2);

                            if (showEllipsis) {
                                return (
                                    <span key={page} className="px-2 text-gray-400">
                                        ...
                                    </span>
                                );
                            }

                            if (!showPage) return null;

                            return (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className="min-w-[40px]"
                                >
                                    {page}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1"
                    >
                        Sau
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Delete Confirm Dialog - small width */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-sm w-full">
                    <DialogHeader>
                        <DialogTitle>Xóa đánh giá?</DialogTitle>
                        <p className="text-sm text-gray-500">
                            Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
                        </p>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={deleteReview}>
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CourseFeedback;
