package edu.lms.service;

import edu.lms.dto.request.TutorBookingPlanRequest;
import edu.lms.dto.response.*;
import edu.lms.entity.*;
import edu.lms.enums.*;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.AdditionalAnswers.returnsFirstArg;

@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class TutorBookingPlanServiceTest {

    @Mock NotificationService notificationService;
    @Mock BookingPlanRepository bookingPlanRepository;
    @Mock BookingPlanSlotRepository bookingPlanSlotRepository;
    @Mock TutorRepository tutorRepository;
    @Mock RefundRequestRepository refundRequestRepository;
    @Mock NotificationRepository notificationRepository;
    @Mock PaymentRepository paymentRepository;
    @Mock PayOSService payOSService;

    @InjectMocks
    TutorBookingPlanService tutorBookingPlanService;

    // ===========================
    // Helpers
    // ===========================

    private Tutor buildTutor(Long tutorId, Long userId, TutorStatus status) {
        User u = new User();
        u.setUserID(userId);
        u.setFullName("Tutor User " + userId);
        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setStatus(status);
        t.setUser(u);
        return t;
    }

    private BookingPlan buildPlan(Long planId, Long tutorId, String title,
                                  LocalTime start, LocalTime end, Integer slotDuration,
                                  Double pricePerHour, String meetingUrl) {
        BookingPlan plan = new BookingPlan();
        plan.setBookingPlanID(planId);
        plan.setTutorID(tutorId);
        plan.setTitle(title);
        plan.setStartHours(start);
        plan.setEndHours(end);
        plan.setSlotDuration(slotDuration);
        plan.setPricePerHours(pricePerHour);
        plan.setMeetingUrl(meetingUrl);
        plan.setIsActive(true);
        plan.setIsOpen(true);
        plan.setCreatedAt(LocalDateTime.now().minusDays(1));
        plan.setUpdatedAt(LocalDateTime.now());
        return plan;
    }

    private BookingPlanSlot buildSlot(Long slotId, Long planId, Long tutorId, Long userId,
                                      LocalDateTime start, LocalDateTime end, SlotStatus status,
                                      Long paymentId) {
        BookingPlanSlot slot = new BookingPlanSlot();
        slot.setSlotID(slotId);
        slot.setBookingPlanID(planId);
        slot.setTutorID(tutorId);
        slot.setUserID(userId);
        slot.setStartTime(start);
        slot.setEndTime(end);
        slot.setStatus(status);
        slot.setPaymentID(paymentId);
        return slot;
    }

    private Payment buildPayment(Long paymentId, String linkId, PaymentStatus status) {
        Payment p = new Payment();
        p.setPaymentID(paymentId);
        p.setPaymentLinkId(linkId);
        p.setStatus(status);
        p.setIsPaid(true);
        p.setPaidAt(LocalDateTime.now());
        p.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        return p;
    }

    @BeforeEach
    void setupCommonStubs() {
        // Giả lập DB tự gán ID cho BookingPlan khi save (fix lỗi bookingPlanId = null trong test)
        lenient().when(bookingPlanRepository.save(any(BookingPlan.class)))
                .thenAnswer(invocation -> {
                    BookingPlan plan = invocation.getArgument(0);
                    if (plan.getBookingPlanID() == null) {
                        plan.setBookingPlanID(10L); // ID giả lập
                    }
                    return plan;
                });

        // Payment giữ behaviour "trả lại entity" để dễ assert
        lenient().when(paymentRepository.save(any(Payment.class)))
                .then(returnsFirstArg());
    }

    // =========================================================
    // CREATE BOOKING PLAN
    // =========================================================
    @Nested
    @DisplayName("createBookingPlan")
    class CreateBookingPlanTests {

        /**
         * NOTE CASE:
         * - User không có Tutor profile
         * - Kỳ vọng: TUTOR_NOT_FOUND
         * - Tương ứng các case "Tutor does not exist in database"
         */
        @Test
        @DisplayName("User không phải tutor -> TUTOR_NOT_FOUND")
        void createBookingPlan_tutorNotFound() {
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.empty());

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Monday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(10, 0))
                    .slotDuration(30)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.createBookingPlan(100L, req)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - Tutor status = SUSPENDED
         * - Kỳ vọng: TUTOR_ACCOUNT_LOCKED
         * - Bao phủ: case status Suspended
         */
        @Test
        @DisplayName("Tutor SUSPENDED -> TUTOR_ACCOUNT_LOCKED")
        void createBookingPlan_tutorSuspended() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.SUSPENDED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Monday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(10, 0))
                    .slotDuration(30)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.createBookingPlan(100L, req)
            );
            assertEquals(ErrorCode.TUTOR_ACCOUNT_LOCKED, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - Tutor status = PENDING
         * - Kỳ vọng: TUTOR_NOT_APPROVED
         */
        @Test
        @DisplayName("Tutor PENDING -> TUTOR_NOT_APPROVED")
        void createBookingPlan_tutorPending() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.PENDING);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Monday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(10, 0))
                    .slotDuration(30)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.createBookingPlan(100L, req)
            );
            assertEquals(ErrorCode.TUTOR_NOT_APPROVED, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - startTime >= endTime
         * - Kỳ vọng: INVALID_KEY
         * - Bao phủ group INVALID_KEY (thời gian không hợp lệ)
         */
        @Test
        @DisplayName("StartTime >= EndTime -> INVALID_KEY")
        void createBookingPlan_invalidTimeRange() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Monday")
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(9, 0))
                    .slotDuration(30)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.createBookingPlan(100L, req)
            );
            assertEquals(ErrorCode.INVALID_KEY, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - totalMinutes < slotDuration
         * - Kỳ vọng: INVALID_KEY
         */
        @Test
        @DisplayName("TotalMinutes < slotDuration -> INVALID_KEY")
        void createBookingPlan_durationTooLarge() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Monday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(9, 30))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.createBookingPlan(100L, req)
            );
            assertEquals(ErrorCode.INVALID_KEY, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - countDistinctDaysByTutorID >= 4
         * - title mới chưa tồn tại
         * - Kỳ vọng: BOOKING_PLAN_MAX_DAYS_EXCEEDED
         */
        @Test
        @DisplayName("Tutor đã có 4 ngày khác nhau + title mới -> BOOKING_PLAN_MAX_DAYS_EXCEEDED")
        void createBookingPlan_maxDaysExceeded() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            when(bookingPlanRepository.countDistinctDaysByTutorID(1L))
                    .thenReturn(4L);
            when(bookingPlanRepository.findByTutorIDAndTitle(1L, "Monday"))
                    .thenReturn(List.of());

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Monday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(11, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.createBookingPlan(100L, req)
            );
            assertEquals(ErrorCode.BOOKING_PLAN_MAX_DAYS_EXCEEDED, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - findOverlappingPlans != empty
         * - Kỳ vọng: BOOKING_TIME_CONFLICT
         */
        @Test
        @DisplayName("Overlapping plan -> BOOKING_TIME_CONFLICT")
        void createBookingPlan_overlapping() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            when(bookingPlanRepository.countDistinctDaysByTutorID(1L))
                    .thenReturn(2L);
            when(bookingPlanRepository.findByTutorIDAndTitle(1L, "Monday"))
                    .thenReturn(List.of());

            when(bookingPlanRepository.findOverlappingPlans(
                    eq(1L),
                    eq("Monday"),
                    any(LocalTime.class),
                    any(LocalTime.class),
                    isNull()
            )).thenReturn(List.of(new BookingPlan()));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Monday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(11, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.createBookingPlan(100L, req)
            );
            assertEquals(ErrorCode.BOOKING_TIME_CONFLICT, ex.getErrorcode());
        }

        /**
         * NOTE CASE (Happy path):
         * - Tutor APPROVED
         * - Thời gian hợp lệ
         * - currentDaysCount < 4 hoặc title đã tồn tại
         * - Không overlap
         * - meetingUrl = "   " -> normalize về null
         * - slotsCreated = totalMinutes / slotDuration
         */
        @Test
        @DisplayName("Happy path – create success, normalize meetingUrl, slotsCreated")
        void createBookingPlan_success() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            when(bookingPlanRepository.countDistinctDaysByTutorID(1L))
                    .thenReturn(2L);
            when(bookingPlanRepository.findByTutorIDAndTitle(1L, "Monday"))
                    .thenReturn(List.of());
            when(bookingPlanRepository.findOverlappingPlans(
                    eq(1L), eq("Monday"),
                    any(LocalTime.class), any(LocalTime.class),
                    isNull()
            )).thenReturn(List.of());

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Monday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(11, 0)) // 2h -> 120 phút
                    .slotDuration(30)             // -> 4 slots
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("   ")            // sẽ thành null
                    .build();

            BookingPlanCreateResponse res =
                    tutorBookingPlanService.createBookingPlan(100L, req);

            assertTrue(res.getSuccess());
            assertNotNull(res.getBookingPlanId());
            assertEquals(4, res.getSlotsCreated());

            verify(bookingPlanRepository).save(argThat(plan ->
                    plan.getMeetingUrl() == null &&
                            plan.getTutorID().equals(1L) &&
                            plan.getTitle().equals("Monday")
            ));
        }
    }

    // =========================================================
    // UPDATE BOOKING PLAN
    // =========================================================
    @Nested
    @DisplayName("updateBookingPlan")
    class UpdateBookingPlanTests {

        /**
         * NOTE CASE:
         * - User không có Tutor
         * - TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("User không phải tutor -> TUTOR_NOT_FOUND")
        void updateBookingPlan_tutorNotFound() {
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.empty());

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Friday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(20, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.updateBookingPlan(100L, 10L, req)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - Tutor SUSPENDED
         * - TUTOR_ACCOUNT_LOCKED
         */
        @Test
        @DisplayName("Tutor SUSPENDED -> TUTOR_ACCOUNT_LOCKED")
        void updateBookingPlan_tutorSuspended() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.SUSPENDED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Friday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(20, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.updateBookingPlan(100L, 10L, req)
            );
            assertEquals(ErrorCode.TUTOR_ACCOUNT_LOCKED, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - Tutor PENDING
         * - TUTOR_NOT_APPROVED
         */
        @Test
        @DisplayName("Tutor PENDING -> TUTOR_NOT_APPROVED")
        void updateBookingPlan_tutorPending() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.PENDING);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Friday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(20, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.updateBookingPlan(100L, 10L, req)
            );
            assertEquals(ErrorCode.TUTOR_NOT_APPROVED, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - plan không tồn tại
         * - BOOKING_PLAN_NOT_FOUND
         */
        @Test
        @DisplayName("BookingPlan không tồn tại -> BOOKING_PLAN_NOT_FOUND")
        void updateBookingPlan_planNotFound() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));
            when(bookingPlanRepository.findById(10L))
                    .thenReturn(Optional.empty());

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Friday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(20, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.updateBookingPlan(100L, 10L, req)
            );
            assertEquals(ErrorCode.BOOKING_PLAN_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - plan tồn tại nhưng tutorId không khớp -> không phải owner
         * - UNAUTHORIZED
         */
        @Test
        @DisplayName("Tutor không phải owner plan -> UNAUTHORIZED")
        void updateBookingPlan_notOwner() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan plan = buildPlan(10L, 999L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "https://zoom.com");
            when(bookingPlanRepository.findById(10L))
                    .thenReturn(Optional.of(plan));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Friday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(20, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.updateBookingPlan(100L, 10L, req)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - request có startTime >= endTime
         * - INVALID_KEY
         */
        @Test
        @DisplayName("Invalid time range -> INVALID_KEY")
        void updateBookingPlan_invalidTimeRange() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan plan = buildPlan(10L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "https://zoom.com");
            when(bookingPlanRepository.findById(10L))
                    .thenReturn(Optional.of(plan));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Friday")
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(9, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.updateBookingPlan(100L, 10L, req)
            );
            assertEquals(ErrorCode.INVALID_KEY, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - Đổi sang title mới (ngày mới)
         * - tutor đã có 4 "ngày khác nhau"
         * - old title không unique
         * - Kỳ vọng: BOOKING_PLAN_MAX_DAYS_EXCEEDED
         */
        @Test
        @DisplayName("Đổi sang ngày mới + đã có 4 days + oldTitle not unique -> BOOKING_PLAN_MAX_DAYS_EXCEEDED")
        void updateBookingPlan_maxDaysExceeded_whenChangeDay() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan plan = buildPlan(10L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "https://zoom.com");
            when(bookingPlanRepository.findById(10L))
                    .thenReturn(Optional.of(plan));

            when(bookingPlanRepository.countDistinctDaysByTutorID(1L))
                    .thenReturn(4L);

            when(bookingPlanRepository.findByTutorIDAndTitle(1L, "Monday"))
                    .thenReturn(List.of());

            BookingPlan p1 = buildPlan(10L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "url");
            BookingPlan p2 = buildPlan(11L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "url");
            p1.setIsActive(true);
            p2.setIsActive(true);
            when(bookingPlanRepository.findByTutorIDAndTitle(1L, "Friday"))
                    .thenReturn(List.of(p1, p2));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Monday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(20, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.updateBookingPlan(100L, 10L, req)
            );
            assertEquals(ErrorCode.BOOKING_PLAN_MAX_DAYS_EXCEEDED, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - findOverlappingPlans khi update != empty
         * - BOOKING_TIME_CONFLICT
         */
        @Test
        @DisplayName("Overlapping plan khi update -> BOOKING_TIME_CONFLICT")
        void updateBookingPlan_overlapping() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan plan = buildPlan(10L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "https://zoom.com");
            when(bookingPlanRepository.findById(10L))
                    .thenReturn(Optional.of(plan));

            when(bookingPlanRepository.findOverlappingPlans(
                    eq(1L), eq("Friday"),
                    any(LocalTime.class), any(LocalTime.class),
                    eq(10L)
            )).thenReturn(List.of(new BookingPlan()));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Friday")
                    .startTime(LocalTime.of(8, 0))
                    .endTime(LocalTime.of(12, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.updateBookingPlan(100L, 10L, req)
            );
            assertEquals(ErrorCode.BOOKING_TIME_CONFLICT, ex.getErrorcode());
        }

        /**
         * NOTE CASE (Boundary):
         * - Không đổi title/start/end/slotDuration → hasTimeFieldsChanged = false
         * - Chỉ đổi pricePerHours, meetingUrl
         * - updatedSlots = 0
         */
        @Test
        @DisplayName("Không thay đổi time/title -> updatedSlots = 0")
        void updateBookingPlan_noTimeChange() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan plan = buildPlan(10L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "https://zoom.com");
            when(bookingPlanRepository.findById(10L))
                    .thenReturn(Optional.of(plan));

            when(bookingPlanRepository.findOverlappingPlans(
                    eq(1L), eq("Friday"),
                    any(LocalTime.class), any(LocalTime.class),
                    eq(10L)
            )).thenReturn(List.of());

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Friday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(20, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(150_000)) // chỉ đổi giá
                    .meetingUrl("") // normalize về null
                    .build();

            BookingPlanUpdateResponse res =
                    tutorBookingPlanService.updateBookingPlan(100L, 10L, req);

            assertTrue(res.getSuccess());
            assertEquals(0, res.getUpdatedSlots());

            verify(bookingPlanRepository).save(argThat(p ->
                    p.getMeetingUrl() == null &&
                            p.getPricePerHours().equals(150_000d)
            ));
            verify(bookingPlanSlotRepository, never())
                    .findByBookingPlanIDOrderByStartTimeAsc(anyLong());
        }

        /**
         * NOTE CASE:
         * - Thay đổi thời gian → có slot Locked + learner + payment
         * - Slot nằm ngoài khoảng thời gian mới (out-of-new-time)
         * - Kỳ vọng:
         *   + payOSService.cancelPaymentLink được gọi
         *   + Payment được cập nhật (status CANCELLED)
         *   + Gửi notification TUTOR_CANCEL_BOOKING cho learner + tutor
         */
        @Test
        @DisplayName("Update time: slot Locked + payment -> cancel payment, notify learner+tutor")
        void updateBookingPlan_timeChange_withLockedSlot() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan plan = buildPlan(10L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "url");
            when(bookingPlanRepository.findById(10L))
                    .thenReturn(Optional.of(plan));

            when(bookingPlanRepository.findOverlappingPlans(
                    eq(1L), eq("Friday"),
                    any(LocalTime.class), any(LocalTime.class),
                    eq(10L)
            )).thenReturn(List.of());

            LocalDateTime slotStart = LocalDateTime.now().withHour(19).withMinute(0);
            LocalDateTime slotEnd = slotStart.plusHours(1);
            BookingPlanSlot slotLocked = buildSlot(
                    100L, 10L, 1L, 999L,
                    slotStart, slotEnd,
                    SlotStatus.Locked,
                    500L
            );
            BookingPlanSlot slotInRange = buildSlot(
                    101L, 10L, 1L, null,
                    LocalDateTime.now().withHour(10).withMinute(0),
                    LocalDateTime.now().withHour(11).withMinute(0),
                    SlotStatus.Available,
                    null
            );

            when(bookingPlanSlotRepository.findByBookingPlanIDOrderByStartTimeAsc(10L))
                    .thenReturn(List.of(slotInRange, slotLocked));

            when(tutorRepository.findById(1L)).thenReturn(Optional.of(tutor));

            Payment payment = buildPayment(500L, "PAYLINK-123", PaymentStatus.PAID);
            when(paymentRepository.findById(500L)).thenReturn(Optional.of(payment));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Friday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(18, 0)) // thu hẹp -> slot 19-20 out-of-new-time
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            BookingPlanUpdateResponse res =
                    tutorBookingPlanService.updateBookingPlan(100L, 10L, req);

            assertTrue(res.getSuccess());
            assertTrue(res.getUpdatedSlots() > 0);

            verify(payOSService).cancelPaymentLink("PAYLINK-123");
            verify(paymentRepository).save(any(Payment.class));

            verify(notificationService, atLeastOnce()).sendNotification(
                    eq(999L),
                    contains("Lịch học đã thay đổi"),
                    anyString(),
                    eq(NotificationType.TUTOR_CANCEL_BOOKING),
                    anyString()
            );
            verify(notificationService, atLeastOnce()).sendNotification(
                    eq(tutor.getUser().getUserID()),
                    contains("Lịch học có learner đang thanh toán bị ảnh hưởng"),
                    anyString(),
                    eq(NotificationType.TUTOR_CANCEL_BOOKING),
                    anyString()
            );
        }

        /**
         * NOTE CASE:
         * - slot Paid + learner, out-of-new-time
         * - Kỳ vọng:
         *   + tạo RefundRequest (RefundStatus.PENDING)
         *   + slot set status = Rejected
         *   + notify REFUND_AVAILABLE cho learner + tutor
         */
        @Test
        @DisplayName("Update time: slot Paid -> tạo refund, slot Rejected, notify REFUND_AVAILABLE")
        void updateBookingPlan_timeChange_withPaidSlot() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan plan = buildPlan(10L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "url");
            when(bookingPlanRepository.findById(10L))
                    .thenReturn(Optional.of(plan));

            when(bookingPlanRepository.findOverlappingPlans(
                    eq(1L), eq("Friday"),
                    any(LocalTime.class), any(LocalTime.class),
                    eq(10L)
            )).thenReturn(List.of());

            LocalDateTime slotStart = LocalDateTime.now().withHour(19).withMinute(0);
            LocalDateTime slotEnd = slotStart.plusHours(1);
            BookingPlanSlot slotPaid = buildSlot(
                    100L, 10L, 1L, 999L,
                    slotStart, slotEnd,
                    SlotStatus.Paid,
                    null
            );
            when(bookingPlanSlotRepository.findByBookingPlanIDOrderByStartTimeAsc(10L))
                    .thenReturn(List.of(slotPaid));

            when(tutorRepository.findById(1L)).thenReturn(Optional.of(tutor));

            TutorBookingPlanRequest req = TutorBookingPlanRequest.builder()
                    .title("Friday")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(18, 0))
                    .slotDuration(60)
                    .pricePerHours(BigDecimal.valueOf(100_000))
                    .meetingUrl("https://zoom.com")
                    .build();

            BookingPlanUpdateResponse res =
                    tutorBookingPlanService.updateBookingPlan(100L, 10L, req);

            assertTrue(res.getSuccess());
            assertTrue(res.getUpdatedSlots() > 0);

            assertEquals(SlotStatus.Rejected, slotPaid.getStatus());
            verify(refundRequestRepository).save(any(RefundRequest.class));

            verify(notificationService, atLeastOnce()).sendNotification(
                    eq(999L),
                    contains("Yêu cầu hoàn tiền"),
                    anyString(),
                    eq(NotificationType.REFUND_AVAILABLE),
                    anyString()
            );
            verify(notificationService, atLeastOnce()).sendNotification(
                    eq(tutor.getUser().getUserID()),
                    contains("Yêu cầu hoàn tiền"),
                    anyString(),
                    eq(NotificationType.REFUND_AVAILABLE),
                    anyString()
            );
        }
    }

    // =========================================================
    // deleteAllBookingPlansForTutor
    // =========================================================
    @Nested
    @DisplayName("deleteAllBookingPlansForTutor")
    class DeleteAllBookingPlansForTutorTests {

        /**
         * NOTE CASE:
         * - Tutor có thể tồn tại nhưng không có bookingPlan
         * - findByTutorID trả List empty
         * - Kỳ vọng: không xóa slot, không notify
         */
        @Test
        @DisplayName("Tutor không có booking plan -> không làm gì thêm")
        void deleteAllBookingPlans_noPlans() {
            when(bookingPlanRepository.findByTutorID(10L))
                    .thenReturn(List.of());

            tutorBookingPlanService.deleteAllBookingPlansForTutor(10L);

            verify(bookingPlanSlotRepository, never()).findByBookingPlanIDOrderByStartTimeAsc(anyLong());
            verify(bookingPlanRepository, never()).delete(any(BookingPlan.class));
        }

        /**
         * NOTE CASE:
         * - Có bookingPlan nhưng tất cả slot không có learner
         * - Slot status Available, userID = null
         * - Kỳ vọng: delete slot + delete plan, không notify/refund
         */
        @Test
        @DisplayName("Slots không có learner -> chỉ delete slot + plan")
        void deleteAllBookingPlans_slotsWithoutLearner() {
            BookingPlan plan = buildPlan(1L, 10L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "url");

            when(bookingPlanRepository.findByTutorID(10L))
                    .thenReturn(List.of(plan));

            BookingPlanSlot s1 = buildSlot(
                    100L, 1L, 10L, null,
                    LocalDateTime.now(), LocalDateTime.now().plusHours(1),
                    SlotStatus.Available, null
            );
            BookingPlanSlot s2 = buildSlot(
                    101L, 1L, 10L, null,
                    LocalDateTime.now().plusHours(1), LocalDateTime.now().plusHours(2),
                    SlotStatus.Available, null
            );

            when(bookingPlanSlotRepository.findByBookingPlanIDOrderByStartTimeAsc(1L))
                    .thenReturn(List.of(s1, s2));

            tutorBookingPlanService.deleteAllBookingPlansForTutor(10L);

            verify(bookingPlanSlotRepository, times(2)).delete(any(BookingPlanSlot.class));
            verify(bookingPlanRepository).delete(plan);
        }

        /**
         * NOTE CASE:
         * - Slot Paid + learner
         * - Kỳ vọng:
         *   + Tạo RefundRequest
         *   + Notify learner REFUND_AVAILABLE
         *   + Xóa slot + plan
         */
        @Test
        @DisplayName("Slot Paid + learner -> tạo refund, notify learner")
        void deleteAllBookingPlans_paidSlotWithLearner() {
            BookingPlan plan = buildPlan(1L, 10L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "url");

            when(bookingPlanRepository.findByTutorID(10L))
                    .thenReturn(List.of(plan));

            BookingPlanSlot paidSlot = buildSlot(
                    100L, 1L, 10L, 999L,
                    LocalDateTime.now(), LocalDateTime.now().plusHours(1),
                    SlotStatus.Paid, null
            );

            when(bookingPlanSlotRepository.findByBookingPlanIDOrderByStartTimeAsc(1L))
                    .thenReturn(List.of(paidSlot));

            tutorBookingPlanService.deleteAllBookingPlansForTutor(10L);

            verify(refundRequestRepository).save(any(RefundRequest.class));
            verify(notificationService).sendNotification(
                    eq(999L),
                    contains("Yêu cầu hoàn tiền"),
                    anyString(),
                    eq(NotificationType.REFUND_AVAILABLE),
                    anyString()
            );
            verify(bookingPlanSlotRepository).delete(paidSlot);
            verify(bookingPlanRepository).delete(plan);
        }

        /**
         * NOTE CASE:
         * - Slot Available + learner
         * - Kỳ vọng:
         *   + Notify learner TUTOR_CANCEL_BOOKING
         *   + Xóa slot + plan
         */
        @Test
        @DisplayName("Slot Available + learner -> notify learner, delete slot")
        void deleteAllBookingPlans_availableSlotWithLearner() {
            BookingPlan plan = buildPlan(1L, 10L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "url");

            when(bookingPlanRepository.findByTutorID(10L))
                    .thenReturn(List.of(plan));

            BookingPlanSlot slot = buildSlot(
                    100L, 1L, 10L, 999L,
                    LocalDateTime.now(), LocalDateTime.now().plusHours(1),
                    SlotStatus.Available, null
            );

            when(bookingPlanSlotRepository.findByBookingPlanIDOrderByStartTimeAsc(1L))
                    .thenReturn(List.of(slot));

            tutorBookingPlanService.deleteAllBookingPlansForTutor(10L);

            verify(notificationService).sendNotification(
                    eq(999L),
                    contains("Lịch học đã bị hủy"),
                    anyString(),
                    eq(NotificationType.TUTOR_CANCEL_BOOKING),
                    anyString()
            );
            verify(bookingPlanSlotRepository).delete(slot);
            verify(bookingPlanRepository).delete(plan);
        }
    }

    // =========================================================
    // deleteBookingPlan
    // =========================================================
    @Nested
    @DisplayName("deleteBookingPlan")
    class DeleteBookingPlanTests {

        /**
         * NOTE CASE:
         * - User không có tutor
         * - TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Delete booking plan: tutor not found -> TUTOR_NOT_FOUND")
        void deleteBookingPlan_tutorNotFound() {
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.deleteBookingPlan(100L, 1L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - Plan không tồn tại
         * - BOOKING_PLAN_NOT_FOUND
         */
        @Test
        @DisplayName("Delete booking plan: plan not found -> BOOKING_PLAN_NOT_FOUND")
        void deleteBookingPlan_planNotFound() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));
            when(bookingPlanRepository.findById(1L))
                    .thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.deleteBookingPlan(100L, 1L)
            );
            assertEquals(ErrorCode.BOOKING_PLAN_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - Plan tồn tại nhưng tutorId không khớp (not owner)
         * - UNAUTHORIZED
         */
        @Test
        @DisplayName("Delete booking plan: tutor not owner -> UNAUTHORIZED")
        void deleteBookingPlan_notOwner() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan plan = buildPlan(1L, 999L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "url");
            when(bookingPlanRepository.findById(1L))
                    .thenReturn(Optional.of(plan));

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.deleteBookingPlan(100L, 1L)
            );
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - Slot Locked + learner + payment
         * - Kỳ vọng:
         *   + cancelPaymentLink
         *   + update Payment -> CANCELLED
         *   + notify learner & tutor (TUTOR_CANCEL_BOOKING)
         *   + delete slot & plan
         */
        @Test
        @DisplayName("Delete booking plan: slot Locked + payment -> cancel payment, notify")
        void deleteBookingPlan_lockedSlotWithPayment() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan plan = buildPlan(1L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "url");
            when(bookingPlanRepository.findById(1L))
                    .thenReturn(Optional.of(plan));

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10);
            LocalDateTime end = start.plusHours(1);
            BookingPlanSlot lockedSlot = buildSlot(
                    100L, 1L, 1L, 999L,
                    start, end,
                    SlotStatus.Locked,
                    500L
            );

            when(bookingPlanSlotRepository.findByBookingPlanIDOrderByStartTimeAsc(1L))
                    .thenReturn(List.of(lockedSlot));

            Payment payment = buildPayment(500L, "LINK-500", PaymentStatus.PAID);
            when(paymentRepository.findById(500L)).thenReturn(Optional.of(payment));

            OperationStatusResponse res =
                    tutorBookingPlanService.deleteBookingPlan(100L, 1L);

            assertNotNull(res);
            assertTrue(res.getSuccess());

            verify(payOSService).cancelPaymentLink("LINK-500");
            verify(paymentRepository).save(any(Payment.class));
            verify(notificationService, atLeastOnce()).sendNotification(
                    eq(999L),
                    contains("Lịch học đã bị hủy"),
                    anyString(),
                    eq(NotificationType.TUTOR_CANCEL_BOOKING),
                    anyString()
            );
            verify(notificationService, atLeastOnce()).sendNotification(
                    eq(tutor.getUser().getUserID()),
                    contains("Đã xóa slot có learner đang thanh toán"),
                    anyString(),
                    eq(NotificationType.TUTOR_CANCEL_BOOKING),
                    anyString()
            );

            verify(bookingPlanSlotRepository).delete(lockedSlot);
            verify(bookingPlanRepository).delete(plan);
        }

        /**
         * NOTE CASE:
         * - Slot Paid + learner
         * - Kỳ vọng:
         *   + tạo RefundRequest
         *   + notify REFUND_AVAILABLE (learner + tutor)
         */
        @Test
        @DisplayName("Delete booking plan: slot Paid -> refund + notify REFUND_AVAILABLE")
        void deleteBookingPlan_paidSlot() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan plan = buildPlan(1L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "url");
            when(bookingPlanRepository.findById(1L))
                    .thenReturn(Optional.of(plan));

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10);
            LocalDateTime end = start.plusHours(1);
            BookingPlanSlot paidSlot = buildSlot(
                    100L, 1L, 1L, 999L,
                    start, end,
                    SlotStatus.Paid,
                    null
            );

            when(bookingPlanSlotRepository.findByBookingPlanIDOrderByStartTimeAsc(1L))
                    .thenReturn(List.of(paidSlot));

            OperationStatusResponse res =
                    tutorBookingPlanService.deleteBookingPlan(100L, 1L);

            assertTrue(res.getSuccess());
            verify(refundRequestRepository).save(any(RefundRequest.class));

            verify(notificationService, atLeastOnce()).sendNotification(
                    eq(999L),
                    contains("Yêu cầu hoàn tiền"),
                    anyString(),
                    eq(NotificationType.REFUND_AVAILABLE),
                    anyString()
            );
            verify(notificationService, atLeastOnce()).sendNotification(
                    eq(tutor.getUser().getUserID()),
                    contains("Yêu cầu hoàn tiền"),
                    anyString(),
                    eq(NotificationType.REFUND_AVAILABLE),
                    anyString()
            );
        }

        /**
         * NOTE CASE:
         * - Slot Available + learner
         * - Kỳ vọng:
         *   + notify TUTOR_CANCEL_BOOKING cho cả learner + tutor
         */
        @Test
        @DisplayName("Delete booking plan: slot Available + learner -> notify TUTOR_CANCEL_BOOKING")
        void deleteBookingPlan_availableSlotWithLearner() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan plan = buildPlan(1L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(20, 0),
                    60, 100_000d, "url");
            when(bookingPlanRepository.findById(1L))
                    .thenReturn(Optional.of(plan));

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10);
            LocalDateTime end = start.plusHours(1);
            BookingPlanSlot slot = buildSlot(
                    100L, 1L, 1L, 999L,
                    start, end,
                    SlotStatus.Available,
                    null
            );

            when(bookingPlanSlotRepository.findByBookingPlanIDOrderByStartTimeAsc(1L))
                    .thenReturn(List.of(slot));

            OperationStatusResponse res =
                    tutorBookingPlanService.deleteBookingPlan(100L, 1L);

            assertTrue(res.getSuccess());
            verify(notificationService, atLeastOnce()).sendNotification(
                    eq(999L),
                    contains("Lịch học đã bị hủy"),
                    anyString(),
                    eq(NotificationType.TUTOR_CANCEL_BOOKING),
                    anyString()
            );
            verify(notificationService, atLeastOnce()).sendNotification(
                    eq(tutor.getUser().getUserID()),
                    contains("Đã xóa slot có learner"),
                    anyString(),
                    eq(NotificationType.TUTOR_CANCEL_BOOKING),
                    anyString()
            );
        }
    }

    // =========================================================
    // getBookingPlansByTutor
    // =========================================================
    @Nested
    @DisplayName("getBookingPlansByTutor")
    class GetBookingPlansByTutorTests {

        /**
         * NOTE CASE:
         * - Tutor không tồn tại
         * - TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("Tutor không tồn tại -> TUTOR_NOT_FOUND")
        void getBookingPlansByTutor_tutorNotFound() {
            when(tutorRepository.findById(10L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.getBookingPlansByTutor(10L)
            );
            assertEquals(ErrorCode.TUTOR_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - Public API
         * - Kỳ vọng: không trả meetingUrl trong response bookingPlan
         */
        @Test
        @DisplayName("getBookingPlansByTutor – public API không trả meetingUrl")
        void getBookingPlansByTutor_success() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findById(1L)).thenReturn(Optional.of(tutor));

            BookingPlan p1 = buildPlan(10L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(12, 0),
                    60, 100_000d, "meet-link");
            when(bookingPlanRepository
                    .findByTutorIDAndIsActiveTrueOrderByTitleAscStartHoursAsc(1L))
                    .thenReturn(List.of(p1));

            BookingPlanListResponse res =
                    tutorBookingPlanService.getBookingPlansByTutor(1L);

            assertEquals(1L, res.getTutorId());
            assertEquals(1, res.getPlans().size());
            assertNull(res.getPlans().get(0).getMeetingUrl());
        }
    }

    // =========================================================
    // getMyBookingPlans
    // =========================================================
    @Nested
    @DisplayName("getMyBookingPlans")
    class GetMyBookingPlansTests {

        /**
         * NOTE CASE:
         * - Tutor APPROVED
         * - API cho tutor -> phải trả meetingUrl
         */
        @Test
        @DisplayName("Tutor lấy my plans – trả meetingUrl")
        void getMyBookingPlans_success() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan p1 = buildPlan(10L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(12, 0),
                    60, 100_000d, "meet-link");
            when(bookingPlanRepository
                    .findByTutorIDAndIsActiveTrueOrderByTitleAscStartHoursAsc(1L))
                    .thenReturn(List.of(p1));

            BookingPlanListResponse res =
                    tutorBookingPlanService.getMyBookingPlans(100L);

            assertEquals(1L, res.getTutorId());
            assertEquals(1, res.getPlans().size());
            assertEquals("meet-link", res.getPlans().get(0).getMeetingUrl());
        }
    }

    // =========================================================
    // getMyBookingPlansWithSlots
    // =========================================================
    @Nested
    @DisplayName("getMyBookingPlansWithSlots")
    class GetMyBookingPlansWithSlotsTests {

        /**
         * NOTE CASE:
         * - Tutor Approved
         * - slot Paid -> trả meetingUrl
         * - slot Available -> meetingUrl = null
         */
        @Test
        @DisplayName("Tutor lấy my plans with slots – slot Paid có meetingUrl, slot khác không")
        void getMyBookingPlansWithSlots_success() {
            Tutor tutor = buildTutor(1L, 100L, TutorStatus.APPROVED);
            when(tutorRepository.findByUser_UserID(100L))
                    .thenReturn(Optional.of(tutor));

            BookingPlan p1 = buildPlan(10L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(12, 0),
                    60, 100_000d, "meet-link");

            when(bookingPlanRepository
                    .findByTutorIDAndIsActiveTrueOrderByTitleAscStartHoursAsc(1L))
                    .thenReturn(List.of(p1));

            LocalDateTime now = LocalDateTime.now();
            BookingPlanSlot sPaid = buildSlot(
                    100L, 10L, 1L, 999L,
                    now.plusHours(1), now.plusHours(2),
                    SlotStatus.Paid, null
            );
            BookingPlanSlot sAvail = buildSlot(
                    101L, 10L, 1L, null,
                    now.plusHours(3), now.plusHours(4),
                    SlotStatus.Available, null
            );

            when(bookingPlanSlotRepository.findByBookingPlanIDOrderByStartTimeAsc(10L))
                    .thenReturn(List.of(sPaid, sAvail));

            BookingPlanListWithSlotsResponse res =
                    tutorBookingPlanService.getMyBookingPlansWithSlots(100L);

            assertEquals(1, res.getPlans().size());
            BookingPlanDetailResponse detail = res.getPlans().get(0);
            assertEquals(2, detail.getSlots().size());

            BookingPlanSlotSummaryResponse paidDto = detail.getSlots().get(0);
            BookingPlanSlotSummaryResponse availDto = detail.getSlots().get(1);

            assertEquals("Paid", paidDto.getStatus());
            assertEquals("meet-link", paidDto.getMeetingUrl());

            assertEquals("Available", availDto.getStatus());
            assertNull(availDto.getMeetingUrl());
        }
    }

    // =========================================================
    // getBookingPlanDetail
    // =========================================================
    @Nested
    @DisplayName("getBookingPlanDetail")
    class GetBookingPlanDetailTests {

        /**
         * NOTE CASE:
         * - bookingPlanId không tồn tại
         * - BOOKING_PLAN_NOT_FOUND
         */
        @Test
        @DisplayName("getBookingPlanDetail – plan không tồn tại -> BOOKING_PLAN_NOT_FOUND")
        void getBookingPlanDetail_notFound() {
            when(bookingPlanRepository.findById(10L)).thenReturn(Optional.empty());

            AppException ex = assertThrows(
                    AppException.class,
                    () -> tutorBookingPlanService.getBookingPlanDetail(10L)
            );
            assertEquals(ErrorCode.BOOKING_PLAN_NOT_FOUND, ex.getErrorcode());
        }

        /**
         * NOTE CASE:
         * - Public API detail
         * - bookingPlan không trả meetingUrl
         * - Slot Paid vẫn trả meetingUrl
         */
        @Test
        @DisplayName("getBookingPlanDetail – không trả meetingUrl trong plan, nhưng trả cho slot Paid")
        void getBookingPlanDetail_success() {
            BookingPlan plan = buildPlan(10L, 1L, "Friday",
                    LocalTime.of(9, 0), LocalTime.of(12, 0),
                    60, 100_000d, "meet-public");
            when(bookingPlanRepository.findById(10L))
                    .thenReturn(Optional.of(plan));

            LocalDateTime now = LocalDateTime.now();
            BookingPlanSlot sPaid = buildSlot(
                    100L, 10L, 1L, 999L,
                    now.plusHours(1), now.plusHours(2),
                    SlotStatus.Paid, null
            );
            BookingPlanSlot sAvail = buildSlot(
                    101L, 10L, 1L, null,
                    now.plusHours(3), now.plusHours(4),
                    SlotStatus.Available, null
            );
            when(bookingPlanSlotRepository.findByBookingPlanIDOrderByStartTimeAsc(10L))
                    .thenReturn(List.of(sPaid, sAvail));

            BookingPlanDetailResponse res =
                    tutorBookingPlanService.getBookingPlanDetail(10L);

            assertNull(res.getBookingPlan().getMeetingUrl());

            BookingPlanSlotSummaryResponse paidDto = res.getSlots().get(0);
            BookingPlanSlotSummaryResponse availDto = res.getSlots().get(1);

            assertEquals("Paid", paidDto.getStatus());
            assertEquals("meet-public", paidDto.getMeetingUrl());

            assertEquals("Available", availDto.getStatus());
            assertNull(availDto.getMeetingUrl());
        }
    }
}
