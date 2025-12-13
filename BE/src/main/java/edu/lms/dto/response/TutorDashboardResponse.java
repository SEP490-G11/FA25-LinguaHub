// src/main/java/edu/lms/dto/response/dashboard/TutorDashboardResponse.java
package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = PRIVATE)
public class TutorDashboardResponse {

    PerformanceMetrics performanceMetrics;

    List<RatingDistributionItem> ratingDistribution;

    List<RevenueTrendPoint> revenueTrend;

    List<CourseSalesItem> salesByCourse;

    List<WeeklyEngagementItem> studentEngagement;

    List<UpcomingSessionItem> upcomingSessions;

    long pendingRefundRequests;

    List<RecentReviewItem> recentReviews;

    // --- Nested DTOs ---

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class PerformanceMetrics {
        BigDecimal totalRevenue;      // Tổng doanh thu (gross)
        BigDecimal netRevenue;        // Doanh thu sau commission
        long activeStudents;          // Số học viên đang Active
        long totalEnrollments;        // Tổng enrollments
        double completionRate;        // % enrollments Completed
        double instructorRating;      // Điểm trung bình
        long totalReviews;            // Tổng số review course
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class RatingDistributionItem {
        int stars;        // 1..5
        long count;       // số lượng review
        double percent;   // phần trăm trên tổng review
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class RevenueTrendPoint {
        LocalDate date;         // theo ngày
        BigDecimal amount;      // doanh thu ngày đó
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class CourseSalesItem {
        Long courseId;
        String courseTitle;
        BigDecimal revenue;
        double percent;     // (%) trong tổng revenue
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class WeeklyEngagementItem {
        int weekIndex;          // 1,2,3,4...
        double hours;           // tổng số giờ xem video
        long lessonCount;       // số lesson completed
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class UpcomingSessionItem {
        Long slotId;
        LocalDateTime startTime;
        LocalDateTime endTime;
        String studentName;
        String studentEmail;
        String title;       // có thể là tên package / tùy bạn
        String status;      // Locked / Paid
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class RecentReviewItem {
        Long reviewId;
        String studentName;
        String courseTitle;
        double rating;
        String comment;
        LocalDateTime createdAt;
    }
}
