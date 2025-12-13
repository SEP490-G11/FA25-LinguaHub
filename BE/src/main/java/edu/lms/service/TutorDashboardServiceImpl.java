// src/main/java/edu/lms/service/TutorDashboardServiceImpl.java
package edu.lms.service;

import edu.lms.dto.response.TutorDashboardResponse;
import edu.lms.dto.response.TutorDashboardResponse.*;
import edu.lms.entity.*;
import edu.lms.enums.EnrollmentStatus;
import edu.lms.enums.PaymentStatus;
import edu.lms.enums.PaymentType;
import edu.lms.enums.RefundStatus;
import edu.lms.enums.SlotStatus;
import edu.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class TutorDashboardServiceImpl implements TutorDashboardService {

    TutorRepository tutorRepository;
    EnrollmentRepository enrollmentRepository;
    PaymentRepository paymentRepository;
    CourseReviewRepository courseReviewRepository;
    UserLessonRepository userLessonRepository;
    BookingPlanSlotRepository bookingPlanSlotRepository;
    RefundRequestRepository refundRequestRepository;
    UserRepository userRepository;
    SettingRepository settingRepository;
    CourseRepository courseRepository;

    @Override
    @Transactional(readOnly = true)
    public TutorDashboardResponse getDashboardForTutor(Long userId,
                                                       LocalDate startDate,
                                                       LocalDate endDate) {

        Tutor tutor = tutorRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new RuntimeException("Tutor not found for userId=" + userId));
        Long tutorId = tutor.getTutorID();

        LocalDateTime from = startDate.atStartOfDay();
        LocalDateTime to = endDate.plusDays(1).atStartOfDay();

        PerformanceMetrics performance = buildPerformanceMetrics(tutorId, from, to);
        List<RatingDistributionItem> ratingDistribution = buildRatingDistribution(tutorId);
        List<RevenueTrendPoint> revenueTrend = buildRevenueTrend(tutorId, from, to);
        List<CourseSalesItem> salesByCourse = buildSalesByCourse(tutorId, from, to);
        List<WeeklyEngagementItem> engagement = buildStudentEngagement(tutorId, from, to);
        List<UpcomingSessionItem> upcoming = buildUpcomingSessions(tutorId);
        long pendingRefunds = refundRequestRepository
                .countByTutor_TutorIDAndStatusIn(tutorId,
                        List.of(RefundStatus.PENDING, RefundStatus.SUBMITTED));
        List<RecentReviewItem> recentReviews = buildRecentReviews(tutorId);

        return TutorDashboardResponse.builder()
                .performanceMetrics(performance)
                .ratingDistribution(ratingDistribution)
                .revenueTrend(revenueTrend)
                .salesByCourse(salesByCourse)
                .studentEngagement(engagement)
                .upcomingSessions(upcoming)
                .pendingRefundRequests(pendingRefunds)
                .recentReviews(recentReviews)
                .build();
    }

    // ================== PERFORMANCE METRICS ==================

    private PerformanceMetrics buildPerformanceMetrics(Long tutorId,
                                                       LocalDateTime from,
                                                       LocalDateTime to) {

        // Lấy tất cả payment PAID của tutor trong khoảng thời gian
        List<Payment> payments = paymentRepository
                .findByTutorIdAndStatusAndPaidAtBetween(
                        tutorId, PaymentStatus.PAID, from, to);

        BigDecimal totalRevenue = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Setting setting = settingRepository.getCurrentSetting();
        BigDecimal commissionCourse = setting != null ? setting.getCommissionCourse() : BigDecimal.ZERO;
        BigDecimal commissionBooking = setting != null ? setting.getCommissionBooking() : BigDecimal.ZERO;

        // tính netRevenue tách theo Course / Booking
        BigDecimal courseRevenue = payments.stream()
                .filter(p -> p.getPaymentType() == PaymentType.Course)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal bookingRevenue = payments.stream()
                .filter(p -> p.getPaymentType() == PaymentType.Booking)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // NOTE: giả sử commission lưu dạng 0.2 = 20%
        BigDecimal netCourse = courseRevenue.multiply(BigDecimal.ONE.subtract(commissionCourse));
        BigDecimal netBooking = bookingRevenue.multiply(BigDecimal.ONE.subtract(commissionBooking));
        BigDecimal netRevenue = netCourse.add(netBooking);

        // Enrollments
        List<Enrollment> enrollments = enrollmentRepository.findByCourse_Tutor_TutorID(tutorId);
        long totalEnrollments = enrollments.size();
        long activeStudents = enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.Active)
                .map(e -> e.getUser().getUserID())
                .distinct()
                .count();
        long completedEnrollments = enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.Completed)
                .count();

        double completionRate = 0.0;
        if (totalEnrollments > 0) {
            completionRate = completedEnrollments * 100.0 / totalEnrollments;
        }

        // Rating
        Double avgRating = courseReviewRepository.findAverageRatingByTutor(tutorId);
        if (avgRating == null) avgRating = 0.0;
        long totalReviews = courseReviewRepository.countByCourse_Tutor_TutorID(tutorId);

        return PerformanceMetrics.builder()
                .totalRevenue(totalRevenue)
                .netRevenue(netRevenue)
                .activeStudents(activeStudents)
                .totalEnrollments(totalEnrollments)
                .completionRate(completionRate)
                .instructorRating(avgRating)
                .totalReviews(totalReviews)
                .build();
    }

    // ================== RATING DISTRIBUTION ==================

    private List<RatingDistributionItem> buildRatingDistribution(Long tutorId) {
        List<Object[]> rows = courseReviewRepository.countRatingDistributionByTutor(tutorId);
        long total = rows.stream()
                .mapToLong(r -> ((Number) r[1]).longValue())
                .sum();
        if (total == 0) total = 1;

        long finalTotal = total;
        return rows.stream()
                .map(r -> {
                    int stars = ((Number) r[0]).intValue();
                    long count = ((Number) r[1]).longValue();
                    double percent = count * 100.0 / finalTotal;
                    return RatingDistributionItem.builder()
                            .stars(stars)
                            .count(count)
                            .percent(percent)
                            .build();
                })
                .sorted(Comparator.comparingInt(RatingDistributionItem::getStars).reversed())
                .collect(Collectors.toList());
    }

    // ================== REVENUE TREND ==================

    private List<RevenueTrendPoint> buildRevenueTrend(Long tutorId,
                                                      LocalDateTime from,
                                                      LocalDateTime to) {
        List<Payment> payments = paymentRepository
                .findByTutorIdAndStatusAndPaidAtBetween(
                        tutorId, PaymentStatus.PAID, from, to);

        Map<LocalDate, BigDecimal> map = new HashMap<>();
        for (Payment p : payments) {
            if (p.getPaidAt() == null) continue;
            LocalDate d = p.getPaidAt().toLocalDate();
            map.merge(d, p.getAmount(), BigDecimal::add);
        }

        return map.entrySet().stream()
                .map(e -> RevenueTrendPoint.builder()
                        .date(e.getKey())
                        .amount(e.getValue())
                        .build())
                .sorted(Comparator.comparing(RevenueTrendPoint::getDate))
                .collect(Collectors.toList());
    }

    // ================== SALES BY COURSE ==================

    private List<CourseSalesItem> buildSalesByCourse(Long tutorId,
                                                     LocalDateTime from,
                                                     LocalDateTime to) {

        List<Payment> payments = paymentRepository
                .findByTutorIdAndStatusAndPaymentTypeAndPaidAtBetween(
                        tutorId, PaymentStatus.PAID, PaymentType.Course, from, to);

        // group by targetId (courseId)
        Map<Long, BigDecimal> revenueByCourseId = new HashMap<>();
        for (Payment p : payments) {
            Long courseId = p.getTargetId();
            if (courseId == null) continue;
            revenueByCourseId.merge(courseId, p.getAmount(), BigDecimal::add);
        }

        BigDecimal total = revenueByCourseId.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.compareTo(BigDecimal.ZERO) == 0) total = BigDecimal.ONE;
        BigDecimal finalTotal = total;

        return revenueByCourseId.entrySet().stream()
                .map(e -> {
                    Long courseId = e.getKey();
                    BigDecimal revenue = e.getValue();
                    String title = courseRepository.findById(courseId)
                            .map(Course::getTitle)
                            .orElse("Course #" + courseId);

                    double percent = revenue
                            .multiply(BigDecimal.valueOf(100))
                            .divide(finalTotal, 2, BigDecimal.ROUND_HALF_UP)
                            .doubleValue();

                    return CourseSalesItem.builder()
                            .courseId(courseId)
                            .courseTitle(title)
                            .revenue(revenue)
                            .percent(percent)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ================== STUDENT ENGAGEMENT ==================

    private List<WeeklyEngagementItem> buildStudentEngagement(Long tutorId,
                                                              LocalDateTime from,
                                                              LocalDateTime to) {

        List<UserLesson> lessons = userLessonRepository
                .findByTutorAndCompletedAtBetween(tutorId, from, to);

        Map<Integer, WeeklyEngagementItem> map = new HashMap<>();
        WeekFields wf = WeekFields.ISO;

        for (UserLesson ul : lessons) {
            if (ul.getCompletedAt() == null) continue;
            LocalDate date = ul.getCompletedAt().toLocalDate();
            int weekIndex = date.get(wf.weekOfWeekBasedYear());

            WeeklyEngagementItem item = map.computeIfAbsent(
                    weekIndex,
                    w -> WeeklyEngagementItem.builder()
                            .weekIndex(w)
                            .hours(0)
                            .lessonCount(0)
                            .build()
            );

            int watched = Optional.ofNullable(ul.getWatchedDuration()).orElse(0);
            item.setHours(item.getHours() + watched / 60.0);
            item.setLessonCount(item.getLessonCount() + 1);
        }

        return map.values().stream()
                .sorted(Comparator.comparingInt(WeeklyEngagementItem::getWeekIndex))
                .collect(Collectors.toList());
    }

    // ================== UPCOMING SESSIONS ==================

    private List<UpcomingSessionItem> buildUpcomingSessions(Long tutorId) {
        LocalDateTime now = LocalDateTime.now();

        List<BookingPlanSlot> slots =
                bookingPlanSlotRepository
                        .findTop5ByTutorIDAndStartTimeAfterAndStatusInOrderByStartTimeAsc(
                                tutorId,
                                now,
                                List.of(SlotStatus.Locked, SlotStatus.Paid)
                        );

        return slots.stream()
                .map(s -> {
                    User student = null;
                    if (s.getUserID() != null) {
                        student = userRepository.findById(s.getUserID()).orElse(null);
                    }

                    return UpcomingSessionItem.builder()
                            .slotId(s.getSlotID())
                            .startTime(s.getStartTime())
                            .endTime(s.getEndTime())
                            .studentName(student != null ? student.getFullName() : null)
                            .studentEmail(student != null ? student.getEmail() : null)
                            .title("1:1 Session")
                            .status(s.getStatus().name())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ================== RECENT REVIEWS ==================

    private List<RecentReviewItem> buildRecentReviews(Long tutorId) {
        List<CourseReview> reviews =
                courseReviewRepository
                        .findTop10ByCourse_Tutor_TutorIDOrderByCreatedAtDesc(tutorId);

        return reviews.stream()
                .map(r -> {
                    User student = r.getUser();
                    Course course = r.getCourse();
                    return RecentReviewItem.builder()
                            .reviewId(r.getReviewID())
                            .studentName(student != null ? student.getFullName() : null)
                            .courseTitle(course != null ? course.getTitle() : null)
                            .rating(r.getRating())
                            .comment(r.getComment())
                            .createdAt(r.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }
}
