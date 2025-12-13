import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, Edit2, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/config/axiosConfig";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";
type FilterRating = "all" | "5" | "4" | "3" | "2" | "1";

interface TutorFeedback {
  feedbackID: number;
  rating: number;
  comment: string;
  createdAt: string;
  learnerName: string;
  learnerAvatarURL: string;
}

interface Review {
  id: number;
  studentName: string;
  studentFlag: string;
  rating: number;
  date: string;
  comment: string;
  avatarURL?: string;
}

interface BookingPlan {
  bookingPlanId: number;
  hasFeedback: boolean;
  feedbackId?: number;
  startTime?: string;
  dayOfWeek?: string;
}

interface ReviewsSectionProps {
  tutorId: number;
  initialFeedbacks?: TutorFeedback[];
}

const ReviewsSection = ({ tutorId, initialFeedbacks = [] }: ReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userBookings, setUserBookings] = useState<BookingPlan[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  
  // Form state
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState<number | null>(null);
  const [selectedBookingPlanId, setSelectedBookingPlanId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter and pagination state
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterRating, setFilterRating] = useState<FilterRating>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  const { toast } = useToast();

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  useEffect(() => {
    const mapFeedbacks = () => {
      try {
        setLoading(true);

        const mapped: Review[] = initialFeedbacks.map((f) => ({
          id: f.feedbackID,
          studentName: f.learnerName || "Anonymous",
          studentFlag: "🌍",
          rating: f.rating || 0,
          date: f.createdAt
              ? new Date(f.createdAt).toLocaleString("vi-VN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Unknown",
          comment: f.comment || "No comment provided.",
          avatarURL: f.learnerAvatarURL,
        }));

        setReviews(mapped);
      } catch (err) {
        console.error("Error mapping reviews:", err);
        setError("Unable to load reviews.");
      } finally {
        setLoading(false);
      }
    };

    mapFeedbacks();
  }, [initialFeedbacks]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
        if (!token) return;

        const userRes = await api.get("/users/myInfo");
        const userId = userRes.data.result.userID;
        const userName = userRes.data.result.fullName || userRes.data.result.username;
        setCurrentUserId(userId);
        setCurrentUserName(userName);

        console.log("🔍 Debug Reviews - Current User:", { userId, userName });

        // Fetch user's booking slots
        const slotsRes = await api.get("/booking-slots/my-slots");
        const allSlots = slotsRes.data.result || [];
        
        console.log("🔍 Debug Reviews - All Slots:", allSlots);
        console.log("🔍 Debug Reviews - Looking for tutorId:", tutorId);
        
        // Filter slots for this tutor and group by booking plan
        const tutorSlots = allSlots.filter(
          (slot: any) => {
            console.log("🔍 Debug Reviews - Checking slot:", {
              slotTutorID: slot.tutorID,
              slotUserID: slot.userID,
              targetTutorId: tutorId,
              targetUserId: userId,
              matches: slot.tutorID === tutorId && slot.userID === userId
            });
            return slot.tutorID === tutorId && slot.userID === userId;
          }
        );

        console.log("🔍 Debug Reviews - Filtered tutor slots:", tutorSlots);

        // Get unique booking plans with earliest slot time
        const bookingPlansMap = new Map<number, BookingPlan>();
        tutorSlots.forEach((slot: any) => {
          const planId = slot.bookingPlanID;
          const startTime = slot.startTime;
          
          if (!bookingPlansMap.has(planId)) {
            const date = new Date(startTime);
            const daysOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            const dayOfWeek = daysOfWeek[date.getDay()];
            
            bookingPlansMap.set(planId, {
              bookingPlanId: planId,
              hasFeedback: false,
              feedbackId: undefined,
              startTime: startTime,
              dayOfWeek: dayOfWeek,
            });
          } else {
            // Update with earliest time if this slot is earlier
            const existing = bookingPlansMap.get(planId)!;
            if (new Date(startTime) < new Date(existing.startTime!)) {
              const date = new Date(startTime);
              const daysOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
              const dayOfWeek = daysOfWeek[date.getDay()];
              
              existing.startTime = startTime;
              existing.dayOfWeek = dayOfWeek;
            }
          }
        });

        const bookingPlans = Array.from(bookingPlansMap.values());
        console.log("🔍 Debug Reviews - Final booking plans:", bookingPlans);
        
        setUserBookings(bookingPlans);
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };

    fetchUserInfo();
  }, [tutorId, reviews]);

  const handleCreateFeedback = async () => {
    if (!selectedBookingPlanId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn booking để đánh giá",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/booking-feedback/${selectedBookingPlanId}`, {
        rating,
        comment,
      });

      const newFeedback = response.data.result;

      toast({
        title: "Thành công",
        description: "Đánh giá của bạn đã được gửi",
        duration: 3000,
      });

      // Add new review to state
      const newReview: Review = {
        id: newFeedback.feedbackID,
        studentName: currentUserName || "You",
        studentFlag: "🌍",
        rating: rating,
        date: new Date().toLocaleString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        comment: comment,
        avatarURL: newFeedback.userAvatarURL,
      };
      
      setReviews(prev => [newReview, ...prev]);

      // Update booking status
      setUserBookings(prev => prev.map(b => 
        b.bookingPlanId === selectedBookingPlanId 
          ? { ...b, hasFeedback: true, feedbackId: newFeedback.feedbackID }
          : b
      ));

      resetForm();
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể gửi đánh giá",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFeedback = async () => {
    if (!editingFeedbackId) return;

    try {
      setSubmitting(true);
      await api.put(`/booking-feedback/${editingFeedbackId}`, {
        rating,
        comment,
      });

      toast({
        title: "Thành công",
        description: "Đánh giá đã được cập nhật",
        duration: 3000,
      });

      // Update review in state
      setReviews(prev => prev.map(r => 
        r.id === editingFeedbackId 
          ? { ...r, rating, comment }
          : r
      ));

      resetForm();
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể cập nhật đánh giá",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<number | null>(null);

  const handleDeleteFeedback = async () => {
    if (!deletingFeedbackId) return;

    try {
      await api.delete(`/booking-feedback/${deletingFeedbackId}`);

      toast({
        title: "Thành công",
        description: "Đánh giá đã được xóa",
        duration: 3000,
      });

      // Remove review from state
      setReviews(prev => prev.filter(r => r.id !== deletingFeedbackId));

      // Update booking status
      setUserBookings(prev => prev.map(b => 
        b.feedbackId === deletingFeedbackId 
          ? { ...b, hasFeedback: false, feedbackId: undefined }
          : b
      ));

      setDeleteDialogOpen(false);
      setDeletingFeedbackId(null);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể xóa đánh giá",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const startEditFeedback = (feedbackId: number, currentRating: number, currentComment: string) => {
    setEditingFeedbackId(feedbackId);
    setRating(currentRating);
    setComment(currentComment);
    setShowFeedbackForm(true);
  };

  const resetForm = () => {
    setShowFeedbackForm(false);
    setEditingFeedbackId(null);
    setSelectedBookingPlanId(null);
    setRating(5);
    setComment("");
  };

  const canWriteReview = userBookings.some(b => !b.hasFeedback);
  const hasBookedWithTutor = userBookings.length > 0;

  console.log("🔍 Debug Reviews - Review Status:", {
    userBookings,
    canWriteReview,
    hasBookedWithTutor,
    currentUserId,
    showFeedbackForm
  });

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = [...reviews];

    // Filter by rating
    if (filterRating !== "all") {
      const targetRating = parseInt(filterRating);
      filtered = filtered.filter(r => Math.floor(r.rating) === targetRating);
    }

    // Sort reviews
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "rating-desc":
          return b.rating - a.rating;
        case "rating-asc":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return filtered;
  }, [reviews, sortBy, filterRating]);

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
      <motion.div
          className="bg-white rounded-xl p-8 shadow-md"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Đánh giá của học viên
          </h2>
          
          {currentUserId && canWriteReview && !showFeedbackForm && (
            <Button onClick={() => setShowFeedbackForm(true)}>
              Viết đánh giá
            </Button>
          )}
        </div>

        {/* Quảng cáo kêu gọi book nếu chưa book */}
        {currentUserId && !hasBookedWithTutor && !showFeedbackForm && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Chia sẻ trải nghiệm của bạn!
                </h3>
                <p className="text-gray-700 mb-4">
                  Đặt lịch học với gia sư này để có thể viết đánh giá và giúp cộng đồng học viên khác có thêm thông tin hữu ích.
                </p>
                <Button 
                  onClick={() => window.location.href = `/book-tutor/${tutorId}`}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Đặt lịch ngay
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Form */}
        {showFeedbackForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingFeedbackId ? "Chỉnh sửa đánh giá" : "Viết đánh giá mới"}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingFeedbackId && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn buổi học
                </label>
                <select
                  value={selectedBookingPlanId || ""}
                  onChange={(e) => setSelectedBookingPlanId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn buổi học --</option>
                  {userBookings
                    .filter(b => !b.hasFeedback)
                    .map(b => (
                      <option key={b.bookingPlanId} value={b.bookingPlanId}>
                        Booking {b.dayOfWeek}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                rows={4}
                className="w-full"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={editingFeedbackId ? handleUpdateFeedback : handleCreateFeedback}
                disabled={submitting || (!editingFeedbackId && !selectedBookingPlanId)}
              >
                {submitting ? "Đang gửi..." : editingFeedbackId ? "Cập nhật" : "Gửi đánh giá"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Hủy
              </Button>
            </div>
          </div>
        )}

        {loading && (
            <p className="text-gray-500 text-center py-4">Đang tải đánh giá...</p>
        )}

        {error && <p className="text-red-500 text-center py-4">{error}</p>}

        {!loading && !error && reviews.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Chưa có đánh giá nào cho gia sư này.
            </p>
        )}

        {!loading && !error && reviews.length > 0 && (
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
                        <SelectItem value="5">5 sao ⭐⭐⭐⭐⭐</SelectItem>
                        <SelectItem value="4">4 sao ⭐⭐⭐⭐</SelectItem>
                        <SelectItem value="3">3 sao ⭐⭐⭐</SelectItem>
                        <SelectItem value="2">2 sao ⭐⭐</SelectItem>
                        <SelectItem value="1">1 sao ⭐</SelectItem>
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

              {/* Reviews List */}
              {filteredAndSortedReviews.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Không tìm thấy đánh giá phù hợp với bộ lọc.
                </p>
              ) : (
                <>
                  <div className="space-y-6">
                    {paginatedReviews.map((review) => {
                const isUserReview = currentUserName && review.studentName === currentUserName;
                
                return (
                  <div
                      key={review.id}
                      className="border-b border-gray-200 pb-6 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {review.avatarURL ? (
                            <img
                                src={review.avatarURL}
                                alt={review.studentName}
                                className="w-8 h-8 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs text-white font-semibold ${review.avatarURL ? 'hidden' : ''}`}>
                          {review.studentName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                        </div>
                        <span className="font-medium text-gray-900">
                          {review.studentName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {Array.from({ length: Math.max(0, Math.min(5, Math.floor(review.rating || 0))) }).map((_, i) => (
                                <Star
                                    key={i}
                                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                                />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>

                        {isUserReview && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditFeedback(review.id, review.rating, review.comment)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingFeedbackId(review.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                );
              })}
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
          </>
        )}
      </>
    )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa đánh giá</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeletingFeedbackId(null);
                }}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteFeedback}
              >
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
  );
};

export default ReviewsSection;
