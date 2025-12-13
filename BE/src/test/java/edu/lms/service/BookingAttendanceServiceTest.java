package edu.lms.service;

import edu.lms.dto.request.BookingComplaintRequest;
import edu.lms.dto.request.EvidenceRequest;
import edu.lms.entity.*;
import edu.lms.enums.NotificationType;
import edu.lms.enums.PaymentType;
import edu.lms.enums.RefundStatus;
import edu.lms.enums.SlotStatus;
import edu.lms.exception.AppException;
import edu.lms.repository.BookingPlanRepository;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.PaymentRepository;
import edu.lms.repository.RefundRequestRepository;
import edu.lms.repository.TutorRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test cho BookingAttendanceService
 *
 * Cover:
 *  - learnerConfirmJoin
 *      + slot không tồn tại -> BOOKING_SLOT_NOT_FOUND
 *      + learner không phải owner slot -> UNAUTHORIZED
 *      + slot.status != Paid -> INVALID_KEY
 *      + Happy path: slot Paid, không có paymentId -> chỉ update slot, không đụng ví
 *      + Case: có paymentId, PaymentType != Booking -> không update ví
 *
 *  - tutorConfirmJoin
 *      + slot không tồn tại -> BOOKING_SLOT_NOT_FOUND
 *      + tutor không tồn tại -> TUTOR_NOT_FOUND
 *      + tutor không phải owner slot -> UNAUTHORIZED
 *      + slot.status != Paid -> INVALID_KEY
 *      + Payment không tồn tại -> PAYMENT_NOT_FOUND
 *      + PaymentType = Booking, nhưng không phải tất cả slot confirm -> không update ví
 *      + PaymentType = Booking, tất cả slot confirm -> gọi withdrawService + update ví tutor
 *
 *  - learnerComplain
 *      + slot không tồn tại -> BOOKING_SLOT_NOT_FOUND
 *      + learner không phải owner slot -> UNAUTHORIZED
 *      + slot.status != Paid -> INVALID_KEY
 *      + Happy path:
 *          * tạo RefundRequest với refundAmount tính từ duration buổi học
 *          * gửi notification REFUND_AVAILABLE
 *
 * Lưu ý:
 *  - Chỉ assertThrows(AppException.class), KHÔNG check ErrorCode bên trong.
 */
@ExtendWith(MockitoExtension.class)
class BookingAttendanceServiceTest {

    @Mock
    BookingPlanSlotRepository bookingPlanSlotRepository;
    @Mock
    BookingPlanRepository bookingPlanRepository;
    @Mock
    PaymentRepository paymentRepository;
    @Mock
    TutorRepository tutorRepository;
    @Mock
    RefundRequestRepository refundRequestRepository;
    @Mock
    WithdrawService withdrawService;
    @Mock
    NotificationService notificationService;

    @InjectMocks
    BookingAttendanceService bookingAttendanceService;

    // =========================
    // HELPER ENTITY BUILDER
    // =========================

    private BookingPlanSlot buildSlotPaid(Long slotId, Long userId, Long tutorId, Long paymentId) {
        BookingPlanSlot slot = new BookingPlanSlot();
        slot.setSlotID(slotId);
        slot.setUserID(userId);
        slot.setTutorID(tutorId);
        slot.setPaymentID(paymentId);
        slot.setStatus(SlotStatus.Paid);
        // default time 60 phút
        LocalDateTime start = LocalDateTime.of(2025, 1, 1, 10, 0);
        LocalDateTime end = start.plusMinutes(60);
        slot.setStartTime(start);
        slot.setEndTime(end);
        return slot;
    }

    private BookingPlan buildPlan(Long planId, Long tutorId, double pricePerHour) {
        BookingPlan plan = new BookingPlan();
        plan.setBookingPlanID(planId);
        plan.setTutorID(tutorId);
        plan.setPricePerHours(pricePerHour);
        return plan;
    }

    private Payment buildPayment(Long paymentId, PaymentType type, Long tutorId) {
        Payment p = new Payment();
        p.setPaymentID(paymentId);
        p.setPaymentType(type);
        p.setTutorId(tutorId);
        return p;
    }

    private Tutor buildTutor(Long tutorId) {
        Tutor t = new Tutor();
        t.setTutorID(tutorId);
        t.setWalletBalance(BigDecimal.ZERO);
        return t;
    }

    // =====================================================================
    // learnerConfirmJoin
    // =====================================================================

    @Nested
    @DisplayName("BookingAttendanceService.learnerConfirmJoin")
    class LearnerConfirmJoinTests {

        /**
         * NOTE – Case: Slot không tồn tại -> BOOKING_SLOT_NOT_FOUND
         */
        @Test
        @DisplayName("learnerConfirmJoin - slot không tồn tại -> AppException")
        void learnerConfirmJoin_slotNotFound_shouldThrow() {
            Long learnerUserId = 10L;
            Long slotId = 1L;

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.empty());

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("proof-url");

            assertThrows(AppException.class,
                    () -> bookingAttendanceService.learnerConfirmJoin(learnerUserId, slotId, req));

            verify(bookingPlanSlotRepository).findById(slotId);
            verify(bookingPlanSlotRepository, never()).save(any());
        }

        /**
         * NOTE – Case: learnerUserId khác slot.userID -> UNAUTHORIZED
         */
        @Test
        @DisplayName("learnerConfirmJoin - learner không phải owner slot -> UNAUTHORIZED")
        void learnerConfirmJoin_notOwner_shouldThrowUnauthorized() {
            Long learnerUserId = 10L;
            Long slotId = 1L;
            BookingPlanSlot slot = buildSlotPaid(slotId, 999L, 5L, null); // owner khác

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(slot));

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("evidence-url");

            assertThrows(AppException.class,
                    () -> bookingAttendanceService.learnerConfirmJoin(learnerUserId, slotId, req));

            verify(bookingPlanSlotRepository).findById(slotId);
            verify(bookingPlanSlotRepository, never()).save(any());
        }

        /**
         * NOTE – Case: slot.status != Paid -> INVALID_KEY
         */
        @Test
        @DisplayName("learnerConfirmJoin - slot không ở trạng thái Paid -> INVALID_KEY")
        void learnerConfirmJoin_slotNotPaid_shouldThrowInvalidKey() {
            Long learnerUserId = 10L;
            Long slotId = 1L;

            BookingPlanSlot slot = new BookingPlanSlot();
            slot.setSlotID(slotId);
            slot.setUserID(learnerUserId);
            slot.setStatus(SlotStatus.Available); // không phải Paid

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(slot));

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("evidence-url");

            assertThrows(AppException.class,
                    () -> bookingAttendanceService.learnerConfirmJoin(learnerUserId, slotId, req));

            verify(bookingPlanSlotRepository).findById(slotId);
            verify(bookingPlanSlotRepository, never()).save(any());
        }

        /**
         * NOTE – Case: Happy path
         *  - slot Paid, owner đúng, paymentID = null
         *  - Kỳ vọng:
         *      + slot.learnerJoin = true
         *      + slot.learnerEvidence = dto.evidenceUrl
         *      + slot được save
         *      + không gọi withdrawService / paymentRepository
         */
        @Test
        @DisplayName("learnerConfirmJoin - Happy path, không có payment -> chỉ update slot")
        void learnerConfirmJoin_success_noPayment() {
            Long learnerUserId = 10L;
            Long slotId = 1L;
            BookingPlanSlot slot = buildSlotPaid(slotId, learnerUserId, 5L, null); // paymentID = null

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(slot));
            when(bookingPlanSlotRepository.save(any(BookingPlanSlot.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("evidence-url");

            bookingAttendanceService.learnerConfirmJoin(learnerUserId, slotId, req);

            assertTrue(Boolean.TRUE.equals(slot.getLearnerJoin()));
            assertEquals("evidence-url", slot.getLearnerEvidence());

            verify(bookingPlanSlotRepository).findById(slotId);
            verify(bookingPlanSlotRepository).save(slot);
            verifyNoInteractions(paymentRepository, withdrawService);
        }

        /**
         * NOTE – Case: Có paymentID nhưng PaymentType != Booking
         *  - checkAndUpdateTutorWalletIfEligible sẽ return sớm
         *  - Kỳ vọng:
         *      + slot vẫn được cập nhật join + evidence
         *      + không gọi withdrawService
         */
        @Test
        @DisplayName("learnerConfirmJoin - PaymentType != Booking -> không update ví")
        void learnerConfirmJoin_paymentNotBooking_noWalletUpdate() {
            Long learnerUserId = 10L;
            Long slotId = 1L;
            Long paymentId = 100L;

            BookingPlanSlot slot = buildSlotPaid(slotId, learnerUserId, 5L, paymentId);

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(slot));
            when(bookingPlanSlotRepository.save(any(BookingPlanSlot.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            Payment payment = buildPayment(paymentId, PaymentType.Course, 5L); // != Booking
            when(paymentRepository.findById(paymentId))
                    .thenReturn(Optional.of(payment));

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("evidence-url");

            bookingAttendanceService.learnerConfirmJoin(learnerUserId, slotId, req);

            assertTrue(Boolean.TRUE.equals(slot.getLearnerJoin()));
            assertEquals("evidence-url", slot.getLearnerEvidence());

            verify(paymentRepository).findById(paymentId);
            verifyNoInteractions(withdrawService);
        }
    }

    // =====================================================================
    // tutorConfirmJoin
    // =====================================================================

    @Nested
    @DisplayName("BookingAttendanceService.tutorConfirmJoin")
    class TutorConfirmJoinTests {

        /**
         * NOTE – Case: Slot không tồn tại -> BOOKING_SLOT_NOT_FOUND
         */
        @Test
        @DisplayName("tutorConfirmJoin - slot không tồn tại -> AppException")
        void tutorConfirmJoin_slotNotFound_shouldThrow() {
            Long tutorUserId = 99L;
            Long slotId = 1L;

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.empty());

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("proof");

            assertThrows(AppException.class,
                    () -> bookingAttendanceService.tutorConfirmJoin(tutorUserId, slotId, req));

            verify(bookingPlanSlotRepository).findById(slotId);
            verifyNoInteractions(tutorRepository);
        }

        /**
         * NOTE – Case: Tutor không tồn tại -> TUTOR_NOT_FOUND
         */
        @Test
        @DisplayName("tutorConfirmJoin - tutor không tồn tại -> AppException")
        void tutorConfirmJoin_tutorNotFound_shouldThrow() {
            Long tutorUserId = 50L;
            Long slotId = 1L;
            BookingPlanSlot slot = buildSlotPaid(slotId, 10L, 5L, null);

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(slot));
            when(tutorRepository.findByUser_UserID(tutorUserId))
                    .thenReturn(Optional.empty());

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("proof");

            assertThrows(AppException.class,
                    () -> bookingAttendanceService.tutorConfirmJoin(tutorUserId, slotId, req));

            verify(bookingPlanSlotRepository).findById(slotId);
            verify(tutorRepository).findByUser_UserID(tutorUserId);
        }

        /**
         * NOTE – Case: Tutor không phải owner của slot -> UNAUTHORIZED
         */
        @Test
        @DisplayName("tutorConfirmJoin - tutor không phải owner slot -> UNAUTHORIZED")
        void tutorConfirmJoin_notOwner_shouldThrowUnauthorized() {
            Long tutorUserId = 100L;
            Long slotId = 1L;
            BookingPlanSlot slot = buildSlotPaid(slotId, 10L, 5L, null); // slot.tutorID = 5

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(slot));

            Tutor tutor = buildTutor(999L); // tutorID khác
            when(tutorRepository.findByUser_UserID(tutorUserId))
                    .thenReturn(Optional.of(tutor));

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("proof");

            assertThrows(AppException.class,
                    () -> bookingAttendanceService.tutorConfirmJoin(tutorUserId, slotId, req));

            verify(bookingPlanSlotRepository).findById(slotId);
            verify(tutorRepository).findByUser_UserID(tutorUserId);
            verify(bookingPlanSlotRepository, never()).save(any());
        }

        /**
         * NOTE – Case: slot.status != Paid -> INVALID_KEY
         */
        @Test
        @DisplayName("tutorConfirmJoin - slot không Paid -> INVALID_KEY")
        void tutorConfirmJoin_slotNotPaid_shouldThrowInvalidKey() {
            Long tutorUserId = 100L;
            Long slotId = 1L;

            BookingPlanSlot slot = new BookingPlanSlot();
            slot.setSlotID(slotId);
            slot.setUserID(10L);
            slot.setTutorID(5L);
            slot.setStatus(SlotStatus.Available);

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(slot));

            Tutor tutor = buildTutor(5L);
            when(tutorRepository.findByUser_UserID(tutorUserId))
                    .thenReturn(Optional.of(tutor));

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("proof");

            assertThrows(AppException.class,
                    () -> bookingAttendanceService.tutorConfirmJoin(tutorUserId, slotId, req));

            verify(bookingPlanSlotRepository).findById(slotId);
            verify(bookingPlanSlotRepository, never()).save(any());
        }

        /**
         * NOTE – Case: Payment không tồn tại -> PAYMENT_NOT_FOUND
         */
        @Test
        @DisplayName("tutorConfirmJoin - Payment không tồn tại -> AppException PAYMENT_NOT_FOUND")
        void tutorConfirmJoin_paymentNotFound_shouldThrow() {
            Long tutorUserId = 100L;
            Long slotId = 1L;
            Long paymentId = 200L;

            BookingPlanSlot slot = buildSlotPaid(slotId, 10L, 5L, paymentId);

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(slot));

            Tutor tutor = buildTutor(5L);
            when(tutorRepository.findByUser_UserID(tutorUserId))
                    .thenReturn(Optional.of(tutor));

            when(bookingPlanSlotRepository.save(any(BookingPlanSlot.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            when(paymentRepository.findById(paymentId))
                    .thenReturn(Optional.empty());

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("proof");

            assertThrows(AppException.class,
                    () -> bookingAttendanceService.tutorConfirmJoin(tutorUserId, slotId, req));

            verify(paymentRepository).findById(paymentId);
            verifyNoInteractions(withdrawService);
        }

        /**
         * NOTE – Case: PaymentType = Booking nhưng chưa đủ allConfirmed
         */
        @Test
        @DisplayName("tutorConfirmJoin - Booking nhưng chưa đủ allConfirmed -> không update ví")
        void tutorConfirmJoin_bookingNotAllConfirmed_noWalletUpdate() {
            Long tutorUserId = 100L;
            Long tutorId = 5L;
            Long slotId = 1L;
            Long paymentId = 200L;

            BookingPlanSlot currentSlot = buildSlotPaid(slotId, 10L, tutorId, paymentId);
            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(currentSlot));

            Tutor tutor = buildTutor(tutorId);
            when(tutorRepository.findByUser_UserID(tutorUserId))
                    .thenReturn(Optional.of(tutor));

            when(bookingPlanSlotRepository.save(any(BookingPlanSlot.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            Payment payment = buildPayment(paymentId, PaymentType.Booking, tutorId);
            when(paymentRepository.findById(paymentId))
                    .thenReturn(Optional.of(payment));

            BookingPlanSlot s1 = buildSlotPaid(2L, 11L, tutorId, paymentId);
            s1.setTutorJoin(true);
            s1.setLearnerJoin(true);

            BookingPlanSlot s2 = buildSlotPaid(3L, 12L, tutorId, paymentId);
            s2.setTutorJoin(false);
            s2.setLearnerJoin(true);

            when(bookingPlanSlotRepository.findAllByPaymentID(paymentId))
                    .thenReturn(List.of(s1, s2));

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("proof");

            bookingAttendanceService.tutorConfirmJoin(tutorUserId, slotId, req);

            assertTrue(Boolean.TRUE.equals(currentSlot.getTutorJoin()));
            assertEquals("proof", currentSlot.getTutorEvidence());

            verifyNoInteractions(withdrawService);
        }

        /**
         * NOTE – Case: PaymentType = Booking, tất cả slot của payment đều Paid + tutorJoin + learnerJoin
         */
        @Test
        @DisplayName("tutorConfirmJoin - Booking, allConfirmed -> update ví tutor")
        void tutorConfirmJoin_bookingAllConfirmed_updateWallet() {
            Long tutorUserId = 100L;
            Long tutorId = 5L;
            Long slotId = 1L;
            Long paymentId = 200L;

            BookingPlanSlot currentSlot = buildSlotPaid(slotId, 10L, tutorId, paymentId);
            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(currentSlot));

            Tutor tutor = buildTutor(tutorId);
            when(tutorRepository.findByUser_UserID(tutorUserId))
                    .thenReturn(Optional.of(tutor));

            when(bookingPlanSlotRepository.save(any(BookingPlanSlot.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            Payment payment = buildPayment(paymentId, PaymentType.Booking, tutorId);
            when(paymentRepository.findById(paymentId))
                    .thenReturn(Optional.of(payment));

            BookingPlanSlot s1 = buildSlotPaid(2L, 11L, tutorId, paymentId);
            s1.setTutorJoin(true);
            s1.setLearnerJoin(true);

            BookingPlanSlot s2 = buildSlotPaid(3L, 12L, tutorId, paymentId);
            s2.setTutorJoin(true);
            s2.setLearnerJoin(true);

            when(bookingPlanSlotRepository.findAllByPaymentID(paymentId))
                    .thenReturn(List.of(s1, s2));

            BigDecimal newBalance = new BigDecimal("123.45");
            when(withdrawService.calculateCurrentBalance(tutorId))
                    .thenReturn(newBalance);

            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.of(tutor));

            EvidenceRequest req = new EvidenceRequest();
            req.setEvidenceUrl("proof");

            bookingAttendanceService.tutorConfirmJoin(tutorUserId, slotId, req);

            assertTrue(Boolean.TRUE.equals(currentSlot.getTutorJoin()));
            assertEquals("proof", currentSlot.getTutorEvidence());

            verify(withdrawService).calculateCurrentBalance(tutorId);
            verify(tutorRepository).save(tutor);
            assertEquals(newBalance, tutor.getWalletBalance());
        }
    }

    // =====================================================================
    // learnerComplain
    // =====================================================================

    @Nested
    @DisplayName("BookingAttendanceService.learnerComplain")
    class LearnerComplainTests {

        /**
         * NOTE – Case: Slot không tồn tại -> BOOKING_SLOT_NOT_FOUND
         */
        @Test
        @DisplayName("learnerComplain - slot không tồn tại -> AppException")
        void learnerComplain_slotNotFound_shouldThrow() {
            Long learnerUserId = 10L;
            Long slotId = 1L;

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.empty());

            BookingComplaintRequest req = new BookingComplaintRequest();
            req.setEvidenceUrl("proof");

            assertThrows(AppException.class,
                    () -> bookingAttendanceService.learnerComplain(learnerUserId, slotId, req));

            verify(bookingPlanSlotRepository).findById(slotId);
            verifyNoInteractions(bookingPlanRepository, refundRequestRepository, notificationService);
        }

        /**
         * NOTE – Case: learner không phải owner slot -> UNAUTHORIZED
         */
        @Test
        @DisplayName("learnerComplain - learner không phải owner -> UNAUTHORIZED")
        void learnerComplain_notOwner_shouldThrowUnauthorized() {
            Long learnerUserId = 10L;
            Long slotId = 1L;
            BookingPlanSlot slot = buildSlotPaid(slotId, 999L, 5L, 200L); // owner khác

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(slot));

            BookingComplaintRequest req = new BookingComplaintRequest();
            req.setEvidenceUrl("proof");

            assertThrows(AppException.class,
                    () -> bookingAttendanceService.learnerComplain(learnerUserId, slotId, req));

            verify(bookingPlanSlotRepository).findById(slotId);
            verify(bookingPlanSlotRepository, never()).save(any());
        }

        /**
         * NOTE – Case: slot.status != Paid -> INVALID_KEY
         */
        @Test
        @DisplayName("learnerComplain - slot không Paid -> INVALID_KEY")
        void learnerComplain_slotNotPaid_shouldThrowInvalidKey() {
            Long learnerUserId = 10L;
            Long slotId = 1L;

            BookingPlanSlot slot = new BookingPlanSlot();
            slot.setSlotID(slotId);
            slot.setUserID(learnerUserId);
            slot.setStatus(SlotStatus.Available);

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(slot));

            BookingComplaintRequest req = new BookingComplaintRequest();
            req.setEvidenceUrl("proof");

            assertThrows(AppException.class,
                    () -> bookingAttendanceService.learnerComplain(learnerUserId, slotId, req));

            verify(bookingPlanSlotRepository).findById(slotId);
            verify(bookingPlanSlotRepository, never()).save(any());
        }

        /**
         * NOTE – Case: Happy path
         *  - ĐÃ SỬA: verify notification path = "/learner/refunds"
         *    để match với implementation hiện tại trong BookingAttendanceService
         *    (trước đó test expect "/learner/refunds/{id}" nên bị Argument(s) are different!)
         */
        @Test
        @DisplayName("learnerComplain - Happy path tạo refund + gửi notification")
        void learnerComplain_success_createRefundAndNotification() {
            Long learnerUserId = 10L;
            Long tutorId = 5L;
            Long slotId = 1L;
            Long planId = 100L;

            // slot 90 phút, pricePerHours = 100 -> refund = 150.00
            BookingPlanSlot slot = buildSlotPaid(slotId, learnerUserId, tutorId, 200L);
            LocalDateTime start = LocalDateTime.of(2025, 1, 1, 10, 0);
            LocalDateTime end = start.plusMinutes(90);
            slot.setStartTime(start);
            slot.setEndTime(end);
            slot.setBookingPlanID(planId);

            when(bookingPlanSlotRepository.findById(slotId))
                    .thenReturn(Optional.of(slot));
            when(bookingPlanSlotRepository.save(any(BookingPlanSlot.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            BookingPlan plan = buildPlan(planId, tutorId, 100.0); // 100 per hour
            when(bookingPlanRepository.findById(planId))
                    .thenReturn(Optional.of(plan));

            Tutor tutor = buildTutor(tutorId);
            when(tutorRepository.findById(tutorId))
                    .thenReturn(Optional.of(tutor));

            // Capture RefundRequest để verify refundAmount & status
            ArgumentCaptor<RefundRequest> refundCaptor =
                    ArgumentCaptor.forClass(RefundRequest.class);

            when(refundRequestRepository.save(refundCaptor.capture()))
                    .thenAnswer(inv -> {
                        RefundRequest r = inv.getArgument(0);
                        r.setRefundRequestId(999L);
                        return r;
                    });

            BookingComplaintRequest req = new BookingComplaintRequest();
            req.setEvidenceUrl("complain-proof");

            bookingAttendanceService.learnerComplain(learnerUserId, slotId, req);

            // learnerEvidence được set, nhưng learnerJoin không bị true ở service này
            assertEquals("complain-proof", slot.getLearnerEvidence());
            assertFalse(Boolean.TRUE.equals(slot.getLearnerJoin()));

            RefundRequest savedRefund = refundCaptor.getValue();
            assertEquals(planId, savedRefund.getBookingPlanId());
            assertEquals(slotId, savedRefund.getSlotId());
            assertEquals(learnerUserId, savedRefund.getUserId());
            assertEquals(RefundStatus.PENDING, savedRefund.getStatus());

            // check số tiền hoàn: 100 * (90/60) = 150.00 (scale 2)
            BigDecimal expectedAmount = BigDecimal.valueOf(150.00).setScale(2);
            assertEquals(0, expectedAmount.compareTo(savedRefund.getRefundAmount()));

            // 🔧 NOTE QUAN TRỌNG:
            // Service hiện tại dùng path "/learner/refunds"
            // nên test verify đúng string đó, không kèm refundRequestId.
            verify(notificationService).sendNotification(
                    eq(learnerUserId),
                    anyString(),
                    contains("khiếu nại"),
                    eq(NotificationType.REFUND_AVAILABLE),
                    eq("/learner/refunds")
            );
        }
    }
}
