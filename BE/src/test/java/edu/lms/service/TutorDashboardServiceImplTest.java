package edu.lms.service;

import edu.lms.dto.response.TutorDashboardResponse;
import edu.lms.dto.response.TutorDashboardResponse.*;
import edu.lms.entity.*;
import edu.lms.enums.*;
import edu.lms.repository.*;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho TutorDashboardServiceImpl
 *
 * Cover:
 *  - getDashboardForTutor()
 *      + CASE 1: Tutor không tồn tại -> throw RuntimeException
 *      + CASE 2: Tutor tồn tại nhưng không có dữ liệu -> tất cả số liệu = 0, list rỗng
 *      + CASE 3: Tutor có đầy đủ dữ liệu:
 *          * PerformanceMetrics (doanh thu, netRevenue, enrollments, completionRate, rating,…)
 *          * RatingDistribution
 *          * RevenueTrend
 *          * SalesByCourse
 *          * StudentEngagement
 *          * UpcomingSessions
 *          * PendingRefundRequests
 *          * RecentReviews
 */
@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class TutorDashboardServiceImplTest {

    @Mock TutorRepository tutorRepository;
    @Mock EnrollmentRepository enrollmentRepository;
    @Mock PaymentRepository paymentRepository;
    @Mock CourseReviewRepository courseReviewRepository;
    @Mock UserLessonRepository userLessonRepository;
    @Mock BookingPlanSlotRepository bookingPlanSlotRepository;
    @Mock RefundRequestRepository refundRequestRepository;
    @Mock UserRepository userRepository;
    @Mock SettingRepository settingRepository;
    @Mock CourseRepository courseRepository;

    @InjectMocks
    TutorDashboardServiceImpl tutorDashboardService;

    // =========================
    // HELPER: so sánh BigDecimal
    // =========================
    private void assertBigDecimalEquals(double expected, BigDecimal actual) {
        assertNotNull(actual, "Actual BigDecimal must not be null");
        assertEquals(
                0,
                actual.compareTo(BigDecimal.valueOf(expected)),
                () -> "Expected BigDecimal " + expected + " but was " + actual
        );
    }

    // =========================
    // HELPER BUILDERS
    // =========================

    private User buildUser(Long id, String fullName, String email, boolean active, LocalDateTime createdAt) {
        User u = new User();
        u.setUserID(id);
        u.setFullName(fullName);
        u.setEmail(email);
        u.setIsActive(active);
        u.setCreatedAt(createdAt);
        return u;
    }

    private Tutor buildTutor(Long tutorId, User user, TutorStatus status) {
        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setUser(user);
        t.setStatus(status);
        return t;
    }

    private Course buildCourse(Long id,
                               String title,
                               String language,
                               CourseLevel level,
                               Tutor tutor,
                               CourseStatus status,
                               LocalDateTime createdAt) {
        Course c = new Course();
        c.setCourseID(id);
        c.setTitle(title);
        c.setLanguage(language);
        c.setLevel(level);
        c.setTutor(tutor);
        c.setStatus(status);
        c.setCreatedAt(createdAt);
        return c;
    }

    private Payment buildPayment(PaymentType type,
                                 BigDecimal amount,
                                 PaymentStatus status,
                                 LocalDateTime paidAt,
                                 Long targetId) {
        Payment p = new Payment();
        p.setPaymentType(type);
        p.setAmount(amount);
        p.setStatus(status);
        p.setPaidAt(paidAt);
        p.setTargetId(targetId);
        return p;
    }

    private Setting buildSetting(BigDecimal commissionCourse, BigDecimal commissionBooking) {
        Setting s = new Setting();
        s.setCommissionCourse(commissionCourse);
        s.setCommissionBooking(commissionBooking);
        return s;
    }

    private Enrollment buildEnrollment(Long id,
                                       User user,
                                       Course course,
                                       EnrollmentStatus status,
                                       LocalDateTime createdAt) {
        Enrollment e = new Enrollment();
        e.setEnrollmentID(id);
        e.setUser(user);
        e.setCourse(course);
        e.setStatus(status);
        e.setCreatedAt(createdAt);
        return e;
    }

    private UserLesson buildUserLesson(Long id,
                                       User user,
                                       Lesson lesson,
                                       Integer watchedDuration,
                                       LocalDateTime completedAt) {
        UserLesson ul = new UserLesson();
        ul.setUserLessonID(id);
        ul.setUser(user);
        ul.setLesson(lesson);
        ul.setWatchedDuration(watchedDuration);
        ul.setCompletedAt(completedAt);
        return ul;
    }

    private BookingPlanSlot buildBookingSlot(Long slotId,
                                             Long tutorId,
                                             Long userId,
                                             LocalDateTime start,
                                             LocalDateTime end,
                                             SlotStatus status) {
        BookingPlanSlot s = new BookingPlanSlot();
        s.setSlotID(slotId);
        s.setTutorID(tutorId);
        s.setUserID(userId);
        s.setStartTime(start);
        s.setEndTime(end);
        s.setStatus(status);
        return s;
    }

    private CourseReview buildCourseReview(Long id,
                                           User user,
                                           Course course,
                                           Double rating,
                                           String comment,
                                           LocalDateTime createdAt) {
        CourseReview r = new CourseReview();
        r.setReviewID(id);
        r.setUser(user);
        r.setCourse(course);
        r.setComment(comment);
        r.setCreatedAt(createdAt);
        r.setRating(rating); // ✅ set rating để tránh NPE trong buildRecentReviews
        return r;
    }

    // =====================================================================
    // CASE 1: Tutor không tồn tại
    // =====================================================================
    @Nested
    @DisplayName("TutorDashboardServiceImpl.getDashboardForTutor - Tutor Not Found")
    class TutorNotFoundTests {

        /**
         * CASE 1
         * NOTE – userId không map tới tutor -> service ném RuntimeException
         */
        @Test
        @DisplayName("Tutor không tồn tại -> throw RuntimeException")
        void getDashboardForTutor_tutorNotFound_shouldThrow() {
            Long userId = 999L;
            LocalDate start = LocalDate.of(2025, 1, 1);
            LocalDate end = LocalDate.of(2025, 1, 31);

            when(tutorRepository.findByUser_UserID(userId))
                    .thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> tutorDashboardService.getDashboardForTutor(userId, start, end));

            verify(tutorRepository).findByUser_UserID(userId);
            verifyNoMoreInteractions(tutorRepository);
        }
    }

    // =====================================================================
    // CASE 2: Tutor tồn tại nhưng không có dữ liệu
    // =====================================================================
    @Nested
    @DisplayName("TutorDashboardServiceImpl.getDashboardForTutor - No Data")
    class TutorDashboardNoDataTests {

        /**
         * CASE 2
         * NOTE – Tutor tồn tại nhưng tất cả repository trả về rỗng / 0:
         *  - PerformanceMetrics: doanh thu = 0, netRevenue = 0, completionRate = 0, rating = 0
         *  - RatingDistribution, RevenueTrend, SalesByCourse, StudentEngagement,
         *    UpcomingSessions, RecentReviews đều là list rỗng
         *  - pendingRefundRequests = 0
         */
        @Test
        @DisplayName("Tutor có nhưng không có dữ liệu -> tất cả 0 và list rỗng")
        void getDashboardForTutor_noData_shouldReturnZerosAndEmptyLists() {
            Long userId = 1L;
            Long tutorId = 10L;

            LocalDate start = LocalDate.of(2025, 1, 1);
            LocalDate end = LocalDate.of(2025, 1, 31);

            // Tutor tồn tại
            User tutorUser = buildUser(
                    userId,
                    "Tutor A",
                    "tutor@example.com",
                    true,
                    LocalDateTime.of(2024, 12, 1, 10, 0)
            );
            Tutor tutor = buildTutor(tutorId, tutorUser, TutorStatus.APPROVED);

            when(tutorRepository.findByUser_UserID(userId))
                    .thenReturn(Optional.of(tutor));

            // PerformanceMetrics: payments = [], setting = null
            when(paymentRepository.findByTutorIdAndStatusAndPaidAtBetween(
                    eq(tutorId), eq(PaymentStatus.PAID), any(), any()))
                    .thenReturn(List.of());
            when(settingRepository.getCurrentSetting())
                    .thenReturn(null);

            when(enrollmentRepository.findByCourse_Tutor_TutorID(tutorId))
                    .thenReturn(List.of());

            when(courseReviewRepository.findAverageRatingByTutor(tutorId))
                    .thenReturn(null);
            when(courseReviewRepository.countByCourse_Tutor_TutorID(tutorId))
                    .thenReturn(0L);

            // RatingDistribution
            when(courseReviewRepository.countRatingDistributionByTutor(tutorId))
                    .thenReturn(List.of());

            // SalesByCourse
            when(paymentRepository.findByTutorIdAndStatusAndPaymentTypeAndPaidAtBetween(
                    eq(tutorId), eq(PaymentStatus.PAID), eq(PaymentType.Course), any(), any()))
                    .thenReturn(List.of());

            // StudentEngagement
            when(userLessonRepository.findByTutorAndCompletedAtBetween(eq(tutorId), any(), any()))
                    .thenReturn(List.of());

            // Upcoming sessions
            when(bookingPlanSlotRepository
                    .findTop5ByTutorIDAndStartTimeAfterAndStatusInOrderByStartTimeAsc(
                            eq(tutorId), any(), anyList()))
                    .thenReturn(List.of());

            // Pending refunds
            when(refundRequestRepository
                    .countByTutor_TutorIDAndStatusIn(eq(tutorId), anyList()))
                    .thenReturn(0L);

            // Recent reviews
            when(courseReviewRepository
                    .findTop10ByCourse_Tutor_TutorIDOrderByCreatedAtDesc(tutorId))
                    .thenReturn(List.of());

            // ===== CALL SERVICE =====
            TutorDashboardResponse res =
                    tutorDashboardService.getDashboardForTutor(userId, start, end);

            assertNotNull(res);

            // ---- PerformanceMetrics ----
            PerformanceMetrics pm = res.getPerformanceMetrics();
            assertNotNull(pm);
            assertBigDecimalEquals(0.0, pm.getTotalRevenue());
            assertBigDecimalEquals(0.0, pm.getNetRevenue());
            assertEquals(0L, pm.getActiveStudents());
            assertEquals(0L, pm.getTotalEnrollments());
            assertEquals(0.0, pm.getCompletionRate());
            assertEquals(0.0, pm.getInstructorRating());
            assertEquals(0L, pm.getTotalReviews());

            // ---- RatingDistribution ----
            assertNotNull(res.getRatingDistribution());
            assertTrue(res.getRatingDistribution().isEmpty());

            // ---- RevenueTrend ----
            assertNotNull(res.getRevenueTrend());
            assertTrue(res.getRevenueTrend().isEmpty());

            // ---- SalesByCourse ----
            assertNotNull(res.getSalesByCourse());
            assertTrue(res.getSalesByCourse().isEmpty());

            // ---- StudentEngagement ----
            assertNotNull(res.getStudentEngagement());
            assertTrue(res.getStudentEngagement().isEmpty());

            // ---- UpcomingSessions ----
            assertNotNull(res.getUpcomingSessions());
            assertTrue(res.getUpcomingSessions().isEmpty());

            // ---- PendingRefundRequests ----
            assertEquals(0L, res.getPendingRefundRequests());

            // ---- RecentReviews ----
            assertNotNull(res.getRecentReviews());
            assertTrue(res.getRecentReviews().isEmpty());
        }
    }

    // =====================================================================
    // CASE 3: Tutor có đầy đủ dữ liệu
    // =====================================================================
    @Nested
    @DisplayName("TutorDashboardServiceImpl.getDashboardForTutor - With Data")
    class TutorDashboardWithDataTests {

        /**
         * CASE 3 – HAPPY PATH FULL
         * NOTE – Tutor có đủ dữ liệu:
         *  - 4 payment (3 có paidAt, 1 null paidAt) -> cover branch skip null trong revenueTrend
         *  - enrollments Active + Completed -> tính completionRate
         *  - ratingDistribution với nhiều sao -> tính % từng sao
         *  - salesByCourse cho 2 course -> tính % theo GMV
         *  - engagement với nhiều UserLesson ở các tuần khác nhau
         *  - upcomingSessions có slot có user & slot không có user
         *  - pendingRefundRequests > 0
         *  - recentReviews map đúng studentName, courseTitle, comment, rating
         */
        @Test
        @DisplayName("Tutor có dữ liệu đủ -> Dashboard tính toán đầy đủ & đúng")
        void getDashboardForTutor_withData_shouldReturnAllSections() {
            Long userId = 1L;
            Long tutorId = 10L;

            LocalDate start = LocalDate.of(2025, 1, 1);
            LocalDate end = LocalDate.of(2025, 1, 31);

            // ===== Tutor =====
            User tutorUser = buildUser(
                    userId,
                    "Tutor A",
                    "tutor@example.com",
                    true,
                    LocalDateTime.of(2024, 12, 1, 10, 0)
            );
            Tutor tutor = buildTutor(tutorId, tutorUser, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(userId))
                    .thenReturn(Optional.of(tutor));

            // ===== Setting (commission) =====
            Setting setting = buildSetting(
                    new BigDecimal("0.20"),  // 20% course
                    new BigDecimal("0.10")   // 10% booking
            );
            when(settingRepository.getCurrentSetting())
                    .thenReturn(setting);

            // ===== Payments for PerformanceMetrics & RevenueTrend =====
            LocalDateTime paidAt1 = LocalDateTime.of(2025, 1, 5, 10, 0);
            LocalDateTime paidAt2 = LocalDateTime.of(2025, 1, 6, 11, 0);
            LocalDateTime paidAt3 = LocalDateTime.of(2025, 1, 20, 9, 0);

            Payment pay1 = buildPayment(
                    PaymentType.Course,
                    BigDecimal.valueOf(100),
                    PaymentStatus.PAID,
                    paidAt1,
                    1001L // course1
            );
            Payment pay2 = buildPayment(
                    PaymentType.Booking,
                    BigDecimal.valueOf(50),
                    PaymentStatus.PAID,
                    paidAt2,
                    null
            );
            Payment pay3 = buildPayment(
                    PaymentType.Course,
                    BigDecimal.valueOf(150),
                    PaymentStatus.PAID,
                    paidAt3,
                    1002L // course2
            );
            // Payment có paidAt null -> tính vào totalRevenue, nhưng không vào revenueTrend
            Payment pay4 = buildPayment(
                    PaymentType.Course,
                    BigDecimal.valueOf(30),
                    PaymentStatus.PAID,
                    null,
                    1001L
            );

            List<Payment> allPayments = List.of(pay1, pay2, pay3, pay4);
            when(paymentRepository.findByTutorIdAndStatusAndPaidAtBetween(
                    eq(tutorId), eq(PaymentStatus.PAID), any(), any()))
                    .thenReturn(allPayments);

            // TOTAL:
            // totalRevenue = 100 + 50 + 150 + 30 = 330
            // courseRevenue = 100 + 150 + 30 = 280
            // bookingRevenue = 50
            // netCourse = 280 * (1-0.2) = 224
            // netBooking = 50 * (1-0.1) = 45
            // netRevenue = 269

            // ===== SalesByCourse (Course-only payments, chỉ lấy pay1 & pay3) =====
            when(paymentRepository.findByTutorIdAndStatusAndPaymentTypeAndPaidAtBetween(
                    eq(tutorId), eq(PaymentStatus.PAID), eq(PaymentType.Course), any(), any()))
                    .thenReturn(List.of(pay1, pay3));

            // Courses cho SalesByCourse & RecentReviews
            Course course1 = buildCourse(
                    1001L, "English 101", "English",
                    CourseLevel.BEGINNER, tutor,
                    CourseStatus.Approved,
                    LocalDateTime.of(2025, 1, 2, 9, 0)
            );
            Course course2 = buildCourse(
                    1002L, "Japanese Basic", "Japanese",
                    CourseLevel.BEGINNER, tutor,
                    CourseStatus.Approved,
                    LocalDateTime.of(2025, 1, 3, 9, 0)
            );

            when(courseRepository.findById(1001L)).thenReturn(Optional.of(course1));
            when(courseRepository.findById(1002L)).thenReturn(Optional.of(course2));

            // ===== Enrollments cho PerformanceMetrics =====
            User student1 = buildUser(
                    100L,
                    "Student 1",
                    "s1@example.com",
                    true,
                    LocalDateTime.of(2024, 12, 10, 8, 0)
            );
            User student2 = buildUser(
                    101L,
                    "Student 2",
                    "s2@example.com",
                    true,
                    LocalDateTime.of(2024, 12, 11, 8, 0)
            );

            Enrollment e1 = buildEnrollment(
                    1L,
                    student1,
                    course1,
                    EnrollmentStatus.Active,
                    LocalDateTime.of(2025, 1, 5, 8, 0)
            );
            Enrollment e2 = buildEnrollment(
                    2L,
                    student2,
                    course2,
                    EnrollmentStatus.Active,
                    LocalDateTime.of(2025, 1, 6, 8, 0)
            );
            Enrollment e3 = buildEnrollment(
                    3L,
                    student1,
                    course2,
                    EnrollmentStatus.Completed,
                    LocalDateTime.of(2025, 1, 7, 8, 0)
            );

            when(enrollmentRepository.findByCourse_Tutor_TutorID(tutorId))
                    .thenReturn(List.of(e1, e2, e3));
            // totalEnrollments = 3
            // activeStudents = 2 (student1 + student2)
            // completedEnrollments = 1
            // completionRate = 100*1/3 ≈ 33.333...

            // ===== Rating metrics =====
            when(courseReviewRepository.findAverageRatingByTutor(tutorId))
                    .thenReturn(4.5);
            when(courseReviewRepository.countByCourse_Tutor_TutorID(tutorId))
                    .thenReturn(10L);

            // ===== Rating distribution =====
            // 5★: 6, 4★: 3, 3★: 1 -> total = 10
            List<Object[]> ratingRows = List.of(
                    new Object[]{5, 6L},
                    new Object[]{4, 3L},
                    new Object[]{3, 1L}
            );
            when(courseReviewRepository.countRatingDistributionByTutor(tutorId))
                    .thenReturn(ratingRows);

            // ===== Student engagement (UserLesson) =====
            WeekFields wf = WeekFields.ISO;
            LocalDate engageDate1 = LocalDate.of(2025, 1, 7);  // tuần 2
            LocalDate engageDate2 = LocalDate.of(2025, 1, 10); // tuần 2
            LocalDate engageDate3 = LocalDate.of(2025, 1, 20); // tuần khác

            Lesson dummyLesson = new Lesson();
            dummyLesson.setLessonID(999L);

            // ul1 & ul2 cùng tuần -> hours = (120 + 60)/60 = 3, lessonCount = 2
            UserLesson ul1 = buildUserLesson(
                    1L, student1, dummyLesson,
                    120,
                    engageDate1.atTime(9, 0)
            );
            UserLesson ul2 = buildUserLesson(
                    2L, student2, dummyLesson,
                    60,
                    engageDate2.atTime(10, 0)
            );
            // ul3 tuần khác, watchedDuration null -> hours += 0, lessonCount++
            UserLesson ul3 = buildUserLesson(
                    3L, student1, dummyLesson,
                    null,
                    engageDate3.atTime(14, 0)
            );
            // ul4 completedAt null -> bị skip
            UserLesson ul4 = buildUserLesson(
                    4L, student2, dummyLesson,
                    30,
                    null
            );

            when(userLessonRepository.findByTutorAndCompletedAtBetween(eq(tutorId), any(), any()))
                    .thenReturn(List.of(ul1, ul2, ul3, ul4));

            // ===== Upcoming sessions =====
            LocalDateTime slot1Start = LocalDateTime.of(2025, 1, 15, 10, 0);
            LocalDateTime slot1End = LocalDateTime.of(2025, 1, 15, 11, 0);
            BookingPlanSlot slot1 = buildBookingSlot(
                    500L, tutorId, student1.getUserID(),
                    slot1Start, slot1End, SlotStatus.Locked
            );

            LocalDateTime slot2Start = LocalDateTime.of(2025, 1, 16, 9, 0);
            LocalDateTime slot2End = LocalDateTime.of(2025, 1, 16, 10, 0);
            BookingPlanSlot slot2 = buildBookingSlot(
                    501L, tutorId, null,
                    slot2Start, slot2End, SlotStatus.Paid
            );

            when(bookingPlanSlotRepository
                    .findTop5ByTutorIDAndStartTimeAfterAndStatusInOrderByStartTimeAsc(
                            eq(tutorId), any(), anyList()))
                    .thenReturn(List.of(slot1, slot2));

            when(userRepository.findById(student1.getUserID()))
                    .thenReturn(Optional.of(student1));

            // ===== Pending refunds =====
            when(refundRequestRepository
                    .countByTutor_TutorIDAndStatusIn(eq(tutorId), anyList()))
                    .thenReturn(3L);

            // ===== Recent reviews =====
            CourseReview r1 = buildCourseReview(
                    900L, student1, course1,
                    5.0,
                    "Great course!", LocalDateTime.of(2025, 1, 21, 8, 0)
            );
            CourseReview r2 = buildCourseReview(
                    901L, student2, course2,
                    4.0,
                    "Very helpful", LocalDateTime.of(2025, 1, 19, 8, 0)
            );

            when(courseReviewRepository
                    .findTop10ByCourse_Tutor_TutorIDOrderByCreatedAtDesc(tutorId))
                    .thenReturn(List.of(r1, r2));

            // ===== CALL SERVICE =====
            TutorDashboardResponse res =
                    tutorDashboardService.getDashboardForTutor(userId, start, end);

            assertNotNull(res);

            // ---------- PerformanceMetrics ----------
            PerformanceMetrics pm = res.getPerformanceMetrics();
            assertNotNull(pm);

            // totalRevenue = 330
            assertBigDecimalEquals(330.0, pm.getTotalRevenue());
            // netRevenue = 269 (tính như ở trên)
            assertBigDecimalEquals(269.0, pm.getNetRevenue());
            assertEquals(2L, pm.getActiveStudents());
            assertEquals(3L, pm.getTotalEnrollments());
            assertEquals(4.5, pm.getInstructorRating());
            assertEquals(10L, pm.getTotalReviews());
            // completionRate ≈ 33.333...
            assertEquals(33.33, pm.getCompletionRate(), 0.5);

            // ---------- RatingDistribution ----------
            List<RatingDistributionItem> dist = res.getRatingDistribution();
            assertEquals(3, dist.size());
            // được sort theo stars giảm dần: 5, 4, 3
            RatingDistributionItem d5 = dist.get(0);
            assertEquals(5, d5.getStars());
            assertEquals(6L, d5.getCount());
            assertEquals(60.0, d5.getPercent());

            RatingDistributionItem d4 = dist.get(1);
            assertEquals(4, d4.getStars());
            assertEquals(3L, d4.getCount());
            assertEquals(30.0, d4.getPercent());

            RatingDistributionItem d3 = dist.get(2);
            assertEquals(3, d3.getStars());
            assertEquals(1L, d3.getCount());
            assertEquals(10.0, d3.getPercent());

            // ---------- RevenueTrend ----------
            List<RevenueTrendPoint> trend = res.getRevenueTrend();
            assertEquals(3, trend.size());

            assertEquals(LocalDate.of(2025, 1, 5), trend.get(0).getDate());
            assertBigDecimalEquals(100.0, trend.get(0).getAmount());

            assertEquals(LocalDate.of(2025, 1, 6), trend.get(1).getDate());
            assertBigDecimalEquals(50.0, trend.get(1).getAmount());

            assertEquals(LocalDate.of(2025, 1, 20), trend.get(2).getDate());
            assertBigDecimalEquals(150.0, trend.get(2).getAmount());

            // ---------- SalesByCourse ----------
            List<CourseSalesItem> sales = res.getSalesByCourse();
            assertEquals(2, sales.size());

            CourseSalesItem sCourse1 = sales.stream()
                    .filter(s -> s.getCourseId().equals(1001L))
                    .findFirst()
                    .orElseThrow();
            CourseSalesItem sCourse2 = sales.stream()
                    .filter(s -> s.getCourseId().equals(1002L))
                    .findFirst()
                    .orElseThrow();

            assertBigDecimalEquals(100.0, sCourse1.getRevenue());
            assertEquals("English 101", sCourse1.getCourseTitle());
            assertEquals(40.0, sCourse1.getPercent());

            assertBigDecimalEquals(150.0, sCourse2.getRevenue());
            assertEquals("Japanese Basic", sCourse2.getCourseTitle());
            assertEquals(60.0, sCourse2.getPercent());

            // ---------- StudentEngagement ----------
            List<WeeklyEngagementItem> engagement = res.getStudentEngagement();
            assertEquals(2, engagement.size());

            int week2 = engageDate1.get(wf.weekOfWeekBasedYear());
            int weekOther = engageDate3.get(wf.weekOfWeekBasedYear());

            WeeklyEngagementItem weekItem2 = engagement.stream()
                    .filter(e -> e.getWeekIndex() == week2)
                    .findFirst()
                    .orElseThrow();
            WeeklyEngagementItem weekItemOther = engagement.stream()
                    .filter(e -> e.getWeekIndex() == weekOther)
                    .findFirst()
                    .orElseThrow();

            assertEquals(2, weekItem2.getLessonCount());
            assertEquals(3.0, weekItem2.getHours(), 0.001);

            assertEquals(1, weekItemOther.getLessonCount());
            assertEquals(0.0, weekItemOther.getHours(), 0.001);

            // ---------- UpcomingSessions ----------
            List<UpcomingSessionItem> upcoming = res.getUpcomingSessions();
            assertEquals(2, upcoming.size());

            UpcomingSessionItem up1 = upcoming.get(0);
            assertEquals(500L, up1.getSlotId());
            assertEquals(slot1Start, up1.getStartTime());
            assertEquals(slot1End, up1.getEndTime());
            assertEquals("Student 1", up1.getStudentName());
            assertEquals("s1@example.com", up1.getStudentEmail());
            assertEquals("1:1 Session", up1.getTitle());
            assertEquals(SlotStatus.Locked.name(), up1.getStatus());

            UpcomingSessionItem up2 = upcoming.get(1);
            assertEquals(501L, up2.getSlotId());
            assertEquals(slot2Start, up2.getStartTime());
            assertEquals(slot2End, up2.getEndTime());
            assertNull(up2.getStudentName());
            assertNull(up2.getStudentEmail());
            assertEquals("1:1 Session", up2.getTitle());
            assertEquals(SlotStatus.Paid.name(), up2.getStatus());

            // ---------- PendingRefundRequests ----------
            assertEquals(3L, res.getPendingRefundRequests());

            // ---------- RecentReviews ----------
            List<RecentReviewItem> recentReviews = res.getRecentReviews();
            assertEquals(2, recentReviews.size());

            RecentReviewItem rr1 = recentReviews.get(0);
            assertEquals(900L, rr1.getReviewId());
            assertEquals("Student 1", rr1.getStudentName());
            assertEquals("English 101", rr1.getCourseTitle());
            assertEquals("Great course!", rr1.getComment());
            assertEquals(5.0, rr1.getRating());
            assertEquals(r1.getCreatedAt(), rr1.getCreatedAt());

            RecentReviewItem rr2 = recentReviews.get(1);
            assertEquals(901L, rr2.getReviewId());
            assertEquals("Student 2", rr2.getStudentName());
            assertEquals("Japanese Basic", rr2.getCourseTitle());
            assertEquals("Very helpful", rr2.getComment());
            assertEquals(4.0, rr2.getRating());
            assertEquals(r2.getCreatedAt(), rr2.getCreatedAt());
        }
    }
}
