package edu.lms.service;

import edu.lms.dto.request.PaymentRequest;
import edu.lms.dto.request.SlotRequest;
import edu.lms.dto.response.PaymentResponse;
import edu.lms.entity.*;
import edu.lms.enums.PaymentStatus;
import edu.lms.enums.PaymentType;
import edu.lms.enums.SlotStatus;
import edu.lms.exception.AppException;
import edu.lms.mapper.PaymentMapper;
import edu.lms.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;
import vn.payos.type.CheckoutResponseData;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * PaymentServiceTest
 *
 * Cover các public method:
 *  - createPayment (14 case UTCID01–UTCID14)
 *  - processPostPayment
 *  - handleUserCancelPayment
 *  - rollbackBookingSlots
 *  - getPaymentsByTutor / getPaymentsByUser / getAllPayments / getPaymentsForMe
 *
 * Lưu ý: KHÔNG dùng AppException.getErrorCode, RoleEntity, Answer, InvocationOnMock,...
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaymentServiceTest {

    @Mock
    CourseRepository courseRepository;
    @Mock
    BookingPlanRepository bookingPlanRepository;
    @Mock
    BookingPlanSlotRepository bookingPlanSlotRepository;
    @Mock
    EnrollmentRepository enrollmentRepository;
    @Mock
    PaymentRepository paymentRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    TutorRepository tutorRepository;

    // Deep stub để stub được createPaymentLink(...).data() và .expiredAt()
    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    PayOSService payOSService;

    @Mock
    ChatService chatService;
    @Mock
    PaymentMapper paymentMapper;
    @Mock
    UserPackageRepository userPackageRepository;
    @Mock
    SettingRepository settingRepository;
    @Mock
    WithdrawService withdrawService;
    @Mock
    CloudflareTurnstileService cloudflareTurnstileService;
    @Mock
    NotificationService notificationService;
    @Mock
    TutorPackageRepository tutorPackageRepository;

    @InjectMocks
    PaymentService paymentService;

    // =======================
    // HELPER BUILD ENTITY
    // =======================

    private Course buildCourse(Long id, BigDecimal price, Long tutorId) {
        Tutor tutor = buildTutor(tutorId, BigDecimal.ZERO);

        Course c = new Course();
        c.setCourseID(id);
        c.setTitle("Course " + id);
        c.setPrice(price);
        c.setTutor(tutor);
        return c;
    }

    private BookingPlan buildBookingPlan(Long id, Long tutorId, double pricePerHour) {
        BookingPlan plan = new BookingPlan();
        plan.setBookingPlanID(id);
        plan.setTutorID(tutorId);
        plan.setTitle("Booking plan " + id);
        plan.setPricePerHours(pricePerHour);
        return plan;
    }

    private User buildUser(Long id) {
        User u = new User();
        u.setUserID(id);
        u.setEmail("user" + id + "@mail.com");
        return u;
    }

    private Tutor buildTutor(Long id, BigDecimal walletBalance) {
        Tutor t = new Tutor();
        t.setTutorID(id);
        t.setWalletBalance(walletBalance);

        // Đảm bảo luôn có user để tránh NPE khi gọi tutor.getUser().getUserID()
        User u = new User();
        u.setUserID(id + 1000);
        u.setEmail("tutor" + id + "@mail.com");
        t.setUser(u);

        return t;
    }

    private SlotRequest buildSlot(LocalDateTime start, LocalDateTime end) {
        SlotRequest s = new SlotRequest();
        s.setStartTime(start);
        s.setEndTime(end);
        return s;
    }

    private PaymentRequest buildCoursePaymentRequest(Long userId, Long courseId) {
        return PaymentRequest.builder()
                .userId(userId)
                .targetId(courseId)
                .paymentType(PaymentType.Course)
                .build();
    }

    private PaymentRequest buildBookingPaymentRequest(Long userId,
                                                      Long planId,
                                                      List<SlotRequest> slots,
                                                      Long userPackageId,
                                                      String turnstileToken) {
        return PaymentRequest.builder()
                .userId(userId)
                .targetId(planId)
                .paymentType(PaymentType.Booking)
                .userPackageId(userPackageId)
                .slots(slots)
                .turnstileToken(turnstileToken)
                .build();
    }

    /**
     * paymentRepository.save(...) trả về chính argument truyền vào.
     * (Chỉ cần behavior OK, không cần quan tâm paymentID do DB generate).
     */
    private void mockPaymentSaveReturnArgument() {
        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(invocation -> (Payment) invocation.getArgument(0));
    }

    // =====================================================================
    // createPayment – 14 test case (UTCID01–UTCID14)
    // =====================================================================

    @Nested
    @DisplayName("PaymentService.createPayment – UTCID01–UTCID14")
    class CreatePaymentTests {

        /**
         * UTCID01
         * - Course Payment
         * - Course tồn tại, giá 200
         * - PayOS trả về data + expiredAt != null
         * => Tạo payment thành công, body trả về checkoutUrl + expiresAt đúng
         */
        @Test
        @DisplayName("UTCID01 - Course payment success, PayOS trả link + expiredAt")
        void UTCID01_createCoursePayment_success() {
            mockPaymentSaveReturnArgument();

            Long userId = 3L;
            Long courseId = 10L;
            BigDecimal price = BigDecimal.valueOf(200);

            Course course = buildCourse(courseId, price, 99L);
            when(courseRepository.findById(courseId)).thenReturn(java.util.Optional.of(course));

            // Stub PayOS
            CheckoutResponseData data = mock(CheckoutResponseData.class);
            when(data.getCheckoutUrl()).thenReturn("https://payos/link");
            when(data.getQrCode()).thenReturn("https://payos/qr");
            when(data.getOrderCode()).thenReturn(1234L);
            when(data.getPaymentLinkId()).thenReturn("plink-1234");

            LocalDateTime expiredAt = LocalDateTime.of(2025, 1, 1, 10, 0);

            when(payOSService.createPaymentLink(
                    any(), any(), any(), any(), any(), anyString()
            ).data()).thenReturn(data);

            when(payOSService.createPaymentLink(
                    any(), any(), any(), any(), any(), anyString()
            ).expiredAt()).thenReturn(expiredAt);

            PaymentRequest request = buildCoursePaymentRequest(userId, courseId);

            ResponseEntity<?> response = paymentService.createPayment(request);

            assertEquals(200, response.getStatusCode().value());
            Map<?, ?> body = (Map<?, ?>) response.getBody();
            assertNotNull(body);
            assertEquals("https://payos/link", body.get("checkoutUrl"));
            assertEquals(expiredAt, body.get("expiresAt"));

            verify(paymentRepository, atLeastOnce()).save(any(Payment.class));
        }

        /**
         * UTCID02
         * - Course Payment
         * - Course không tồn tại
         * => AppException(COURSE_NOT_FOUND), không gọi PayOS
         */
        @Test
        @DisplayName("UTCID02 - Course payment, course không tồn tại -> AppException")
        void UTCID02_createCoursePayment_courseNotFound() {
            Long userId = 3L;
            Long courseId = 999L;

            when(courseRepository.findById(courseId)).thenReturn(java.util.Optional.empty());

            PaymentRequest request = buildCoursePaymentRequest(userId, courseId);

            assertThrows(AppException.class,
                    () -> paymentService.createPayment(request));

            verify(payOSService, never()).createPaymentLink(any(), any(),
                    any(), any(), any(), anyString());
        }

        /**
         * UTCID03
         * - Booking Payment
         * - BookingPlan không tồn tại
         * => AppException(BOOKING_NOT_FOUND)
         */
        @Test
        @DisplayName("UTCID03 - Booking payment, booking plan không tồn tại -> BOOKING_NOT_FOUND")
        void UTCID03_createBookingPayment_bookingPlanNotFound() {
            mockPaymentSaveReturnArgument();
            when(cloudflareTurnstileService.verify(anyString())).thenReturn(true);

            Long userId = 2L;
            Long planId = 100L;

            when(bookingPlanRepository.findById(planId)).thenReturn(java.util.Optional.empty());

            SlotRequest slot = buildSlot(
                    LocalDateTime.of(2025, 1, 1, 10, 0),
                    LocalDateTime.of(2025, 1, 1, 11, 0)
            );

            PaymentRequest request = buildBookingPaymentRequest(
                    userId, planId, List.of(slot), null, "token-xyz"
            );

            assertThrows(AppException.class,
                    () -> paymentService.createPayment(request));
        }

        /**
         * UTCID04
         * - Booking Payment
         * - slots = null
         * => AppException(BOOKING_SLOT_NOT_AVAILABLE)
         */
        @Test
        @DisplayName("UTCID04 - Booking payment, slots=null -> BOOKING_SLOT_NOT_AVAILABLE")
        void UTCID04_createBookingPayment_slotsNull_shouldThrow() {
            mockPaymentSaveReturnArgument();
            when(cloudflareTurnstileService.verify(anyString())).thenReturn(true);

            Long userId = 3L;
            Long planId = 20L;

            BookingPlan plan = buildBookingPlan(planId, 200L, 100);
            when(bookingPlanRepository.findById(planId)).thenReturn(java.util.Optional.of(plan));

            User user = buildUser(userId);
            when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));

            PaymentRequest request = buildBookingPaymentRequest(
                    userId, planId, null, null, "token-xyz"
            );

            assertThrows(AppException.class,
                    () -> paymentService.createPayment(request));
        }

        /**
         * UTCID05
         * - Booking Payment
         * - User không tồn tại
         * => AppException(USER_NOT_EXIST)
         */
        @Test
        @DisplayName("UTCID05 - Booking payment, user không tồn tại -> USER_NOT_EXIST")
        void UTCID05_createBookingPayment_userNotExist_shouldThrow() {
            mockPaymentSaveReturnArgument();
            when(cloudflareTurnstileService.verify(anyString())).thenReturn(true);

            Long userId = 100L;
            Long planId = 20L;

            BookingPlan plan = buildBookingPlan(planId, 200L, 100);
            when(bookingPlanRepository.findById(planId)).thenReturn(java.util.Optional.of(plan));

            when(userRepository.findById(userId)).thenReturn(java.util.Optional.empty());

            SlotRequest s = buildSlot(
                    LocalDateTime.of(2025, 1, 1, 10, 0),
                    LocalDateTime.of(2025, 1, 1, 11, 0)
            );

            PaymentRequest request = buildBookingPaymentRequest(
                    userId, planId, List.of(s), null, "token-xyz"
            );

            assertThrows(AppException.class,
                    () -> paymentService.createPayment(request));
        }

        /**
         * UTCID06 (Boundary)
         * - Booking Payment
         * - slots = [] (list rỗng)
         * => AppException(BOOKING_SLOT_NOT_AVAILABLE)
         */
        @Test
        @DisplayName("UTCID06 - Booking payment, slots=[] -> BOOKING_SLOT_NOT_AVAILABLE (Boundary)")
        void UTCID06_createBookingPayment_slotsEmpty_shouldThrow() {
            mockPaymentSaveReturnArgument();
            when(cloudflareTurnstileService.verify(anyString())).thenReturn(true);

            Long userId = 3L;
            Long planId = 20L;

            BookingPlan plan = buildBookingPlan(planId, 200L, 100);
            when(bookingPlanRepository.findById(planId)).thenReturn(java.util.Optional.of(plan));

            User user = buildUser(userId);
            when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));

            PaymentRequest request = buildBookingPaymentRequest(
                    userId, planId, List.of(), null, "token-xyz"
            );

            assertThrows(AppException.class,
                    () -> paymentService.createPayment(request));
        }

        /**
         * UTCID07
         * - Booking Payment
         * - Slot đã taken (existsByTutorIDAndStartTimeAndEndTime = true)
         * => AppException(BOOKING_SLOT_NOT_AVAILABLE)
         */
        @Test
        @DisplayName("UTCID07 - Booking payment, slot đã tồn tại (taken) -> BOOKING_SLOT_NOT_AVAILABLE")
        void UTCID07_createBookingPayment_slotTaken_shouldThrow() {
            mockPaymentSaveReturnArgument();
            when(cloudflareTurnstileService.verify(anyString())).thenReturn(true);

            Long userId = 3L;
            Long planId = 20L;

            BookingPlan plan = buildBookingPlan(planId, 200L, 100);
            when(bookingPlanRepository.findById(planId)).thenReturn(java.util.Optional.of(plan));

            User user = buildUser(userId);
            when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));

            LocalDateTime start = LocalDateTime.of(2025, 1, 1, 10, 0);
            LocalDateTime end = LocalDateTime.of(2025, 1, 1, 11, 0);

            SlotRequest s = buildSlot(start, end);

            when(bookingPlanSlotRepository.existsByTutorIDAndStartTimeAndEndTime(
                    plan.getTutorID(), start, end
            )).thenReturn(true);

            PaymentRequest request = buildBookingPaymentRequest(
                    userId, planId, List.of(s), null, "token-xyz"
            );

            assertThrows(AppException.class,
                    () -> paymentService.createPayment(request));
        }

        /**
         * UTCID08
         * - Booking Payment
         * - userPackage = null, 1 slot hợp lệ
         * - PayOS trả data + expiredAt != null
         * => Tạo payment Booking thành công, amount = pricePerHours * 1
         */
        @Test
        @DisplayName("UTCID08 - Booking payment, userPackage=null, 1 slot -> tạo payment OK")
        void UTCID08_createBookingPayment_singleSlot_success() {
            mockPaymentSaveReturnArgument();
            when(cloudflareTurnstileService.verify(anyString())).thenReturn(true);

            Long userId = 3L;
            Long planId = 20L;
            Long tutorId = 200L;
            double pricePerHour = 100.0;

            BookingPlan plan = buildBookingPlan(planId, tutorId, pricePerHour);
            when(bookingPlanRepository.findById(planId)).thenReturn(java.util.Optional.of(plan));

            User user = buildUser(userId);
            when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));

            LocalDateTime start = LocalDateTime.of(2025, 1, 1, 10, 0);
            LocalDateTime end = LocalDateTime.of(2025, 1, 1, 11, 0);
            SlotRequest s = buildSlot(start, end);

            when(bookingPlanSlotRepository.existsByTutorIDAndStartTimeAndEndTime(
                    tutorId, start, end
            )).thenReturn(false);

            CheckoutResponseData data = mock(CheckoutResponseData.class);
            when(data.getCheckoutUrl()).thenReturn("https://payos/link");
            when(data.getQrCode()).thenReturn("https://payos/qr");
            when(data.getOrderCode()).thenReturn(5678L);
            when(data.getPaymentLinkId()).thenReturn("plink-5678");

            LocalDateTime expiredAt = LocalDateTime.of(2025, 1, 1, 10, 0);

            when(payOSService.createPaymentLink(
                    any(), any(), any(), any(), any(), anyString()
            ).data()).thenReturn(data);

            when(payOSService.createPaymentLink(
                    any(), any(), any(), any(), any(), anyString()
            ).expiredAt()).thenReturn(expiredAt);

            PaymentRequest request = buildBookingPaymentRequest(
                    userId, planId, List.of(s), null, "token-xyz"
            );

            ResponseEntity<?> response = paymentService.createPayment(request);

            assertEquals(200, response.getStatusCode().value());
            Map<?, ?> body = (Map<?, ?>) response.getBody();
            assertNotNull(body);
            assertEquals("https://payos/link", body.get("checkoutUrl"));
            assertEquals(expiredAt, body.get("expiresAt"));

            ArgumentCaptor<Payment> cap = ArgumentCaptor.forClass(Payment.class);
            verify(paymentRepository, atLeastOnce()).save(cap.capture());
            Payment saved = cap.getValue();
            assertEquals(BigDecimal.valueOf(pricePerHour), saved.getAmount());
            assertEquals(PaymentType.Booking, saved.getPaymentType());
        }

        /**
         * UTCID09
         * - Booking Payment
         * - userPackageId (thực chất là tutorPackageId) tồn tại
         * => Tạo payment OK, slot gắn đúng tutorPackage và userPackage được tạo
         */
        @Test
        @DisplayName("UTCID09 - Booking payment, tutorPackage tồn tại -> tạo payment OK, slot có userPackage")
        void UTCID09_createBookingPayment_userPackageExists_success() {
            mockPaymentSaveReturnArgument();
            when(cloudflareTurnstileService.verify(anyString())).thenReturn(true);

            Long userId = 3L;
            Long planId = 20L;
            Long tutorId = 200L;
            double pricePerHour = 100.0;
            Long tutorPackageId = 1L;

            BookingPlan plan = buildBookingPlan(planId, tutorId, pricePerHour);
            when(bookingPlanRepository.findById(planId)).thenReturn(java.util.Optional.of(plan));

            User user = buildUser(userId);
            when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));

            TutorPackage tutorPackage = new TutorPackage();
// Không cần set ID, chỉ cần đúng reference object
            when(tutorPackageRepository.findById(tutorPackageId))
                    .thenReturn(java.util.Optional.of(tutorPackage));

            LocalDateTime start = LocalDateTime.of(2025, 1, 1, 10, 0);
            LocalDateTime end = LocalDateTime.of(2025, 1, 1, 11, 0);
            SlotRequest s = buildSlot(start, end);

            when(bookingPlanSlotRepository.existsByTutorIDAndStartTimeAndEndTime(
                    tutorId, start, end
            )).thenReturn(false);

            CheckoutResponseData data = mock(CheckoutResponseData.class);
            when(data.getCheckoutUrl()).thenReturn("https://payos/link");
            when(data.getQrCode()).thenReturn("https://payos/qr");
            when(data.getOrderCode()).thenReturn(9999L);
            when(data.getPaymentLinkId()).thenReturn("plink-9999");

            when(payOSService.createPaymentLink(
                    any(), any(), any(), any(), any(), anyString()
            ).data()).thenReturn(data);

            PaymentRequest request = buildBookingPaymentRequest(
                    userId, planId, List.of(s), tutorPackageId, "token-xyz"
            );

            ResponseEntity<?> response = paymentService.createPayment(request);

            assertEquals(200, response.getStatusCode().value());
            Map<?, ?> body = (Map<?, ?>) response.getBody();
            assertNotNull(body);
            assertEquals("https://payos/link", body.get("checkoutUrl"));

            // Capture UserPackage được save, sau đó xác nhận slot có set userPackage + tutorPackage
            ArgumentCaptor<UserPackage> userPackageCaptor = ArgumentCaptor.forClass(UserPackage.class);
            verify(userPackageRepository, atLeastOnce()).save(userPackageCaptor.capture());
            UserPackage savedUserPackage = userPackageCaptor.getValue();

            verify(bookingPlanSlotRepository, atLeastOnce()).save(argThat(slot ->
                    slot.getUserPackage() == savedUserPackage &&
                            slot.getTutorPackage() == tutorPackage
            ));
        }

        /**
         * UTCID10
         * - Booking Payment
         * - PayOS expiredAt = null -> service phải dùng payment.getExpiresAt()
         * => body.expiresAt = payment.expiresAt (không NullPointerException)
         */
        @Test
        @DisplayName("UTCID10 - PayOS expiredAt=null -> dùng expiresAt của Payment")
        void UTCID10_createBookingPayment_payOSExpiredNull_shouldUsePaymentExpiresAt() {
            mockPaymentSaveReturnArgument();
            when(cloudflareTurnstileService.verify(anyString())).thenReturn(true);

            Long userId = 3L;
            Long planId = 20L;
            Long tutorId = 200L;
            double pricePerHour = 100.0;

            BookingPlan plan = buildBookingPlan(planId, tutorId, pricePerHour);
            when(bookingPlanRepository.findById(planId)).thenReturn(java.util.Optional.of(plan));

            User user = buildUser(userId);
            when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));

            LocalDateTime start = LocalDateTime.now().plusDays(1);
            LocalDateTime end = start.plusHours(1);
            SlotRequest s = buildSlot(start, end);

            when(bookingPlanSlotRepository.existsByTutorIDAndStartTimeAndEndTime(
                    tutorId, start, end
            )).thenReturn(false);

            CheckoutResponseData data = mock(CheckoutResponseData.class);
            when(data.getCheckoutUrl()).thenReturn("https://payos/link-null-exp");
            when(data.getQrCode()).thenReturn("https://payos/qr-null-exp");
            when(data.getOrderCode()).thenReturn(1111L);
            when(data.getPaymentLinkId()).thenReturn("plink-1111");

            when(payOSService.createPaymentLink(
                    any(), any(), any(), any(), any(), anyString()
            ).data()).thenReturn(data);

            // expiredAt từ PayOS = null -> service phải fallback payment.getExpiresAt()
            when(payOSService.createPaymentLink(
                    any(), any(), any(), any(), any(), anyString()
            ).expiredAt()).thenReturn(null);

            PaymentRequest request = buildBookingPaymentRequest(
                    userId, planId, List.of(s), null, "token-xyz"
            );

            ResponseEntity<?> response = paymentService.createPayment(request);

            assertEquals(200, response.getStatusCode().value());
            Map<?, ?> body = (Map<?, ?>) response.getBody();
            assertNotNull(body);

            assertEquals("https://payos/link-null-exp", body.get("checkoutUrl"));

            // Lấy expiresAt thực tế từ payment đã save để so sánh
            ArgumentCaptor<Payment> cap = ArgumentCaptor.forClass(Payment.class);
            verify(paymentRepository, atLeastOnce()).save(cap.capture());
            Payment saved = cap.getValue();
            LocalDateTime expectedExpiresAt = saved.getExpiresAt();

            assertEquals(expectedExpiresAt, body.get("expiresAt"));
        }

        /**
         * UTCID11
         * - PaymentType = null
         * => AppException(INVALID_PAYMENT_TYPE)
         */
        @Test
        @DisplayName("UTCID11 - PaymentType=null -> INVALID_PAYMENT_TYPE")
        void UTCID11_createPayment_invalidPaymentType_shouldThrow() {
            PaymentRequest request = PaymentRequest.builder()
                    .userId(3L)
                    .targetId(10L)
                    .paymentType(null)
                    .build();

            assertThrows(AppException.class,
                    () -> paymentService.createPayment(request));
        }

        /**
         * UTCID12
         * - Booking Payment
         * - tutorPackageId (userPackageId field) không tồn tại
         * => AppException(TUTOR_PACKAGE_NOT_FOUND)
         */
        @Test
        @DisplayName("UTCID12 - Booking payment, tutorPackageId không tồn tại -> AppException")
        void UTCID12_createBookingPayment_userPackageNotFound_shouldThrow() {
            mockPaymentSaveReturnArgument();
            when(cloudflareTurnstileService.verify(anyString())).thenReturn(true);

            Long userId = 3L;
            Long planId = 20L;
            Long tutorId = 200L;
            double pricePerHour = 100.0;
            Long tutorPackageId = 999L;

            BookingPlan plan = buildBookingPlan(planId, tutorId, pricePerHour);
            when(bookingPlanRepository.findById(planId)).thenReturn(java.util.Optional.of(plan));

            User user = buildUser(userId);
            when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));

            when(tutorPackageRepository.findById(tutorPackageId))
                    .thenReturn(java.util.Optional.empty());

            SlotRequest s = buildSlot(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(1).plusHours(1)
            );

            PaymentRequest request = buildBookingPaymentRequest(
                    userId, planId, List.of(s), tutorPackageId, "token-xyz"
            );

            assertThrows(AppException.class,
                    () -> paymentService.createPayment(request));
        }

        /**
         * UTCID13
         * - Booking Payment
         * - cancelledCount + expiredCount >= 3 trong 1h
         * => AppException(BOOKING_PAYMENT_CANCEL_TOO_MANY_TIMES)
         */
        @Test
        @DisplayName("UTCID13 - Booking payment, cancel/expired >=3 lần trong 1h -> BOOKING_PAYMENT_CANCEL_TOO_MANY_TIMES")
        void UTCID13_createBookingPayment_cancelTooManyTimes_shouldThrow() {
            mockPaymentSaveReturnArgument();
            when(cloudflareTurnstileService.verify(anyString())).thenReturn(true);

            Long userId = 3L;
            Long planId = 20L;
            Long tutorId = 200L;
            double pricePerHour = 100.0;

            BookingPlan plan = buildBookingPlan(planId, tutorId, pricePerHour);
            when(bookingPlanRepository.findById(planId)).thenReturn(java.util.Optional.of(plan));

            User user = buildUser(userId);
            when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));

            // cancelledCount + expiredCount = 3
            when(paymentRepository.countByUserIdAndPaymentTypeAndTargetIdAndStatusAndCreatedAtAfter(
                    eq(userId), eq(PaymentType.Booking), eq(planId),
                    eq(PaymentStatus.CANCELLED), any(LocalDateTime.class)
            )).thenReturn(2L);

            when(paymentRepository.countByUserIdAndPaymentTypeAndTargetIdAndStatusAndCreatedAtAfter(
                    eq(userId), eq(PaymentType.Booking), eq(planId),
                    eq(PaymentStatus.EXPIRED), any(LocalDateTime.class)
            )).thenReturn(1L);

            SlotRequest s = buildSlot(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(1).plusHours(1)
            );

            PaymentRequest request = buildBookingPaymentRequest(
                    userId, planId, List.of(s), null, "token-xyz"
            );

            assertThrows(AppException.class,
                    () -> paymentService.createPayment(request));
        }

        /**
         * UTCID14
         * - Booking Payment
         * - 2 slots
         * => amount = pricePerHours * 2
         */
        @Test
        @DisplayName("UTCID14 - Booking payment, 2 slots -> tổng tiền = pricePerHours * 2")
        void UTCID14_createBookingPayment_twoSlots_totalAmountCorrect() {
            mockPaymentSaveReturnArgument();
            when(cloudflareTurnstileService.verify(anyString())).thenReturn(true);

            Long userId = 3L;
            Long planId = 20L;
            Long tutorId = 200L;
            double pricePerHour = 150.0;

            BookingPlan plan = buildBookingPlan(planId, tutorId, pricePerHour);
            when(bookingPlanRepository.findById(planId)).thenReturn(java.util.Optional.of(plan));

            User user = buildUser(userId);
            when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));

            LocalDateTime start1 = LocalDateTime.of(2025, 1, 1, 10, 0);
            LocalDateTime end1 = start1.plusHours(1);
            LocalDateTime start2 = LocalDateTime.of(2025, 1, 1, 11, 0);
            LocalDateTime end2 = start2.plusHours(1);

            SlotRequest s1 = buildSlot(start1, end1);
            SlotRequest s2 = buildSlot(start2, end2);

            when(bookingPlanSlotRepository.existsByTutorIDAndStartTimeAndEndTime(
                    tutorId, start1, end1
            )).thenReturn(false);
            when(bookingPlanSlotRepository.existsByTutorIDAndStartTimeAndEndTime(
                    tutorId, start2, end2
            )).thenReturn(false);

            CheckoutResponseData data = mock(CheckoutResponseData.class);
            when(data.getCheckoutUrl()).thenReturn("https://payos/link2");
            when(data.getQrCode()).thenReturn("https://payos/qr2");
            when(data.getOrderCode()).thenReturn(2222L);
            when(data.getPaymentLinkId()).thenReturn("plink-2222");

            when(payOSService.createPaymentLink(
                    any(), any(), any(), any(), any(), anyString()
            ).data()).thenReturn(data);

            PaymentRequest request = buildBookingPaymentRequest(
                    userId, planId, List.of(s1, s2), null, "token-xyz"
            );

            ResponseEntity<?> response = paymentService.createPayment(request);
            assertEquals(200, response.getStatusCode().value());

            ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
            verify(paymentRepository, atLeastOnce()).save(paymentCaptor.capture());
            Payment saved = paymentCaptor.getValue();

            assertEquals(BigDecimal.valueOf(pricePerHour * 2), saved.getAmount());
        }
    }

    // =====================================================================
    // processPostPayment
    // =====================================================================

    @Nested
    @DisplayName("PaymentService.processPostPayment")
    class ProcessPostPaymentTests {

        /**
         * Case: payment.status != PAID
         * => Không làm gì, không save, không tạo enrollment.
         */
        @Test
        @DisplayName("Status != PAID -> không làm gì")
        void processPostPayment_notPaid_doNothing() {
            Payment payment = Payment.builder()
                    .paymentID(1L)
                    .status(PaymentStatus.PENDING)
                    .build();

            paymentService.processPostPayment(payment);

            verify(paymentRepository, never()).save(any());
            verify(enrollmentRepository, never()).save(any());
        }

        /**
         * Case: Course Payment PAID
         * - Tạo Enrollment
         * - Snapshot commission (commissionRate, commissionAmount, netAmount)
         * - Cập nhật ví tutor bằng withdrawService.calculateCurrentBalance()
         */
        @Test
        @DisplayName("Course payment PAID -> tạo Enrollment + update ví tutor (dùng snapshot commission)")
        void processPostPayment_coursePaid_shouldCreateEnrollmentAndUpdateWallet() {
            Long userId = 3L;
            Long courseId = 10L;
            Long tutorId = 99L;

            Payment payment = Payment.builder()
                    .paymentID(1L)
                    .status(PaymentStatus.PAID)
                    .paymentType(PaymentType.Course)
                    .userId(userId)
                    .targetId(courseId)
                    .amount(BigDecimal.valueOf(200))
                    .build();

            Course course = buildCourse(courseId, BigDecimal.valueOf(200), tutorId);
            when(courseRepository.findById(courseId))
                    .thenReturn(java.util.Optional.of(course));

            User user = buildUser(userId);
            when(userRepository.findById(userId))
                    .thenReturn(java.util.Optional.of(user));

            // Setting commission
            Setting setting = new Setting();
            setting.setCommissionCourse(BigDecimal.valueOf(0.2));   // 20%
            setting.setCommissionBooking(BigDecimal.valueOf(0.1));
            when(settingRepository.getCurrentSetting()).thenReturn(setting);

            // Wallet balance sau khi tính (dùng netAmount)
            when(withdrawService.calculateCurrentBalance(tutorId))
                    .thenReturn(BigDecimal.valueOf(160));

            when(enrollmentRepository.save(any(Enrollment.class)))
                    .thenAnswer(inv -> (Enrollment) inv.getArgument(0));

            paymentService.processPostPayment(payment);

            assertTrue(payment.getIsPaid());
            assertNotNull(payment.getPaidAt());
            assertEquals(tutorId, payment.getTutorId());
            assertNotNull(payment.getEnrollment());
            assertEquals(BigDecimal.valueOf(0.2), payment.getCommissionRate());
            assertEquals(BigDecimal.valueOf(40.0), payment.getCommissionAmount());
            assertEquals(BigDecimal.valueOf(160.0), payment.getNetAmount());

            Tutor tutorInCourse = course.getTutor();
            assertEquals(BigDecimal.valueOf(160), tutorInCourse.getWalletBalance());

            verify(enrollmentRepository, times(1)).save(any(Enrollment.class));
            verify(tutorRepository, times(1)).save(any(Tutor.class));
        }

        /**
         * Case: Booking Payment PAID
         * - Đổi tất cả slot của payment -> Paid
         * - Gọi chatService.ensureTrainingRoomExists(userId, tutorId)
         * - Gửi notification cho learner và tutor
         * - Không cộng ví tutor ở đây
         */
        @Test
        @DisplayName("Booking payment PAID -> set slot Paid + tạo chat room, gửi notification, không update ví tutor")
        void processPostPayment_bookingPaid_shouldUpdateSlotsAndChatRoom() {
            Long userId = 3L;
            Long tutorId = 200L;

            Payment payment = Payment.builder()
                    .paymentID(1L)
                    .status(PaymentStatus.PAID)
                    .paymentType(PaymentType.Booking)
                    .userId(userId)
                    .amount(BigDecimal.valueOf(100))
                    .build();

            // Setting để tránh NPE trong applyCommissionSnapshot
            Setting setting = new Setting();
            setting.setCommissionCourse(BigDecimal.valueOf(0.2));
            setting.setCommissionBooking(BigDecimal.valueOf(0.1));
            when(settingRepository.getCurrentSetting()).thenReturn(setting);

            BookingPlanSlot slot1 = new BookingPlanSlot();
            slot1.setSlotID(10L);
            slot1.setStatus(SlotStatus.Locked);
            slot1.setTutorID(tutorId);
            // Cần startTime để format thông báo
            LocalDateTime start = LocalDateTime.of(2025, 1, 1, 10, 0);
            slot1.setStartTime(start);
            slot1.setEndTime(start.plusHours(1));

            when(bookingPlanSlotRepository.findAllByPaymentID(1L))
                    .thenReturn(List.of(slot1));

            Tutor tutor = buildTutor(tutorId, BigDecimal.ZERO);
            when(tutorRepository.findById(tutorId))
                    .thenReturn(java.util.Optional.of(tutor));

            paymentService.processPostPayment(payment);

            assertTrue(payment.getIsPaid());
            assertEquals(SlotStatus.Paid, slot1.getStatus());
            assertEquals(tutorId, payment.getTutorId());

            verify(bookingPlanSlotRepository, times(1)).save(slot1);
            verify(chatService, times(1))
                    .ensureTrainingRoomExists(userId, tutorId);
            verify(withdrawService, never()).calculateCurrentBalance(anyLong());
            verify(notificationService, atLeast(2))
                    .sendNotification(anyLong(), anyString(), anyString(), any(), anyString());
        }
    }

    // =====================================================================
    // handleUserCancelPayment
    // =====================================================================

    @Nested
    @DisplayName("PaymentService.handleUserCancelPayment")
    class HandleUserCancelPaymentTests {

        /**
         * Case: Payment không tồn tại
         * => AppException(PAYMENT_NOT_FOUND)
         */
        @Test
        @DisplayName("Payment không tồn tại -> AppException")
        void handleUserCancelPayment_notFound_shouldThrow() {
            when(paymentRepository.findById(1L))
                    .thenReturn(java.util.Optional.empty());

            assertThrows(AppException.class,
                    () -> paymentService.handleUserCancelPayment(1L));
        }

        /**
         * Case: Payment đã PAID
         * => Không đổi trạng thái, không rollback, chỉ log
         */
        @Test
        @DisplayName("Payment đã PAID -> không đổi trạng thái")
        void handleUserCancelPayment_alreadyPaid_shouldDoNothing() {
            Payment payment = Payment.builder()
                    .paymentID(1L)
                    .status(PaymentStatus.PAID)
                    .isPaid(true)
                    .build();

            when(paymentRepository.findById(1L))
                    .thenReturn(java.util.Optional.of(payment));

            Payment result = paymentService.handleUserCancelPayment(1L);

            assertEquals(PaymentStatus.PAID, result.getStatus());
            verify(paymentRepository, never()).save(any());
            verify(bookingPlanSlotRepository, never()).findAllByPaymentID(anyLong());
        }

        /**
         * Case: Payment đã CANCELLED từ trước
         * => Idempotent, trả về luôn, không save, không rollback
         */
        @Test
        @DisplayName("Payment đã CANCELLED từ trước -> idempotent")
        void handleUserCancelPayment_alreadyCancelled_shouldReturnDirectly() {
            Payment payment = Payment.builder()
                    .paymentID(1L)
                    .status(PaymentStatus.CANCELLED)
                    .build();

            when(paymentRepository.findById(1L))
                    .thenReturn(java.util.Optional.of(payment));

            Payment result = paymentService.handleUserCancelPayment(1L);

            assertEquals(PaymentStatus.CANCELLED, result.getStatus());
            verify(paymentRepository, never()).save(any());
            verify(bookingPlanSlotRepository, never()).findAllByPaymentID(anyLong());
        }

        /**
         * Case: Booking Payment đang PENDING
         * - Đổi status -> CANCELLED
         * - rollbackBookingSlots: xóa slot Locked, giữ slot Paid
         * - Hủy link PayOS nếu có paymentLinkId
         */
        @Test
        @DisplayName("Booking payment PENDING -> CANCELLED + rollback slots + cancel PayOS link")
        void handleUserCancelPayment_bookingPending_shouldCancelAndRollbackAndCancelPayOS() {
            Payment payment = Payment.builder()
                    .paymentID(1L)
                    .status(PaymentStatus.PENDING)
                    .paymentType(PaymentType.Booking)
                    .paymentLinkId("plink-123")
                    .build();

            when(paymentRepository.findById(1L))
                    .thenReturn(java.util.Optional.of(payment));

            BookingPlanSlot s1 = new BookingPlanSlot();
            s1.setSlotID(10L);
            s1.setStatus(SlotStatus.Locked);

            BookingPlanSlot s2 = new BookingPlanSlot();
            s2.setSlotID(11L);
            s2.setStatus(SlotStatus.Paid);

            when(bookingPlanSlotRepository.findAllByPaymentID(1L))
                    .thenReturn(List.of(s1, s2));

            Payment result = paymentService.handleUserCancelPayment(1L);

            assertEquals(PaymentStatus.CANCELLED, result.getStatus());
            assertFalse(result.getIsPaid());
            assertNull(result.getPaidAt());

            verify(bookingPlanSlotRepository, times(1)).delete(s1);
            verify(bookingPlanSlotRepository, never()).delete(s2);
            verify(payOSService, times(1)).cancelPaymentLink("plink-123");
        }
    }

    // =====================================================================
    // rollbackBookingSlots
    // =====================================================================

    @Nested
    @DisplayName("PaymentService.rollbackBookingSlots")
    class RollbackBookingSlotsTests {

        /**
         * Case: paymentType != Booking
         * => không làm gì
         */
        @Test
        @DisplayName("PaymentType != Booking -> không làm gì")
        void rollbackBookingSlots_notBooking_shouldDoNothing() {
            Payment payment = Payment.builder()
                    .paymentID(1L)
                    .paymentType(PaymentType.Course)
                    .build();

            paymentService.rollbackBookingSlots(payment, "TEST");

            verify(bookingPlanSlotRepository, never()).findAllByPaymentID(anyLong());
        }

        /**
         * Case: Booking Payment
         * - Xóa các slot Locked
         * - KHÔNG xóa slot Paid
         */
        @Test
        @DisplayName("Booking payment -> xóa các slot Locked, giữ slot Paid")
        void rollbackBookingSlots_booking_shouldDeleteLockedOnly() {
            Payment payment = Payment.builder()
                    .paymentID(1L)
                    .paymentType(PaymentType.Booking)
                    .build();

            BookingPlanSlot locked1 = new BookingPlanSlot();
            locked1.setSlotID(10L);
            locked1.setStatus(SlotStatus.Locked);

            BookingPlanSlot locked2 = new BookingPlanSlot();
            locked2.setSlotID(11L);
            locked2.setStatus(SlotStatus.Locked);

            BookingPlanSlot paidSlot = new BookingPlanSlot();
            paidSlot.setSlotID(12L);
            paidSlot.setStatus(SlotStatus.Paid);

            when(bookingPlanSlotRepository.findAllByPaymentID(1L))
                    .thenReturn(List.of(locked1, locked2, paidSlot));

            paymentService.rollbackBookingSlots(payment, "TEST");

            verify(bookingPlanSlotRepository, times(1)).delete(locked1);
            verify(bookingPlanSlotRepository, times(1)).delete(locked2);
            verify(bookingPlanSlotRepository, never()).delete(paidSlot);
        }
    }

    // =====================================================================
    // getPaymentsByTutor / getPaymentsByUser / getAllPayments
    // =====================================================================

    @Nested
    @DisplayName("PaymentService - getPaymentsByXXX")
    class GetPaymentsSimpleTests {

        /**
         * getPaymentsByTutor
         * - Gọi paymentRepository.findAllByTutorId
         * - Map sang PaymentResponse qua paymentMapper
         */
        @Test
        @DisplayName("getPaymentsByTutor -> gọi repo.findAllByTutorId và map")
        void getPaymentsByTutor_shouldReturnMapped() {
            Payment p = Payment.builder().paymentID(1L).build();
            when(paymentRepository.findAllByTutorId(99L))
                    .thenReturn(List.of(p));

            PaymentResponse resp = new PaymentResponse();
            when(paymentMapper.toPaymentResponse(p)).thenReturn(resp);

            List<PaymentResponse> result = paymentService.getPaymentsByTutor(99L);

            assertEquals(1, result.size());
            assertSame(resp, result.get(0));
        }

        /**
         * getPaymentsByUser
         * - Gọi paymentRepository.findAllByUserId
         * - Map sang PaymentResponse
         */
        @Test
        @DisplayName("getPaymentsByUser -> gọi repo.findAllByUserId và map")
        void getPaymentsByUser_shouldReturnMapped() {
            Payment p = Payment.builder().paymentID(1L).build();
            when(paymentRepository.findAllByUserId(3L))
                    .thenReturn(List.of(p));

            PaymentResponse resp = new PaymentResponse();
            when(paymentMapper.toPaymentResponse(p)).thenReturn(resp);

            List<PaymentResponse> result = paymentService.getPaymentsByUser(3L);

            assertEquals(1, result.size());
            assertSame(resp, result.get(0));
        }

        /**
         * getAllPayments
         * - Gọi paymentRepository.findAll
         * - Map sang PaymentResponse
         */
        @Test
        @DisplayName("getAllPayments -> gọi repo.findAll và map")
        void getAllPayments_shouldReturnMapped() {
            Payment p = Payment.builder().paymentID(1L).build();
            when(paymentRepository.findAll())
                    .thenReturn(List.of(p));

            PaymentResponse resp = new PaymentResponse();
            when(paymentMapper.toPaymentResponse(p)).thenReturn(resp);

            List<PaymentResponse> result = paymentService.getAllPayments();

            assertEquals(1, result.size());
            assertSame(resp, result.get(0));
        }
    }

    // =====================================================================
    // getPaymentsForMe
    // =====================================================================

    @Nested
    @DisplayName("PaymentService.getPaymentsForMe")
    class GetPaymentsForMeTests {

        /**
         * Case: roleClaim = "Tutor"
         * => Lấy tutor từ user, gọi getPaymentsByTutor
         */
        @Test
        @DisplayName("roleClaim = 'Tutor' -> dùng tutor flow")
        void getPaymentsForMe_tutor_shouldUseTutorFlow() {
            Long userId = 3L;

            User user = buildUser(userId);
            when(userRepository.findById(userId))
                    .thenReturn(java.util.Optional.of(user));

            Tutor tutor = buildTutor(99L, BigDecimal.ZERO);
            when(tutorRepository.findByUser_UserID(userId))
                    .thenReturn(java.util.Optional.of(tutor));

            Payment p = Payment.builder().paymentID(1L).build();
            when(paymentRepository.findAllByTutorId(99L))
                    .thenReturn(List.of(p));

            PaymentResponse resp = new PaymentResponse();
            when(paymentMapper.toPaymentResponse(p)).thenReturn(resp);

            List<PaymentResponse> result =
                    paymentService.getPaymentsForMe(userId, "Tutor");

            assertEquals(1, result.size());
            assertSame(resp, result.get(0));
        }

        /**
         * Case: roleClaim = "Learner"
         * => Gọi getPaymentsByUser
         */
        @Test
        @DisplayName("roleClaim = 'Learner' -> dùng learner flow")
        void getPaymentsForMe_learner_shouldUseUserFlow() {
            Long userId = 3L;

            User user = buildUser(userId);
            when(userRepository.findById(userId))
                    .thenReturn(java.util.Optional.of(user));

            Payment p = Payment.builder().paymentID(1L).build();
            when(paymentRepository.findAllByUserId(userId))
                    .thenReturn(List.of(p));

            PaymentResponse resp = new PaymentResponse();
            when(paymentMapper.toPaymentResponse(p)).thenReturn(resp);

            List<PaymentResponse> result =
                    paymentService.getPaymentsForMe(userId, "Learner");

            assertEquals(1, result.size());
            assertSame(resp, result.get(0));
        }

        /**
         * Case: roleClaim = "Admin"
         * => Gọi getAllPayments
         */
        @Test
        @DisplayName("roleClaim = 'Admin' -> dùng admin flow")
        void getPaymentsForMe_admin_shouldUseAdminFlow() {
            Long userId = 3L;

            User user = buildUser(userId);
            when(userRepository.findById(userId))
                    .thenReturn(java.util.Optional.of(user));

            Payment p = Payment.builder().paymentID(1L).build();
            when(paymentRepository.findAll())
                    .thenReturn(List.of(p));

            PaymentResponse resp = new PaymentResponse();
            when(paymentMapper.toPaymentResponse(p)).thenReturn(resp);

            List<PaymentResponse> result =
                    paymentService.getPaymentsForMe(userId, "Admin");

            assertEquals(1, result.size());
            assertSame(resp, result.get(0));
        }

        /**
         * Case: roleClaim override, ví dụ "tutor-upper"
         * => vẫn match "tutor" (do toLowerCase().contains("tutor"))
         */
        @Test
        @DisplayName("roleClaim override (ví dụ 'tutor-upper') -> vẫn nhận tutor flow")
        void getPaymentsForMe_withRoleClaim_shouldUseClaim() {
            Long userId = 3L;

            User user = buildUser(userId);
            when(userRepository.findById(userId))
                    .thenReturn(java.util.Optional.of(user));

            Tutor tutor = buildTutor(99L, BigDecimal.ZERO);
            when(tutorRepository.findByUser_UserID(userId))
                    .thenReturn(java.util.Optional.of(tutor));

            Payment p = Payment.builder().paymentID(1L).build();
            when(paymentRepository.findAllByTutorId(99L))
                    .thenReturn(List.of(p));

            PaymentResponse resp = new PaymentResponse();
            when(paymentMapper.toPaymentResponse(p)).thenReturn(resp);

            List<PaymentResponse> result =
                    paymentService.getPaymentsForMe(userId, "tutor-upper");

            assertEquals(1, result.size());
            assertSame(resp, result.get(0));
        }

        /**
         * Case: roleClaim = null và user.role = null
         * => UNAUTHORIZED
         */
        @Test
        @DisplayName("roleClaim null và user.role=null -> UNAUTHORIZED")
        void getPaymentsForMe_noRole_shouldThrowUnauthorized() {
            Long userId = 3L;
            User user = buildUser(userId);
            // user.role mặc định null

            when(userRepository.findById(userId))
                    .thenReturn(java.util.Optional.of(user));

            assertThrows(AppException.class,
                    () -> paymentService.getPaymentsForMe(userId, null));
        }

        /**
         * Case: roleClaim = "Staff" (không contains tutor/learner/admin)
         * => UNAUTHORIZED
         */
        @Test
        @DisplayName("roleClaim không hỗ trợ (vd: 'Staff') -> UNAUTHORIZED")
        void getPaymentsForMe_unknownRole_shouldThrowUnauthorized() {
            Long userId = 3L;
            User user = buildUser(userId);

            when(userRepository.findById(userId))
                    .thenReturn(java.util.Optional.of(user));

            assertThrows(AppException.class,
                    () -> paymentService.getPaymentsForMe(userId, "Staff"));
        }
    }
}
