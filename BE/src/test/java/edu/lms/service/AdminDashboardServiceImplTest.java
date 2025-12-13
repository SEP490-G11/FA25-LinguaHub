package edu.lms.service;

import edu.lms.dto.response.AdminDashboardResponse;
import edu.lms.dto.response.AdminDashboardResponse.*;
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
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho AdminDashboardServiceImpl
 *
 * Cover:
 *  - getDashboard()
 *     + Case không có dữ liệu -> mọi thứ = 0 / list rỗng
 *     + Case có đầy đủ dữ liệu:
 *         * ActionableItems
 *         * FinancialOverview
 *         * RevenueBreakdown
 *         * RevenueByLanguage
 *         * GrowthMetrics
 *         * MonthlyGrowth
 *         * RecentUsers
 *         * RecentCourses
 *         * PendingApprovals
 *
 * Các private helper đều được cover thông qua getDashboard().
 */
@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class AdminDashboardServiceImplTest {

    @Mock TutorVerificationRepository tutorVerificationRepository;
    @Mock CourseDraftRepository courseDraftRepository;
    @Mock CourseRepository courseRepository;
    @Mock RefundRequestRepository refundRequestRepository;
    @Mock WithdrawMoneyRepository withdrawMoneyRepository;
    @Mock PaymentRepository paymentRepository;
    @Mock SettingRepository settingRepository;
    @Mock UserRepository userRepository;
    @Mock TutorRepository tutorRepository;
    @Mock EnrollmentRepository enrollmentRepository;

    @InjectMocks
    AdminDashboardServiceImpl adminDashboardService;

    // =========================
    // HELPER: compare BigDecimal
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

    private User buildUser(Long id, String name, String email, boolean active, LocalDateTime createdAt) {
        User u = new User();
        u.setUserID(id);
        u.setFullName(name);
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

    private Course buildCourse(Long id, String title, String language, CourseLevel level,
                               Tutor tutor, CourseStatus status, LocalDateTime createdAt) {
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

    private Payment buildPayment(PaymentType type, BigDecimal amount,
                                 PaymentStatus status, LocalDateTime paidAt, Long targetId) {
        Payment p = new Payment();
        // Không set ID vì test không cần dùng tới, tránh lỗi setPaymentId()
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

    private Enrollment buildEnrollment(Long id, User user, Course course, EnrollmentStatus status, LocalDateTime createdAt) {
        Enrollment e = new Enrollment();
        e.setEnrollmentID(id);
        e.setUser(user);
        e.setCourse(course);
        e.setStatus(status);
        e.setCreatedAt(createdAt);
        return e;
    }

    private TutorVerification buildTutorVerification(Long id, Tutor tutor, LocalDateTime submittedAt) {
        TutorVerification tv = new TutorVerification();
        tv.setTutorVerificationID(id);
        tv.setTutor(tutor);
        tv.setSubmittedAt(submittedAt);
        tv.setStatus(TutorVerificationStatus.PENDING);
        return tv;
    }

    private CourseDraft buildCourseDraft(Long draftId, String title, Course course,
                                         LocalDateTime createdAt, CourseDraftStatus status) {
        CourseDraft cd = new CourseDraft();
        cd.setDraftID(draftId);
        cd.setTitle(title);
        cd.setCourse(course);
        cd.setCreatedAt(createdAt);
        cd.setStatus(status);
        return cd;
    }

    private RefundRequest buildRefundRequest(Long id, BigDecimal amount,
                                             LocalDateTime createdAt, RefundStatus status) {
        RefundRequest r = new RefundRequest();
        r.setRefundRequestId(id);
        r.setRefundAmount(amount);
        r.setCreatedAt(createdAt);
        r.setStatus(status);
        return r;
    }

    private WithdrawMoney buildWithdrawMoney(Long id, Tutor tutor, BigDecimal amount,
                                             LocalDateTime createdAt, WithdrawStatus status) {
        WithdrawMoney w = new WithdrawMoney();
        w.setWithdrawId(id);
        w.setTutor(tutor);
        w.setWithdrawAmount(amount);
        w.setCreatedAt(createdAt);
        w.setStatus(status);
        return w;
    }

    // =====================================================================
    // CASE 1: Không có dữ liệu
    // =====================================================================
    @Nested
    @DisplayName("AdminDashboardServiceImpl.getDashboard - No Data")
    class GetDashboardNoDataTests {

        /**
         * CASE 1
         * NOTE – Tất cả repository trả về rỗng / 0
         *  - ActionableItems = 0 hết
         *  - FinancialOverview = 0 hết
         *  - RevenueBreakdown = []
         *  - RevenueByLanguage = []
         *  - GrowthMetrics: totalUsers=0 -> conversion=0, retention=0, churn=100
         *  - MonthlyGrowth = []
         *  - RecentUsers, RecentCourses, PendingApprovals = []
         */
        @Test
        @DisplayName("Không có dữ liệu -> mọi số liệu 0 và list rỗng")
        void getDashboard_noData_shouldReturnZerosAndEmptyLists() {
            LocalDate start = LocalDate.of(2025, 1, 1);
            LocalDate end = LocalDate.of(2025, 1, 31);

            // ActionableItems
            when(tutorVerificationRepository.countByStatus(TutorVerificationStatus.PENDING))
                    .thenReturn(0L);
            when(courseDraftRepository.countByStatus(CourseDraftStatus.PENDING_REVIEW))
                    .thenReturn(0L);
            when(courseRepository.countByStatus(CourseStatus.Pending))
                    .thenReturn(0L);
            when(refundRequestRepository.countByStatusIn(anyList()))
                    .thenReturn(0L);
            when(withdrawMoneyRepository.countByStatus(WithdrawStatus.PENDING))
                    .thenReturn(0L);

            // Financial + RevenueBreakdown + RevenueByLanguage
            when(paymentRepository.findByStatusAndPaidAtBetween(eq(PaymentStatus.PAID), any(), any()))
                    .thenReturn(List.of());
            when(paymentRepository.findByStatusAndPaymentTypeAndPaidAtBetween(
                    eq(PaymentStatus.PAID), eq(PaymentType.Course), any(), any()))
                    .thenReturn(List.of());
            when(settingRepository.getCurrentSetting()).thenReturn(null); // test nhánh setting=null

            // GrowthMetrics
            when(userRepository.count()).thenReturn(0L);
            when(userRepository.countByIsActiveTrue()).thenReturn(0L);
            when(tutorRepository.count()).thenReturn(0L);
            when(tutorRepository.countByStatus(TutorStatus.APPROVED)).thenReturn(0L);
            when(courseRepository.count()).thenReturn(0L);
            when(enrollmentRepository.count()).thenReturn(0L);
            when(enrollmentRepository.countDistinctLearners()).thenReturn(0L);

            // Monthly Growth
            when(userRepository.findByCreatedAtBetween(any(), any()))
                    .thenReturn(List.of());
            when(tutorRepository.findByUserCreatedAtBetween(any(), any()))
                    .thenReturn(List.of());
            when(enrollmentRepository.findByCreatedAtBetween(any(), any()))
                    .thenReturn(List.of());

            // Recent & Pending
            when(userRepository.findTop5ByOrderByCreatedAtDesc())
                    .thenReturn(List.of());
            when(courseRepository.findTop5ByStatusNotOrderByCreatedAtDesc(CourseStatus.Draft))
                    .thenReturn(List.of());
            when(tutorVerificationRepository.findTop10ByStatusOrderBySubmittedAtAsc(TutorVerificationStatus.PENDING))
                    .thenReturn(List.of());
            when(courseDraftRepository.findTop10ByStatusOrderByCreatedAtAsc(CourseDraftStatus.PENDING_REVIEW))
                    .thenReturn(List.of());
            when(courseRepository.findTop10ByStatusOrderByCreatedAtAsc(CourseStatus.Pending))
                    .thenReturn(List.of());
            when(refundRequestRepository.findTop10ByStatusInOrderByCreatedAtAsc(anyList()))
                    .thenReturn(List.of());
            when(withdrawMoneyRepository.findTop10ByStatusOrderByCreatedAtAsc(WithdrawStatus.PENDING))
                    .thenReturn(List.of());

            AdminDashboardResponse res = adminDashboardService.getDashboard(start, end);

            assertNotNull(res);

            // Actionable
            ActionableItems ai = res.getActionableItems();
            assertNotNull(ai);
            assertEquals(0L, ai.getPendingTutors());
            assertEquals(0L, ai.getPendingCourses());
            assertEquals(0L, ai.getPendingRefundRequests());
            assertEquals(0L, ai.getPendingWithdraws());
            assertEquals(0L, ai.getReportedContents());

            // FinancialOverview
            FinancialOverview fo = res.getFinancialOverview();
            assertNotNull(fo);
            assertBigDecimalEquals(0.0, fo.getTotalGMV());
            assertBigDecimalEquals(0.0, fo.getTotalCommission());
            assertBigDecimalEquals(0.0, fo.getTotalPayout());
            assertBigDecimalEquals(0.0, fo.getAvgOrderValue());
            assertEquals(0L, fo.getTotalPaidOrders());

            // RevenueBreakdown & RevenueByLanguage
            assertNotNull(res.getRevenueBreakdown());
            assertTrue(res.getRevenueBreakdown().isEmpty());

            assertNotNull(res.getRevenueByLanguage());
            assertTrue(res.getRevenueByLanguage().isEmpty());

            // GrowthMetrics
            GrowthMetrics gm = res.getGrowthMetrics();
            assertNotNull(gm);
            assertEquals(0L, gm.getTotalUsers());
            assertEquals(0L, gm.getActiveUsers());
            assertEquals(0L, gm.getTotalTutors());
            assertEquals(0L, gm.getActiveTutors());
            assertEquals(0L, gm.getTotalCourses());
            assertEquals(0L, gm.getTotalEnrollments());
            assertEquals(0.0, gm.getConversionRate());
            assertEquals(0.0, gm.getRetentionRate());
            // totalUsers == 0 -> retention=0, churn=100
            assertEquals(100.0, gm.getChurnRate());

            // MonthlyGrowth
            assertNotNull(res.getMonthlyGrowth());
            assertTrue(res.getMonthlyGrowth().isEmpty());

            // Recent & Pending
            assertNotNull(res.getRecentUsers());
            assertTrue(res.getRecentUsers().isEmpty());

            assertNotNull(res.getRecentCourses());
            assertTrue(res.getRecentCourses().isEmpty());

            assertNotNull(res.getPendingApprovals());
            assertTrue(res.getPendingApprovals().isEmpty());
        }
    }

    // =====================================================================
    // CASE 2: Có dữ liệu đầy đủ
    // =====================================================================
    @Nested
    @DisplayName("AdminDashboardServiceImpl.getDashboard - With Data")
    class GetDashboardWithDataTests {

        /**
         * CASE 2 – FULL DATA
         * NOTE – Test tất cả các phần:
         *  - ActionableItems
         *  - FinancialOverview (GMV, Commission, Payout, AvgOrder)
         *  - RevenueBreakdown (lũy theo ngày)
         *  - RevenueByLanguage (Course only, với %GMV)
         *  - GrowthMetrics (conversion, retention, churn)
         *  - MonthlyGrowth (3 tháng)
         *  - RecentUsers & RecentCourses
         *  - PendingApprovals (tutor, course draft, course, refund, withdraw)
         */
        @Test
        @DisplayName("Dashboard với đầy đủ dữ liệu -> tính toán đúng tất cả phần")
        void getDashboard_withData_shouldReturnComputedValues() {
            LocalDate start = LocalDate.of(2025, 1, 5);
            LocalDate end = LocalDate.of(2025, 3, 20);

            // ========= ActionableItems =========
            when(tutorVerificationRepository.countByStatus(TutorVerificationStatus.PENDING))
                    .thenReturn(2L);
            when(courseDraftRepository.countByStatus(CourseDraftStatus.PENDING_REVIEW))
                    .thenReturn(1L);
            when(courseRepository.countByStatus(CourseStatus.Pending))
                    .thenReturn(1L);
            when(refundRequestRepository.countByStatusIn(anyList()))
                    .thenReturn(3L);
            when(withdrawMoneyRepository.countByStatus(WithdrawStatus.PENDING))
                    .thenReturn(4L);

            // ========= FinancialOverview + RevenueBreakdown =========
            Setting setting = buildSetting(
                    new BigDecimal("0.20"),  // 20% course
                    new BigDecimal("0.10")   // 10% booking
            );
            when(settingRepository.getCurrentSetting()).thenReturn(setting);

            LocalDateTime date1 = LocalDateTime.of(2025, 1, 5, 10, 0);
            LocalDateTime date2 = LocalDateTime.of(2025, 1, 5, 15, 0);
            LocalDateTime date3 = LocalDateTime.of(2025, 1, 6, 9, 0);

            Payment payment1 = buildPayment(PaymentType.Course, BigDecimal.valueOf(100),
                    PaymentStatus.PAID, date1, 1000L);
            Payment payment2 = buildPayment(PaymentType.Booking, BigDecimal.valueOf(50),
                    PaymentStatus.PAID, date2, null);
            Payment payment3 = buildPayment(PaymentType.Course, BigDecimal.valueOf(150),
                    PaymentStatus.PAID, date3, 1001L);

            List<Payment> allPayments = List.of(payment1, payment2, payment3);

            // GMV = 100 + 50 + 150 = 300
            // CommissionCourse = 20% -> (100 + 150) * 0.2 = 50
            // CommissionBooking = 10% -> 50 * 0.1 = 5
            // TotalCommission = 55
            // Payout = 300 - 55 = 245
            // AvgOrder = 300 / 3 = 100

            when(paymentRepository.findByStatusAndPaidAtBetween(
                    eq(PaymentStatus.PAID),
                    any(LocalDateTime.class),
                    any(LocalDateTime.class)
            )).thenReturn(allPayments);

            // ========= RevenueByLanguage (Course only) =========
            when(paymentRepository.findByStatusAndPaymentTypeAndPaidAtBetween(
                    eq(PaymentStatus.PAID),
                    eq(PaymentType.Course),
                    any(LocalDateTime.class),
                    any(LocalDateTime.class)
            )).thenReturn(List.of(payment1, payment3));

            // Course cho revenueByLanguage
            Tutor dummyTutor = buildTutor(
                    99L,
                    buildUser(999L, "Tutor X", "tx@example.com", true,
                            LocalDateTime.of(2024, 12, 1, 10, 0)),
                    TutorStatus.APPROVED
            );

            Course courseEnglish = buildCourse(1000L, "English 101", "English",
                    CourseLevel.BEGINNER, dummyTutor, CourseStatus.Approved,
                    LocalDateTime.of(2025, 1, 1, 10, 0));
            Course courseJapanese = buildCourse(1001L, "Japanese Basic", "Japanese",
                    CourseLevel.BEGINNER, dummyTutor, CourseStatus.Approved,
                    LocalDateTime.of(2025, 1, 2, 10, 0));

            when(courseRepository.findById(1000L)).thenReturn(Optional.of(courseEnglish));
            when(courseRepository.findById(1001L)).thenReturn(Optional.of(courseJapanese));

            // ========= GrowthMetrics =========
            when(userRepository.count()).thenReturn(10L);              // totalUsers
            when(userRepository.countByIsActiveTrue()).thenReturn(7L); // activeUsers
            when(tutorRepository.count()).thenReturn(4L);
            when(tutorRepository.countByStatus(TutorStatus.APPROVED)).thenReturn(3L);
            when(courseRepository.count()).thenReturn(5L);
            when(enrollmentRepository.count()).thenReturn(20L);
            when(enrollmentRepository.countDistinctLearners()).thenReturn(8L);
            // => conversionRate = 8/10 * 100 = 80
            //    retentionRate = 7/10 * 100 = 70
            //    churnRate = 30

            // ========= MonthlyGrowth =========

            User uJan10 = buildUser(1L, "User Jan10", "u1@example.com",
                    true, LocalDateTime.of(2025, 1, 10, 9, 0));
            User uJan20 = buildUser(2L, "User Jan20", "u2@example.com",
                    true, LocalDateTime.of(2025, 1, 20, 9, 0));
            User uMar5 = buildUser(3L, "User Mar05", "u3@example.com",
                    true, LocalDateTime.of(2025, 3, 5, 9, 0));
            List<User> allUsersCreated = List.of(uJan10, uJan20, uMar5);

            when(userRepository.findByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(allUsersCreated);

            Tutor tJan15 = buildTutor(
                    1L,
                    buildUser(10L, "Tutor Jan15", "tj15@example.com", true,
                            LocalDateTime.of(2025, 1, 15, 10, 0)),
                    TutorStatus.APPROVED
            );
            Tutor tMar1 = buildTutor(
                    2L,
                    buildUser(11L, "Tutor Mar01", "tm01@example.com", true,
                            LocalDateTime.of(2025, 3, 1, 10, 0)),
                    TutorStatus.APPROVED
            );
            List<Tutor> tutorsCreated = List.of(tJan15, tMar1);

            when(tutorRepository.findByUserCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(tutorsCreated);

            Enrollment eJan12 = buildEnrollment(1L, uJan10, courseEnglish, EnrollmentStatus.Active,
                    LocalDateTime.of(2025, 1, 12, 8, 0));
            Enrollment eFeb5 = buildEnrollment(2L, uJan20, courseJapanese, EnrollmentStatus.Active,
                    LocalDateTime.of(2025, 2, 5, 8, 0));
            Enrollment eMar8 = buildEnrollment(3L, uMar5, courseEnglish, EnrollmentStatus.Completed,
                    LocalDateTime.of(2025, 3, 8, 8, 0));

            when(enrollmentRepository.findByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                    .thenReturn(List.of(eJan12, eFeb5, eMar8));

            // ========= RecentUsers =========
            when(userRepository.findTop5ByOrderByCreatedAtDesc())
                    .thenReturn(List.of(uMar5, uJan20, uJan10)); // đã sort desc

            // ========= RecentCourses =========
            Course recentCourse1 = buildCourse(2000L, "Spanish A1", "Spanish", CourseLevel.BEGINNER,
                    dummyTutor, CourseStatus.Approved,
                    LocalDateTime.of(2025, 3, 1, 10, 0));

            Course recentCourse2 = buildCourse(2001L, "Korean 101", "Korean", CourseLevel.BEGINNER,
                    dummyTutor, CourseStatus.Pending,
                    LocalDateTime.of(2025, 2, 20, 10, 0));

            when(courseRepository.findTop5ByStatusNotOrderByCreatedAtDesc(CourseStatus.Draft))
                    .thenReturn(List.of(recentCourse1, recentCourse2));

            // ========= PendingApprovals =========
            TutorVerification tv = buildTutorVerification(
                    1L,
                    dummyTutor,
                    LocalDateTime.of(2025, 1, 3, 9, 0)
            );
            when(tutorVerificationRepository.findTop10ByStatusOrderBySubmittedAtAsc(TutorVerificationStatus.PENDING))
                    .thenReturn(List.of(tv));

            CourseDraft cd = buildCourseDraft(
                    10L,
                    "Draft English Advanced",
                    courseEnglish,
                    LocalDateTime.of(2025, 1, 4, 9, 0),
                    CourseDraftStatus.PENDING_REVIEW
            );
            when(courseDraftRepository.findTop10ByStatusOrderByCreatedAtAsc(CourseDraftStatus.PENDING_REVIEW))
                    .thenReturn(List.of(cd));

            Course pendingCourse = buildCourse(
                    3000L,
                    "German B1",
                    "German",
                    CourseLevel.INTERMEDIATE,
                    dummyTutor,
                    CourseStatus.Pending,
                    LocalDateTime.of(2025, 1, 5, 9, 0)
            );
            when(courseRepository.findTop10ByStatusOrderByCreatedAtAsc(CourseStatus.Pending))
                    .thenReturn(List.of(pendingCourse));

            RefundRequest refund = buildRefundRequest(
                    100L,
                    BigDecimal.valueOf(80),
                    LocalDateTime.of(2025, 1, 6, 9, 0),
                    RefundStatus.PENDING
            );
            when(refundRequestRepository.findTop10ByStatusInOrderByCreatedAtAsc(anyList()))
                    .thenReturn(List.of(refund));

            WithdrawMoney withdraw = buildWithdrawMoney(
                    200L,
                    dummyTutor,
                    BigDecimal.valueOf(120),
                    LocalDateTime.of(2025, 1, 7, 9, 0),
                    WithdrawStatus.PENDING
            );
            when(withdrawMoneyRepository.findTop10ByStatusOrderByCreatedAtAsc(WithdrawStatus.PENDING))
                    .thenReturn(List.of(withdraw));

            // ===================== CALL SERVICE =====================
            AdminDashboardResponse res = adminDashboardService.getDashboard(start, end);

            assertNotNull(res);

            // ===== ActionableItems =====
            ActionableItems ai = res.getActionableItems();
            assertEquals(2L, ai.getPendingTutors());
            assertEquals(2L, ai.getPendingCourses());        // 1 course + 1 draft
            assertEquals(3L, ai.getPendingRefundRequests());
            assertEquals(4L, ai.getPendingWithdraws());
            assertEquals(0L, ai.getReportedContents());

            // ===== FinancialOverview =====
            FinancialOverview fo = res.getFinancialOverview();
            assertBigDecimalEquals(300.0, fo.getTotalGMV());
            assertBigDecimalEquals(55.0, fo.getTotalCommission());
            assertBigDecimalEquals(245.0, fo.getTotalPayout());
            assertEquals(3L, fo.getTotalPaidOrders());
            assertBigDecimalEquals(100.0, fo.getAvgOrderValue());

            // ===== RevenueBreakdown =====
            List<DailyRevenuePoint> daily = res.getRevenueBreakdown();
            assertEquals(2, daily.size());

            DailyRevenuePoint d1 = daily.get(0);
            assertEquals(LocalDate.of(2025, 1, 5), d1.getDate());
            assertBigDecimalEquals(150.0, d1.getGmv());        // 100 + 50
            assertBigDecimalEquals(25.0, d1.getCommission());  // 20 + 5
            assertBigDecimalEquals(125.0, d1.getPayout());

            DailyRevenuePoint d2 = daily.get(1);
            assertEquals(LocalDate.of(2025, 1, 6), d2.getDate());
            assertBigDecimalEquals(150.0, d2.getGmv());
            assertBigDecimalEquals(30.0, d2.getCommission());  // 150*0.2
            assertBigDecimalEquals(120.0, d2.getPayout());

            // ===== RevenueByLanguage =====
            List<LanguageRevenueItem> langItems = res.getRevenueByLanguage();
            assertEquals(2, langItems.size());

            LanguageRevenueItem lang1 = langItems.get(0); // Japanese 150
            assertEquals("Japanese", lang1.getLanguage());
            assertBigDecimalEquals(150.0, lang1.getGmv());
            assertBigDecimalEquals(30.0, lang1.getCommission());
            assertBigDecimalEquals(120.0, lang1.getPayout());
            assertEquals(1L, lang1.getCourseCount());
            assertEquals(50.0, lang1.getPercentGMV());

            LanguageRevenueItem lang2 = langItems.get(1); // English 100
            assertEquals("English", lang2.getLanguage());
            assertBigDecimalEquals(100.0, lang2.getGmv());
            assertBigDecimalEquals(20.0, lang2.getCommission());
            assertBigDecimalEquals(80.0, lang2.getPayout());
            assertEquals(1L, lang2.getCourseCount());
            assertEquals(33.33, lang2.getPercentGMV());

            // ===== GrowthMetrics =====
            GrowthMetrics gm = res.getGrowthMetrics();
            assertEquals(10L, gm.getTotalUsers());
            assertEquals(7L, gm.getActiveUsers());
            assertEquals(4L, gm.getTotalTutors());
            assertEquals(3L, gm.getActiveTutors());
            assertEquals(5L, gm.getTotalCourses());
            assertEquals(20L, gm.getTotalEnrollments());
            assertEquals(80.0, gm.getConversionRate());
            assertEquals(70.0, gm.getRetentionRate());
            assertEquals(30.0, gm.getChurnRate());

            // ===== MonthlyGrowth =====
            List<MonthlyGrowthPoint> mg = res.getMonthlyGrowth();
            assertEquals(3, mg.size());

            MonthlyGrowthPoint jan = mg.get(0);
            assertEquals(2025, jan.getYear());
            assertEquals(1, jan.getMonth());
            assertEquals(2, jan.getNewUsers());
            assertEquals(1, jan.getNewTutors());
            assertEquals(1, jan.getNewEnrollments());

            MonthlyGrowthPoint feb = mg.get(1);
            assertEquals(2025, feb.getYear());
            assertEquals(2, feb.getMonth());
            assertEquals(0, feb.getNewUsers());
            assertEquals(0, feb.getNewTutors());
            assertEquals(1, feb.getNewEnrollments());

            MonthlyGrowthPoint mar = mg.get(2);
            assertEquals(2025, mar.getYear());
            assertEquals(3, mar.getMonth());
            assertEquals(1, mar.getNewUsers());
            assertEquals(1, mar.getNewTutors());
            assertEquals(1, mar.getNewEnrollments());

            // ===== RecentUsers =====
            List<RecentUserItem> recentUsers = res.getRecentUsers();
            assertEquals(3, recentUsers.size());
            assertEquals(uMar5.getUserID(), recentUsers.get(0).getUserId());
            assertEquals(uJan20.getUserID(), recentUsers.get(1).getUserId());
            assertEquals(uJan10.getUserID(), recentUsers.get(2).getUserId());

            // ===== RecentCourses =====
            List<RecentCourseItem> recentCourses = res.getRecentCourses();
            assertEquals(2, recentCourses.size());
            assertEquals(recentCourse1.getCourseID(), recentCourses.get(0).getCourseId());
            assertEquals("Spanish A1", recentCourses.get(0).getTitle());
            assertEquals("Spanish", recentCourses.get(0).getLanguage());

            // ===== PendingApprovals =====
            List<PendingApprovalItem> pending = res.getPendingApprovals();
            assertEquals(5, pending.size());

            PendingApprovalItem pa0 = pending.get(0);
            assertEquals("WITHDRAW", pa0.getType());
            assertEquals(withdraw.getWithdrawId(), pa0.getId());
            assertEquals("MEDIUM", pa0.getPriority());

            PendingApprovalItem pa1 = pending.get(1);
            assertEquals("REFUND", pa1.getType());
            assertEquals(refund.getRefundRequestId(), pa1.getId());
            assertEquals("HIGH", pa1.getPriority());

            PendingApprovalItem pa2 = pending.get(2);
            assertEquals("COURSE", pa2.getType());
            assertEquals(pendingCourse.getCourseID(), pa2.getId());

            PendingApprovalItem pa3 = pending.get(3);
            assertEquals("COURSE_DRAFT", pa3.getType());
            assertEquals(cd.getDraftID(), pa3.getId());

            PendingApprovalItem pa4 = pending.get(4);
            assertEquals("TUTOR_VERIFICATION", pa4.getType());
            assertEquals(tv.getTutorVerificationID(), pa4.getId());
        }
    }
}
