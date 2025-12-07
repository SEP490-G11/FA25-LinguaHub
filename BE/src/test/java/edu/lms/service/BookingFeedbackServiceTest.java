package edu.lms.service;

import edu.lms.dto.request.BookingFeedbackRequest;
import edu.lms.dto.response.BookingFeedbackResponse;
import edu.lms.entity.*;
import edu.lms.enums.PaymentStatus;
import edu.lms.enums.PaymentType;
import edu.lms.exception.AppException;
import edu.lms.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho BookingFeedbackService
 *
 * Cover:
 *  - createFeedback: 11 case (UTCID01–UTCID11)
 *  - updateFeedback: 12 case (UTCID01–UTCID12)
 *  - deleteFeedback: 5 case  (UTCID01–UTCID05)
 *
 * Lưu ý:
 *  - Ở đây chỉ assert type AppException, không gọi ex.getErrorCode()
 *    vì AppException hiện tại không expose method đó.
 */
@ExtendWith(MockitoExtension.class)
class BookingFeedbackServiceTest {

    @Mock
    BookingPlanRepository bookingPlanRepository;
    @Mock
    PaymentRepository paymentRepository;
    @Mock
    FeedbackRepository feedbackRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    TutorRepository tutorRepository;
    @Mock
    CourseRepository courseRepository;
    @Mock
    CourseReviewRepository courseReviewRepository;
    @Mock
    TutorRatingService tutorRatingService;

    @InjectMocks
    BookingFeedbackService bookingFeedbackService;

    // =======================
    // COMMON HELPERS
    // =======================

    private void setAuthEmail(String email) {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(email);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private User buildUser(Long id, String email, String fullName, String avatar) {
        User u = new User();
        u.setUserID(id);
        u.setEmail(email);
        u.setFullName(fullName);
        u.setAvatarURL(avatar);
        return u;
    }

    private Tutor buildTutor(Long id, User user) {
        Tutor t = new Tutor();
        t.setTutorID(id);
        t.setUser(user);
        return t;
    }

    private Payment buildPayment(Long paymentId, Long tutorId, Long userId, Long targetId) {
        Payment p = new Payment();
        p.setPaymentID(paymentId);
        p.setTutorId(tutorId);
        p.setUserId(userId);
        p.setTargetId(targetId);
        p.setPaymentType(PaymentType.Booking);
        p.setStatus(PaymentStatus.PAID);
        p.setPaidAt(LocalDateTime.now().minusDays(1));
        return p;
    }

    private BookingPlan buildBookingPlan(Long id) {
        BookingPlan plan = new BookingPlan();
        plan.setBookingPlanID(id);
        return plan;
    }

    private Feedback buildFeedback(Long id, User user, Payment payment,
                                   BigDecimal rating, String comment) {
        Feedback f = Feedback.builder()
                .user(user)
                .payment(payment)
                .rating(rating)
                .comment(comment)
                .build();
        f.setFeedbackID(id);
        return f;
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    // =====================================================================
    // createFeedback – UTCID01–UTCID11
    // =====================================================================

    @Nested
    @DisplayName("BookingFeedbackService.createFeedback")
    class CreateFeedbackTests {

        /**
         * UTCID01 – A
         * Precondition:
         *  - User email không tồn tại trong DB
         * Input:
         *  - rating = 4.0, comment = "Good"
         * Expect:
         *  - throws AppException (USER_NOT_FOUND)
         */
        @Test
        @DisplayName("UTCID01 - USER_NOT_FOUND khi email không tồn tại trong DB")
        void UTCID01_createFeedback_userNotFound() {
            setAuthEmail("notfound@mail.com");
            when(userRepository.findByEmail("notfound@mail.com"))
                    .thenReturn(Optional.empty());

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(4.0));
            req.setComment("Good");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.createFeedback(1L, req));
        }

        /**
         * UTCID02 – A
         * Precondition:
         *  - User tồn tại
         *  - BookingPlan không tồn tại
         * Expect:
         *  - AppException (BOOKING_PLAN_NOT_FOUND)
         */
        @Test
        @DisplayName("UTCID02 - BOOKING_PLAN_NOT_FOUND khi bookingPlan không tồn tại")
        void UTCID02_createFeedback_bookingPlanNotFound() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            when(bookingPlanRepository.findById(99L))
                    .thenReturn(Optional.empty());

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(4.0));
            req.setComment("Good");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.createFeedback(99L, req));
        }

        /**
         * UTCID03 – A
         * Precondition:
         *  - User tồn tại
         *  - BookingPlan tồn tại
         *  - Chưa có Payment PAID
         * Expect:
         *  - AppException (BOOKING_NOT_PAID)
         */
        @Test
        @DisplayName("UTCID03 - BOOKING_NOT_PAID khi chưa có payment PAID cho booking plan")
        void UTCID03_createFeedback_bookingNotPaid() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long planId = 1L;
            when(bookingPlanRepository.findById(planId))
                    .thenReturn(Optional.of(buildBookingPlan(planId)));

            when(paymentRepository.findFirstByTargetIdAndUserIdAndPaymentTypeAndStatusOrderByPaidAtDesc(
                    planId, user.getUserID(), PaymentType.Booking, PaymentStatus.PAID
            )).thenReturn(Optional.empty());

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(3.0));
            req.setComment("");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.createFeedback(planId, req));
        }

        /**
         * UTCID04 – A
         * Feedback đã tồn tại
         * Expect:
         *  - AppException (ALREADY_FEEDBACK)
         */
        @Test
        @DisplayName("UTCID04 - ALREADY_FEEDBACK khi đã feedback plan này rồi")
        void UTCID04_createFeedback_alreadyFeedback() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long planId = 1L;
            BookingPlan plan = buildBookingPlan(planId);
            when(bookingPlanRepository.findById(planId))
                    .thenReturn(Optional.of(plan));

            Payment payment = buildPayment(100L, 200L, user.getUserID(), planId);
            when(paymentRepository.findFirstByTargetIdAndUserIdAndPaymentTypeAndStatusOrderByPaidAtDesc(
                    planId, user.getUserID(), PaymentType.Booking, PaymentStatus.PAID
            )).thenReturn(Optional.of(payment));

            when(feedbackRepository.findByPayment_PaymentIDAndUser_UserID(100L, 10L))
                    .thenReturn(Optional.of(new Feedback()));

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(2.0));
            req.setComment("Excellent");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.createFeedback(planId, req));
        }

        /**
         * UTCID05 – A (rating null)
         * Expect:
         *  - AppException (INVALID_RATING)
         */
        @Test
        @DisplayName("UTCID05 - INVALID_RATING khi rating = null")
        void UTCID05_createFeedback_ratingNull_invalid() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long planId = 1L;
            when(bookingPlanRepository.findById(planId))
                    .thenReturn(Optional.of(buildBookingPlan(planId)));

            Payment payment = buildPayment(100L, 200L, 10L, planId);
            when(paymentRepository.findFirstByTargetIdAndUserIdAndPaymentTypeAndStatusOrderByPaidAtDesc(
                    planId, 10L, PaymentType.Booking, PaymentStatus.PAID
            )).thenReturn(Optional.of(payment));

            when(feedbackRepository.findByPayment_PaymentIDAndUser_UserID(100L, 10L))
                    .thenReturn(Optional.empty());

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(null);
            req.setComment("Null rating");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.createFeedback(planId, req));
        }

        /**
         * UTCID06 – A (rating < 0)
         * Expect:
         *  - AppException (INVALID_RATING)
         */
        @Test
        @DisplayName("UTCID06 - INVALID_RATING khi rating < 0")
        void UTCID06_createFeedback_ratingNegative_invalid() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long planId = 1L;
            when(bookingPlanRepository.findById(planId))
                    .thenReturn(Optional.of(buildBookingPlan(planId)));

            Payment payment = buildPayment(100L, 200L, 10L, planId);
            when(paymentRepository.findFirstByTargetIdAndUserIdAndPaymentTypeAndStatusOrderByPaidAtDesc(
                    planId, 10L, PaymentType.Booking, PaymentStatus.PAID
            )).thenReturn(Optional.of(payment));

            when(feedbackRepository.findByPayment_PaymentIDAndUser_UserID(100L, 10L))
                    .thenReturn(Optional.empty());

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(-1));
            req.setComment("Bad");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.createFeedback(planId, req));
        }

        /**
         * UTCID07 – A (rating > 5)
         * Expect:
         *  - AppException (INVALID_RATING)
         */
        @Test
        @DisplayName("UTCID07 - INVALID_RATING khi rating > 5")
        void UTCID07_createFeedback_ratingTooHigh_invalid() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long planId = 1L;
            when(bookingPlanRepository.findById(planId))
                    .thenReturn(Optional.of(buildBookingPlan(planId)));

            Payment payment = buildPayment(100L, 200L, 10L, planId);
            when(paymentRepository.findFirstByTargetIdAndUserIdAndPaymentTypeAndStatusOrderByPaidAtDesc(
                    planId, 10L, PaymentType.Booking, PaymentStatus.PAID
            )).thenReturn(Optional.of(payment));

            when(feedbackRepository.findByPayment_PaymentIDAndUser_UserID(100L, 10L))
                    .thenReturn(Optional.empty());

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(5.5));
            req.setComment("Too high");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.createFeedback(planId, req));
        }

        /**
         * UTCID08 – A (rating không step 0.5)
         * Expect:
         *  - AppException (INVALID_RATING)
         */
        @Test
        @DisplayName("UTCID08 - INVALID_RATING khi rating không theo bước 0.5")
        void UTCID08_createFeedback_ratingNotHalfStep_invalid() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long planId = 1L;
            when(bookingPlanRepository.findById(planId))
                    .thenReturn(Optional.of(buildBookingPlan(planId)));

            Payment payment = buildPayment(100L, 200L, 10L, planId);
            when(paymentRepository.findFirstByTargetIdAndUserIdAndPaymentTypeAndStatusOrderByPaidAtDesc(
                    planId, 10L, PaymentType.Booking, PaymentStatus.PAID
            )).thenReturn(Optional.of(payment));

            when(feedbackRepository.findByPayment_PaymentIDAndUser_UserID(100L, 10L))
                    .thenReturn(Optional.empty());

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(3.7));
            req.setComment("Bad");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.createFeedback(planId, req));
        }

        /**
         * UTCID09 – B (Boundary rating=0.0)
         * Expect:
         *  - Tạo feedback thành công
         */
        @Test
        @DisplayName("UTCID09 - Boundary rating=0.0, comment=\"\" -> tạo feedback thành công")
        void UTCID09_createFeedback_ratingZeroBoundary_success() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", "avatar.png");
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long planId = 1L;
            when(bookingPlanRepository.findById(planId))
                    .thenReturn(Optional.of(buildBookingPlan(planId)));

            Long tutorId = 200L;
            Payment payment = buildPayment(100L, tutorId, 10L, planId);
            when(paymentRepository.findFirstByTargetIdAndUserIdAndPaymentTypeAndStatusOrderByPaidAtDesc(
                    planId, 10L, PaymentType.Booking, PaymentStatus.PAID
            )).thenReturn(Optional.of(payment));

            when(feedbackRepository.findByPayment_PaymentIDAndUser_UserID(100L, 10L))
                    .thenReturn(Optional.empty());

            Tutor tutor = buildTutor(tutorId, buildUser(20L, "tutor@mail.com", "Tutor Name", null));
            when(tutorRepository.findById(tutorId)).thenReturn(Optional.of(tutor));

            when(feedbackRepository.save(any(Feedback.class)))
                    .thenAnswer(inv -> {
                        Feedback f = inv.getArgument(0);
                        f.setFeedbackID(1L);
                        return f;
                    });

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.ZERO);
            req.setComment("");

            BookingFeedbackResponse res =
                    bookingFeedbackService.createFeedback(planId, req);

            assertNotNull(res);
            assertEquals(1L, res.getFeedbackID());
            assertEquals(BigDecimal.ZERO, res.getRating());
            assertEquals("", res.getComment());
            assertEquals(tutorId, res.getTutorId());
            assertEquals("Tutor Name", res.getTutorName());
            assertEquals("User A", res.getUserFullName());
            assertEquals("avatar.png", res.getUserAvatarURL());
            assertNotNull(res.getCreatedAt());

            verify(tutorRatingService).recalculateTutorRating(tutorId);
        }

        /**
         * UTCID10 – A (Tutor không tồn tại)
         * Expect:
         *  - AppException (TUTOR_NOT_FOUND)
         */
        @Test
        @DisplayName("UTCID10 - TUTOR_NOT_FOUND khi tutorId từ payment không tồn tại")
        void UTCID10_createFeedback_tutorNotFound() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long planId = 1L;
            when(bookingPlanRepository.findById(planId))
                    .thenReturn(Optional.of(buildBookingPlan(planId)));

            Long tutorId = 999L;
            Payment payment = buildPayment(100L, tutorId, 10L, planId);
            when(paymentRepository.findFirstByTargetIdAndUserIdAndPaymentTypeAndStatusOrderByPaidAtDesc(
                    planId, 10L, PaymentType.Booking, PaymentStatus.PAID
            )).thenReturn(Optional.of(payment));

            when(feedbackRepository.findByPayment_PaymentIDAndUser_UserID(100L, 10L))
                    .thenReturn(Optional.empty());

            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.empty());

            when(feedbackRepository.save(any(Feedback.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(4.0));
            req.setComment("Excellent");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.createFeedback(planId, req));
        }

        /**
         * UTCID11 – N (Happy path)
         * rating=4.0, comment="Excellent"
         */
        @Test
        @DisplayName("UTCID11 - Happy path tạo feedback thành công (rating=4.0, comment=\"Excellent\")")
        void UTCID11_createFeedback_happyPath_success() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", "avatar.png");
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long planId = 1L;
            when(bookingPlanRepository.findById(planId))
                    .thenReturn(Optional.of(buildBookingPlan(planId)));

            Long tutorId = 200L;
            Payment payment = buildPayment(100L, tutorId, 10L, planId);
            when(paymentRepository.findFirstByTargetIdAndUserIdAndPaymentTypeAndStatusOrderByPaidAtDesc(
                    planId, 10L, PaymentType.Booking, PaymentStatus.PAID
            )).thenReturn(Optional.of(payment));

            when(feedbackRepository.findByPayment_PaymentIDAndUser_UserID(100L, 10L))
                    .thenReturn(Optional.empty());

            Tutor tutor = buildTutor(tutorId, buildUser(20L, "tutor@mail.com", "Tutor Name", null));
            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.of(tutor));

            when(feedbackRepository.save(any(Feedback.class)))
                    .thenAnswer(inv -> {
                        Feedback f = inv.getArgument(0);
                        f.setFeedbackID(1L);
                        return f;
                    });

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(4.0));
            req.setComment("Excellent");

            BookingFeedbackResponse res =
                    bookingFeedbackService.createFeedback(planId, req);

            assertEquals(1L, res.getFeedbackID());
            assertEquals(BigDecimal.valueOf(4.0), res.getRating());
            assertEquals("Excellent", res.getComment());
            assertEquals(tutorId, res.getTutorId());
            verify(tutorRatingService).recalculateTutorRating(tutorId);
        }
    }

    // =====================================================================
    // updateFeedback – UTCID01–UTCID12
    // =====================================================================

    @Nested
    @DisplayName("BookingFeedbackService.updateFeedback")
    class UpdateFeedbackTests {

        /**
         * UTCID01 – A
         * User không tồn tại => USER_NOT_FOUND
         */
        @Test
        @DisplayName("UTCID01 - USER_NOT_FOUND khi email không tồn tại")
        void UTCID01_updateFeedback_userNotFound() {
            setAuthEmail("notfound@mail.com");
            when(userRepository.findByEmail("notfound@mail.com"))
                    .thenReturn(Optional.empty());

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(4.0));
            req.setComment("Nice");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.updateFeedback(1L, req));
        }

        /**
         * UTCID02 – A
         * Feedback không tồn tại => REVIEW_NOT_FOUND
         */
        @Test
        @DisplayName("UTCID02 - REVIEW_NOT_FOUND khi feedbackId không tồn tại")
        void UTCID02_updateFeedback_reviewNotFound() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            when(feedbackRepository.findById(99L))
                    .thenReturn(Optional.empty());

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(4.0));
            req.setComment("Nice");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.updateFeedback(99L, req));
        }

        /**
         * UTCID03 – A
         * Feedback thuộc user khác => UNAUTHORIZED
         */
        @Test
        @DisplayName("UTCID03 - UNAUTHORIZED khi feedback không thuộc user hiện tại")
        void UTCID03_updateFeedback_unauthorizedUser() {
            setAuthEmail("user1@mail.com");
            User currentUser = buildUser(10L, "user1@mail.com", "User 1", null);
            when(userRepository.findByEmail("user1@mail.com"))
                    .thenReturn(Optional.of(currentUser));

            User otherUser = buildUser(20L, "user2@mail.com", "User 2", null);
            Payment payment = buildPayment(100L, 200L, otherUser.getUserID(), 1L);
            Feedback feedback = buildFeedback(1L, otherUser, payment, BigDecimal.valueOf(3.0), "Happy");

            when(feedbackRepository.findById(1L))
                    .thenReturn(Optional.of(feedback));

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(4.0));
            req.setComment("Happy");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.updateFeedback(1L, req));
        }

        /**
         * UTCID04 – A (rating null)
         */
        @Test
        @DisplayName("UTCID04 - INVALID_RATING khi rating null")
        void UTCID04_updateFeedback_ratingNull_invalid() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Payment payment = buildPayment(100L, 200L, 10L, 1L);
            Feedback feedback = buildFeedback(1L, user, payment, BigDecimal.valueOf(3.0), "Happy");
            when(feedbackRepository.findById(1L))
                    .thenReturn(Optional.of(feedback));

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(null);
            req.setComment("Happy");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.updateFeedback(1L, req));
        }

        /**
         * UTCID05 – A (rating không 0.5 step)
         */
        @Test
        @DisplayName("UTCID05 - INVALID_RATING khi rating không phải bước 0.5")
        void UTCID05_updateFeedback_ratingNotHalfStep_invalid() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Payment payment = buildPayment(100L, 200L, 10L, 1L);
            Feedback feedback = buildFeedback(1L, user, payment, BigDecimal.valueOf(3.0), "Happy");
            when(feedbackRepository.findById(1L))
                    .thenReturn(Optional.of(feedback));

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(3.7));
            req.setComment("Happy");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.updateFeedback(1L, req));
        }

        /**
         * UTCID06 – A (rating < 0)
         */
        @Test
        @DisplayName("UTCID06 - INVALID_RATING khi rating < 0")
        void UTCID06_updateFeedback_ratingNegative_invalid() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Payment payment = buildPayment(100L, 200L, 10L, 1L);
            Feedback feedback = buildFeedback(1L, user, payment, BigDecimal.valueOf(3.0), "Happy");
            when(feedbackRepository.findById(1L))
                    .thenReturn(Optional.of(feedback));

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(-1.0));
            req.setComment("Happy");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.updateFeedback(1L, req));
        }

        /**
         * UTCID07 – A (rating > 5)
         */
        @Test
        @DisplayName("UTCID07 - INVALID_RATING khi rating > 5")
        void UTCID07_updateFeedback_ratingTooHigh_invalid() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Payment payment = buildPayment(100L, 200L, 10L, 1L);
            Feedback feedback = buildFeedback(1L, user, payment, BigDecimal.valueOf(3.0), "Happy");
            when(feedbackRepository.findById(1L))
                    .thenReturn(Optional.of(feedback));

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(5.5));
            req.setComment("Happy");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.updateFeedback(1L, req));
        }

        /**
         * UTCID08 – A (Tutor không tồn tại)
         */
        @Test
        @DisplayName("UTCID08 - TUTOR_NOT_FOUND khi tutorId từ payment không tồn tại")
        void UTCID08_updateFeedback_tutorNotFound() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long tutorId = 999L;
            Payment payment = buildPayment(100L, tutorId, 10L, 1L);
            Feedback feedback = buildFeedback(1L, user, payment, BigDecimal.valueOf(3.0), "Nice");
            when(feedbackRepository.findById(1L))
                    .thenReturn(Optional.of(feedback));

            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.empty());

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(4.0));
            req.setComment("Nice");

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.updateFeedback(1L, req));
        }

        /**
         * UTCID09 – B (Boundary rating=0.0)
         */
        @Test
        @DisplayName("UTCID09 - Boundary rating=0.0, comment=\"\" -> update thành công")
        void UTCID09_updateFeedback_ratingZeroBoundary_success() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", "avatar.png");
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long tutorId = 200L;
            Payment payment = buildPayment(100L, tutorId, 10L, 1L);
            Feedback feedback = buildFeedback(1L, user, payment, BigDecimal.valueOf(3.0), "Old");
            when(feedbackRepository.findById(1L))
                    .thenReturn(Optional.of(feedback));

            Tutor tutor = buildTutor(tutorId, buildUser(20L, "tutor@mail.com", "Tutor Name", null));
            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.of(tutor));

            when(feedbackRepository.save(any(Feedback.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.ZERO);
            req.setComment("");

            BookingFeedbackResponse res =
                    bookingFeedbackService.updateFeedback(1L, req);

            assertEquals(BigDecimal.ZERO, res.getRating());
            assertEquals("", res.getComment());
            assertEquals(1L, res.getFeedbackID());
            assertEquals(tutorId, res.getTutorId());
            assertEquals("Tutor Name", res.getTutorName());
            assertEquals("User A", res.getUserFullName());
            assertEquals("avatar.png", res.getUserAvatarURL());
            assertEquals(payment.getPaidAt(), res.getCreatedAt());

            verify(tutorRatingService).recalculateTutorRating(tutorId);
        }

        /**
         * UTCID10 – B (rating=5.0)
         */
        @Test
        @DisplayName("UTCID10 - rating=5.0, comment=\"Nice\" -> update thành công")
        void UTCID10_updateFeedback_ratingFive_success() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long tutorId = 200L;
            Payment payment = buildPayment(100L, tutorId, 10L, 1L);
            Feedback feedback = buildFeedback(1L, user, payment, BigDecimal.valueOf(4.0), "Old");
            when(feedbackRepository.findById(1L))
                    .thenReturn(Optional.of(feedback));

            Tutor tutor = buildTutor(tutorId, buildUser(20L, "tutor@mail.com", "Tutor Name", null));
            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.of(tutor));

            when(feedbackRepository.save(any(Feedback.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(5.0));
            req.setComment("Nice");

            BookingFeedbackResponse res =
                    bookingFeedbackService.updateFeedback(1L, req);

            assertEquals(BigDecimal.valueOf(5.0), res.getRating());
            assertEquals("Nice", res.getComment());
            verify(tutorRatingService).recalculateTutorRating(tutorId);
        }

        /**
         * UTCID11 – N (rating=4.0, comment="Happy")
         */
        @Test
        @DisplayName("UTCID11 - rating=4.0, comment=\"Happy\" -> update thành công")
        void UTCID11_updateFeedback_happyPath_success() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long tutorId = 200L;
            Payment payment = buildPayment(100L, tutorId, 10L, 1L);
            Feedback feedback = buildFeedback(1L, user, payment, BigDecimal.valueOf(2.0), "Old");
            when(feedbackRepository.findById(1L))
                    .thenReturn(Optional.of(feedback));

            Tutor tutor = buildTutor(tutorId, buildUser(20L, "tutor@mail.com", "Tutor Name", null));
            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.of(tutor));

            when(feedbackRepository.save(any(Feedback.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(4.0));
            req.setComment("Happy");

            BookingFeedbackResponse res =
                    bookingFeedbackService.updateFeedback(1L, req);

            assertEquals(BigDecimal.valueOf(4.0), res.getRating());
            assertEquals("Happy", res.getComment());
            verify(tutorRatingService).recalculateTutorRating(tutorId);
        }

        /**
         * UTCID12 – N (update comment)
         */
        @Test
        @DisplayName("UTCID12 - Update comment=\"Update comment\" thành công")
        void UTCID12_updateFeedback_updateCommentOnly_success() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long tutorId = 200L;
            Payment payment = buildPayment(100L, tutorId, 10L, 1L);
            Feedback feedback = buildFeedback(1L, user, payment, BigDecimal.valueOf(4.0), "Old comment");
            when(feedbackRepository.findById(1L))
                    .thenReturn(Optional.of(feedback));

            Tutor tutor = buildTutor(tutorId, buildUser(20L, "tutor@mail.com", "Tutor Name", null));
            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.of(tutor));

            when(feedbackRepository.save(any(Feedback.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            BookingFeedbackRequest req = new BookingFeedbackRequest();
            req.setRating(BigDecimal.valueOf(4.0)); // giữ nguyên rating
            req.setComment("Update comment");

            BookingFeedbackResponse res =
                    bookingFeedbackService.updateFeedback(1L, req);

            assertEquals(BigDecimal.valueOf(4.0), res.getRating());
            assertEquals("Update comment", res.getComment());
            verify(tutorRatingService).recalculateTutorRating(tutorId);
        }
    }

    // =====================================================================
    // deleteFeedback – UTCID01–UTCID05
    // =====================================================================

    @Nested
    @DisplayName("BookingFeedbackService.deleteFeedback")
    class DeleteFeedbackTests {

        /**
         * UTCID01 – A
         * User không tồn tại => USER_NOT_FOUND
         */
        @Test
        @DisplayName("UTCID01 - USER_NOT_FOUND khi deleteFeedback mà email không tồn tại")
        void UTCID01_deleteFeedback_userNotFound() {
            setAuthEmail("notfound@mail.com");
            when(userRepository.findByEmail("notfound@mail.com"))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.deleteFeedback(10L));
        }

        /**
         * UTCID02 – A
         * Feedback không tồn tại => REVIEW_NOT_FOUND
         */
        @Test
        @DisplayName("UTCID02 - REVIEW_NOT_FOUND khi feedbackId không tồn tại")
        void UTCID02_deleteFeedback_reviewNotFound() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            when(feedbackRepository.findById(99L))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.deleteFeedback(99L));
        }

        /**
         * UTCID03 – A
         * Feedback thuộc user khác => UNAUTHORIZED
         */
        @Test
        @DisplayName("UTCID03 - UNAUTHORIZED khi user không phải chủ feedback")
        void UTCID03_deleteFeedback_unauthorizedUser() {
            setAuthEmail("user1@mail.com");
            User currentUser = buildUser(10L, "user1@mail.com", "User 1", null);
            when(userRepository.findByEmail("user1@mail.com"))
                    .thenReturn(Optional.of(currentUser));

            User otherUser = buildUser(20L, "user2@mail.com", "User 2", null);
            Payment payment = buildPayment(100L, 200L, otherUser.getUserID(), 1L);
            Feedback feedback = buildFeedback(5L, otherUser, payment, BigDecimal.valueOf(4.0), "Nice");

            when(feedbackRepository.findById(5L))
                    .thenReturn(Optional.of(feedback));

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.deleteFeedback(5L));
        }

        /**
         * UTCID04 – A
         * Tutor không tồn tại => TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("UTCID04 - TUTOR_NOT_FOUND khi tutorId không tồn tại")
        void UTCID04_deleteFeedback_tutorNotFound() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long tutorId = 999L;
            Payment payment = buildPayment(100L, tutorId, 10L, 1L);
            Feedback feedback = buildFeedback(10L, user, payment, BigDecimal.valueOf(4.0), "Nice");
            when(feedbackRepository.findById(10L))
                    .thenReturn(Optional.of(feedback));

            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.empty());

            assertThrows(AppException.class,
                    () -> bookingFeedbackService.deleteFeedback(10L));
        }

        /**
         * UTCID05 – N
         * Happy path deleteFeedback
         */
        @Test
        @DisplayName("UTCID05 - Happy path deleteFeedback thành công")
        void UTCID05_deleteFeedback_success() {
            setAuthEmail("user@mail.com");
            User user = buildUser(10L, "user@mail.com", "User A", null);
            when(userRepository.findByEmail("user@mail.com"))
                    .thenReturn(Optional.of(user));

            Long tutorId = 200L;
            Payment payment = buildPayment(100L, tutorId, 10L, 1L);
            Feedback feedback = buildFeedback(10L, user, payment, BigDecimal.valueOf(4.0), "Nice");
            when(feedbackRepository.findById(10L))
                    .thenReturn(Optional.of(feedback));

            Tutor tutor = buildTutor(tutorId, buildUser(20L, "tutor@mail.com", "Tutor Name", null));
            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.of(tutor));

            bookingFeedbackService.deleteFeedback(10L);

            verify(feedbackRepository).delete(feedback);
            verify(tutorRatingService).recalculateTutorRating(tutorId);
        }
    }
}
