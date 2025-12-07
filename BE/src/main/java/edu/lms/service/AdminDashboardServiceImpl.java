package edu.lms.service;

import edu.lms.dto.response.AdminDashboardResponse;
import edu.lms.dto.response.AdminDashboardResponse.*;
import edu.lms.entity.*;
import edu.lms.enums.*;
import edu.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class AdminDashboardServiceImpl implements AdminDashboardService {

    TutorVerificationRepository tutorVerificationRepository;
    CourseDraftRepository courseDraftRepository;
    CourseRepository courseRepository;
    RefundRequestRepository refundRequestRepository;
    WithdrawMoneyRepository withdrawMoneyRepository;
    PaymentRepository paymentRepository;
    SettingRepository settingRepository;
    UserRepository userRepository;
    TutorRepository tutorRepository;
    EnrollmentRepository enrollmentRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard(LocalDate startDate, LocalDate endDate) {

        LocalDateTime from = startDate.atStartOfDay();
        LocalDateTime to = endDate.plusDays(1).atStartOfDay();

        ActionableItems actionableItems = buildActionableItems();
        FinancialOverview financialOverview = buildFinancialOverview(from, to);
        List<DailyRevenuePoint> revenueBreakdown = buildRevenueBreakdown(from, to);
        List<LanguageRevenueItem> revenueByLanguage = buildRevenueByLanguage(from, to, financialOverview.getTotalGMV());
        GrowthMetrics growthMetrics = buildGrowthMetrics();
        List<MonthlyGrowthPoint> monthlyGrowth = buildMonthlyGrowth(startDate, endDate);
        List<RecentUserItem> recentUsers = buildRecentUsers();
        List<RecentCourseItem> recentCourses = buildRecentCourses();
        List<PendingApprovalItem> pendingApprovals = buildPendingApprovals();

        return AdminDashboardResponse.builder()
                .actionableItems(actionableItems)
                .financialOverview(financialOverview)
                .revenueBreakdown(revenueBreakdown)
                .revenueByLanguage(revenueByLanguage)
                .growthMetrics(growthMetrics)
                .monthlyGrowth(monthlyGrowth)
                .recentUsers(recentUsers)
                .recentCourses(recentCourses)
                .pendingApprovals(pendingApprovals)
                .build();
    }

    // ===== 5.1 Actionable Items =====

    private ActionableItems buildActionableItems() {

        long pendingTutors = tutorVerificationRepository.countByStatus(TutorVerificationStatus.PENDING);

        long pendingCourseDrafts = courseDraftRepository.countByStatus(CourseDraftStatus.PENDING_REVIEW);
        long pendingCourses = courseRepository.countByStatus(CourseStatus.Pending) + pendingCourseDrafts;

        long pendingRefunds = refundRequestRepository.countByStatusIn(
                List.of(RefundStatus.PENDING, RefundStatus.SUBMITTED)
        );

        long pendingWithdraws = withdrawMoneyRepository.countByStatus(WithdrawStatus.PENDING);

        return ActionableItems.builder()
                .pendingTutors(pendingTutors)
                .pendingCourses(pendingCourses)
                .pendingRefundRequests(pendingRefunds)
                .pendingWithdraws(pendingWithdraws)
                .reportedContents(0L) // hiện chưa có bảng report
                .build();
    }

    // ===== 5.2 Financial Overview + Revenue Breakdown =====

    private FinancialOverview buildFinancialOverview(LocalDateTime from, LocalDateTime to) {
        List<Payment> payments = paymentRepository
                .findByStatusAndPaidAtBetween(PaymentStatus.PAID, from, to);

        BigDecimal totalGMV = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Setting setting = settingRepository.getCurrentSetting();
        BigDecimal commissionCourse = setting != null ? setting.getCommissionCourse() : BigDecimal.ZERO;
        BigDecimal commissionBooking = setting != null ? setting.getCommissionBooking() : BigDecimal.ZERO;

        BigDecimal totalCommission = BigDecimal.ZERO;

        for (Payment p : payments) {
            if (p.getPaymentType() == PaymentType.Course) {
                totalCommission = totalCommission.add(p.getAmount().multiply(commissionCourse));
            } else if (p.getPaymentType() == PaymentType.Booking) {
                totalCommission = totalCommission.add(p.getAmount().multiply(commissionBooking));
            }
        }

        BigDecimal totalPayout = totalGMV.subtract(totalCommission);
        long totalOrder = payments.size();
        BigDecimal avgOrder = totalOrder == 0
                ? BigDecimal.ZERO
                : totalGMV.divide(BigDecimal.valueOf(totalOrder), 2, BigDecimal.ROUND_HALF_UP);

        return FinancialOverview.builder()
                .totalGMV(totalGMV)
                .totalCommission(totalCommission)
                .totalPayout(totalPayout)
                .avgOrderValue(avgOrder)
                .totalPaidOrders(totalOrder)
                .build();
    }

    private List<DailyRevenuePoint> buildRevenueBreakdown(LocalDateTime from, LocalDateTime to) {
        List<Payment> payments = paymentRepository
                .findByStatusAndPaidAtBetween(PaymentStatus.PAID, from, to);

        Setting setting = settingRepository.getCurrentSetting();
        BigDecimal commissionCourse = setting != null ? setting.getCommissionCourse() : BigDecimal.ZERO;
        BigDecimal commissionBooking = setting != null ? setting.getCommissionBooking() : BigDecimal.ZERO;

        Map<LocalDate, DailyRevenuePoint> map = new HashMap<>();

        for (Payment p : payments) {
            if (p.getPaidAt() == null) continue;
            LocalDate d = p.getPaidAt().toLocalDate();
            DailyRevenuePoint point = map.computeIfAbsent(d,
                    date -> DailyRevenuePoint.builder()
                            .date(date)
                            .gmv(BigDecimal.ZERO)
                            .commission(BigDecimal.ZERO)
                            .payout(BigDecimal.ZERO)
                            .build()
            );

            BigDecimal amount = p.getAmount();
            point.setGmv(point.getGmv().add(amount));

            BigDecimal comm = BigDecimal.ZERO;
            if (p.getPaymentType() == PaymentType.Course) {
                comm = amount.multiply(commissionCourse);
            } else if (p.getPaymentType() == PaymentType.Booking) {
                comm = amount.multiply(commissionBooking);
            }
            point.setCommission(point.getCommission().add(comm));
            point.setPayout(point.getPayout().add(amount.subtract(comm)));
        }

        return map.values().stream()
                .sorted(Comparator.comparing(DailyRevenuePoint::getDate))
                .collect(Collectors.toList());
    }

    // ===== 5.3 Revenue By Language (Course payments) =====

    private List<LanguageRevenueItem> buildRevenueByLanguage(LocalDateTime from,
                                                             LocalDateTime to,
                                                             BigDecimal totalGMV) {

        List<Payment> payments = paymentRepository
                .findByStatusAndPaymentTypeAndPaidAtBetween(
                        PaymentStatus.PAID, PaymentType.Course, from, to
                );

        if (totalGMV == null || totalGMV.compareTo(BigDecimal.ZERO) == 0) {
            totalGMV = BigDecimal.ONE; // tránh chia 0
        }
        Setting setting = settingRepository.getCurrentSetting();
        BigDecimal commissionCourse = setting != null ? setting.getCommissionCourse() : BigDecimal.ZERO;

        Map<String, LanguageRevenueItem> map = new HashMap<>();

        for (Payment p : payments) {
            Long courseId = p.getTargetId();
            if (courseId == null) continue;

            Course course = courseRepository.findById(courseId).orElse(null);
            if (course == null) continue;

            String language = Optional.ofNullable(course.getLanguage()).orElse("Unknown");
            LanguageRevenueItem item = map.computeIfAbsent(language,
                    lang -> LanguageRevenueItem.builder()
                            .language(lang)
                            .gmv(BigDecimal.ZERO)
                            .commission(BigDecimal.ZERO)
                            .payout(BigDecimal.ZERO)
                            .courseCount(0L)
                            .percentGMV(0)
                            .build()
            );

            item.setGmv(item.getGmv().add(p.getAmount()));

            BigDecimal comm = p.getAmount().multiply(commissionCourse);
            item.setCommission(item.getCommission().add(comm));
            item.setPayout(item.getPayout().add(p.getAmount().subtract(comm)));

            item.setCourseCount(item.getCourseCount() + 1);
        }

        BigDecimal finalTotalGMV = totalGMV;

        return map.values().stream()
                .peek(item -> {
                    double percent = item.getGmv()
                            .multiply(BigDecimal.valueOf(100))
                            .divide(finalTotalGMV, 2, BigDecimal.ROUND_HALF_UP)
                            .doubleValue();
                    item.setPercentGMV(percent);
                })
                .sorted((a, b) -> b.getGmv().compareTo(a.getGmv()))
                .collect(Collectors.toList());
    }

    // ===== 5.4 Growth Metrics =====

    private GrowthMetrics buildGrowthMetrics() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActiveTrue();

        long totalTutors = tutorRepository.count();
        long activeTutors = tutorRepository.countByStatus(TutorStatus.APPROVED);

        long totalCourses = courseRepository.count();
        long totalEnrollments = enrollmentRepository.count();

        long usersWithEnrollment = enrollmentRepository.countDistinctLearners();


        double conversionRate = totalUsers == 0
                ? 0.0
                : usersWithEnrollment * 100.0 / totalUsers;

        double retentionRate = totalUsers == 0
                ? 0.0
                : activeUsers * 100.0 / totalUsers;

        double churnRate = 100.0 - retentionRate;

        return GrowthMetrics.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalTutors(totalTutors)
                .activeTutors(activeTutors)
                .totalCourses(totalCourses)
                .totalEnrollments(totalEnrollments)
                .conversionRate(conversionRate)
                .retentionRate(retentionRate)
                .churnRate(churnRate)
                .build();
    }

    // ===== 5.5 Monthly Growth chart =====

    private List<MonthlyGrowthPoint> buildMonthlyGrowth(LocalDate startDate, LocalDate endDate) {

        LocalDate firstDay = YearMonth.from(startDate).atDay(1);
        LocalDate lastDay = YearMonth.from(endDate).atEndOfMonth();

        LocalDateTime from = firstDay.atStartOfDay();
        LocalDateTime to = lastDay.plusDays(1).atStartOfDay();

        List<User> users = userRepository.findByCreatedAtBetween(from, to);
        List<Tutor> tutors = tutorRepository.findByUserCreatedAtBetween(from, to);

        List<Enrollment> enrollments = enrollmentRepository.findByCreatedAtBetween(from, to);

        Map<YearMonth, MonthlyGrowthPoint> map = new HashMap<>();

        for (User u : users) {
            YearMonth ym = YearMonth.from(u.getCreatedAt().toLocalDate());
            MonthlyGrowthPoint p = map.computeIfAbsent(
                    ym,
                    y -> MonthlyGrowthPoint.builder()
                            .year(y.getYear())
                            .month(y.getMonthValue())
                            .newUsers(0)
                            .newTutors(0)
                            .newEnrollments(0)
                            .build()
            );
            p.setNewUsers(p.getNewUsers() + 1);
        }

        for (Tutor t : tutors) {
            YearMonth ym = YearMonth.from(t.getUser().getCreatedAt().toLocalDate());
            MonthlyGrowthPoint p = map.computeIfAbsent(
                    ym,
                    y -> MonthlyGrowthPoint.builder()
                            .year(y.getYear())
                            .month(y.getMonthValue())
                            .newUsers(0)
                            .newTutors(0)
                            .newEnrollments(0)
                            .build()
            );
            p.setNewTutors(p.getNewTutors() + 1);
        }

        for (Enrollment e : enrollments) {
            if (e.getCreatedAt() == null) continue;
            YearMonth ym = YearMonth.from(e.getCreatedAt().toLocalDate());
            MonthlyGrowthPoint p = map.computeIfAbsent(
                    ym,
                    y -> MonthlyGrowthPoint.builder()
                            .year(y.getYear())
                            .month(y.getMonthValue())
                            .newUsers(0)
                            .newTutors(0)
                            .newEnrollments(0)
                            .build()
            );
            p.setNewEnrollments(p.getNewEnrollments() + 1);
        }

        return map.values().stream()
                .sorted(Comparator
                        .comparing(MonthlyGrowthPoint::getYear)
                        .thenComparing(MonthlyGrowthPoint::getMonth))
                .collect(Collectors.toList());
    }

    // ===== 5.6 Recent Users & Recent Courses =====

    private List<RecentUserItem> buildRecentUsers() {
        return userRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(u -> {
                    String role = null;
                    // Nếu User có field enum Role role;
                    if (u.getRole() != null) {
                        role = u.getRole().getName();
                    }
                    // nếu bạn lưu kiểu khác thì sửa lại chỗ này theo entity của bạn

                    return RecentUserItem.builder()
                            .userId(u.getUserID())
                            .fullName(u.getFullName())
                            .email(u.getEmail())
                            .role(role)
                            .createdAt(u.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }


    private List<RecentCourseItem> buildRecentCourses() {
        return courseRepository
                .findTop5ByStatusNotOrderByCreatedAtDesc(CourseStatus.Draft) // hoặc DRAFT
                .stream()
                .map(c -> RecentCourseItem.builder()
                        .courseId(c.getCourseID())
                        .title(c.getTitle())
                        .language(c.getLanguage())
                        .level(c.getLevel().name())
                        .tutorName(c.getTutor().getUser().getFullName())
                        .status(c.getStatus().name())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }


    // ===== 5.7 Pending Approvals list =====

    private List<PendingApprovalItem> buildPendingApprovals() {
        List<PendingApprovalItem> list = new ArrayList<>();

        // Tutor verification
        tutorVerificationRepository.findTop10ByStatusOrderBySubmittedAtAsc(TutorVerificationStatus.PENDING)
                .forEach(tv -> list.add(
                        PendingApprovalItem.builder()
                                .type("TUTOR_VERIFICATION")
                                .id(tv.getTutorVerificationID())
                                .title(tv.getTutor().getUser().getFullName())
                                .subtitle("Tutor verification request")
                                .createdAt(tv.getSubmittedAt())
                                .priority("HIGH")
                                .build()
                ));

        // Course drafts
        courseDraftRepository.findTop10ByStatusOrderByCreatedAtAsc(CourseDraftStatus.PENDING_REVIEW)
                .forEach(cd -> list.add(
                        PendingApprovalItem.builder()
                                .type("COURSE_DRAFT")
                                .id(cd.getDraftID())
                                .title(cd.getTitle())
                                .subtitle("Draft of course: " + cd.getCourse().getTitle())
                                .createdAt(cd.getCreatedAt())
                                .priority("MEDIUM")
                                .build()
                ));

        // Courses PENDING
        courseRepository.findTop10ByStatusOrderByCreatedAtAsc(CourseStatus.Pending)
                .forEach(c -> list.add(
                        PendingApprovalItem.builder()
                                .type("COURSE")
                                .id(c.getCourseID())
                                .title(c.getTitle())
                                .subtitle("New course pending approval")
                                .createdAt(c.getCreatedAt())
                                .priority("MEDIUM")
                                .build()
                ));

        // Refund requests
        // Refund requests
        refundRequestRepository.findTop10ByStatusInOrderByCreatedAtAsc(
                        List.of(RefundStatus.PENDING, RefundStatus.SUBMITTED)
                )
                .forEach(r -> list.add(
                        PendingApprovalItem.builder()
                                .type("REFUND")
                                .id(r.getRefundRequestId())
                                .title("Refund request #" + r.getRefundRequestId())
                                .subtitle("Amount: " + r.getRefundAmount())
                                .createdAt(r.getCreatedAt())
                                .priority("HIGH")
                                .build()
                ));


        // Withdraw requests
        withdrawMoneyRepository.findTop10ByStatusOrderByCreatedAtAsc(WithdrawStatus.PENDING)
                .forEach(w -> list.add(
                        PendingApprovalItem.builder()
                                .type("WITHDRAW")
                                .id(w.getWithdrawId())
                                .title("Withdraw by tutor " + w.getTutor().getUser().getFullName())
                                .subtitle("Amount: " + w.getWithdrawAmount())
                                .createdAt(w.getCreatedAt())
                                .priority("MEDIUM")
                                .build()
                ));

        // có thể sắp xếp lại theo thời gian
        list.sort(Comparator.comparing(PendingApprovalItem::getCreatedAt).reversed());
        return list;
    }
}
