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
public class AdminDashboardResponse {

    // 1) Actionable items (thanh trên cùng: Pending Tutors, Pending Courses, Refund, Withdraw...)
    ActionableItems actionableItems;

    // 2) Financial overview (GMV, Commission, Payout, Avg Order)
    FinancialOverview financialOverview;

    // 3) Revenue Breakdown chart (GMV / Commission / Payout theo ngày)
    List<DailyRevenuePoint> revenueBreakdown;

    // 4) Revenue by Language (English, Japanese, ...)
    List<LanguageRevenueItem> revenueByLanguage;

    // 5) Growth metrics (Users, Tutors, Courses, Enrollments + Conversion/Retention/Churn)
    GrowthMetrics growthMetrics;

    // 6) Monthly growth chart
    List<MonthlyGrowthPoint> monthlyGrowth;

    // 7) Recent users
    List<RecentUserItem> recentUsers;

    // 8) Recent courses
    List<RecentCourseItem> recentCourses;

    // 9) Pending approvals (tutor verify, course draft, course, refund, withdraw)
    List<PendingApprovalItem> pendingApprovals;

    // ==================== NESTED DTOs ====================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class ActionableItems {
        long pendingTutors;
        long pendingCourses;          // course + course_draft
        long pendingRefundRequests;
        long pendingWithdraws;
        long reportedContents;        // hiện để 0 (chưa có bảng report)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class FinancialOverview {
        BigDecimal totalGMV;          // Tổng tiền user trả
        BigDecimal totalCommission;   // Tiền nền tảng giữ lại
        BigDecimal totalPayout;       // Tiền sẽ trả tutor
        BigDecimal avgOrderValue;     // Giá trị đơn trung bình
        long totalPaidOrders;         // Tổng số payment PAID
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class DailyRevenuePoint {
        LocalDate date;
        BigDecimal gmv;
        BigDecimal commission;
        BigDecimal payout;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class LanguageRevenueItem {
        String language;              // English, Japanese, ...
        BigDecimal gmv;
        BigDecimal commission;
        BigDecimal payout;
        long courseCount;             // số course liên quan trong kỳ
        double percentGMV;            // % trên total GMV
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class GrowthMetrics {
        long totalUsers;
        long activeUsers;
        long totalTutors;
        long activeTutors;
        long totalCourses;
        long totalEnrollments;

        double conversionRate;        // % user đã enroll ít nhất 1 course
        double retentionRate;         // % user còn active
        double churnRate;             // 100 - retentionRate
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class MonthlyGrowthPoint {
        int year;
        int month;                    // 1..12
        long newUsers;
        long newTutors;
        long newEnrollments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class RecentUserItem {
        Long userId;
        String fullName;
        String email;
        String role;                  // "Admin" / "Tutor" / "Learner" (hoặc null)
        LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class RecentCourseItem {
        Long courseId;
        String title;
        String language;
        String level;                 // BEGINNER / ...
        String tutorName;
        String status;                // Draft / Pending / Approved / ...
        LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = PRIVATE)
    public static class PendingApprovalItem {
        String type;                  // TUTOR_VERIFICATION / COURSE_DRAFT / COURSE / REFUND / WITHDRAW
        Long id;
        String title;
        String subtitle;
        LocalDateTime createdAt;
        String priority;              // HIGH / MEDIUM / LOW (cho FE tô màu)
    }
}
