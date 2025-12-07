package edu.lms.service;

import edu.lms.dto.request.BookingComplaintRequest;
import edu.lms.dto.request.EvidenceRequest;
import edu.lms.entity.BookingPlan;
import edu.lms.entity.BookingPlanSlot;
import edu.lms.entity.Payment;
import edu.lms.entity.RefundRequest;
import edu.lms.entity.Tutor;
import edu.lms.enums.NotificationType;
import edu.lms.enums.RefundStatus;
import edu.lms.enums.SlotStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.BookingPlanRepository;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.PaymentRepository;
import edu.lms.repository.RefundRequestRepository;
import edu.lms.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingAttendanceService {

    private final BookingPlanSlotRepository bookingPlanSlotRepository;
    private final BookingPlanRepository bookingPlanRepository;
    private final PaymentRepository paymentRepository;
    private final TutorRepository tutorRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final WithdrawService withdrawService;
    private final NotificationService notificationService;

    // =========================
    // LEARNER XÁC NHẬN THAM GIA
    // =========================
    @Transactional
    public void learnerConfirmJoin(Long learnerUserId, Long slotId, EvidenceRequest dto) {
        BookingPlanSlot slot = bookingPlanSlotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_SLOT_NOT_FOUND));

        if (!learnerUserId.equals(slot.getUserID())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (slot.getStatus() != SlotStatus.Paid) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        slot.setLearnerJoin(true);
        slot.setLearnerEvidence(dto.getEvidenceUrl());
        bookingPlanSlotRepository.save(slot);

        log.info("[ATTENDANCE] Learner {} confirmed join for slot {}", learnerUserId, slotId);

        checkAndUpdateTutorWalletIfEligible(slot);
    }

    // =========================
    // TUTOR XÁC NHẬN THAM GIA
    // =========================
    @Transactional
    public void tutorConfirmJoin(Long tutorUserId, Long slotId, EvidenceRequest dto) {
        BookingPlanSlot slot = bookingPlanSlotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_SLOT_NOT_FOUND));

        Tutor tutor = tutorRepository.findByUser_UserID(tutorUserId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        if (!tutor.getTutorID().equals(slot.getTutorID())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (slot.getStatus() != SlotStatus.Paid) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        slot.setTutorJoin(true);
        slot.setTutorEvidence(dto.getEvidenceUrl());
        bookingPlanSlotRepository.save(slot);

        log.info("[ATTENDANCE] Tutor {} confirmed join for slot {}", tutor.getTutorID(), slotId);

        checkAndUpdateTutorWalletIfEligible(slot);
    }

    // =========================
    // LEARNER KHIẾU NẠI BUỔI HỌC
    // =========================
    @Transactional
    public void learnerComplain(Long learnerUserId, Long slotId, BookingComplaintRequest dto) {
        BookingPlanSlot slot = bookingPlanSlotRepository.findById(slotId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_SLOT_NOT_FOUND));

        if (!learnerUserId.equals(slot.getUserID())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (slot.getStatus() != SlotStatus.Paid) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        // Không set learnerJoin = true, chỉ lưu evidence
        slot.setLearnerEvidence(dto.getEvidenceUrl());
        bookingPlanSlotRepository.save(slot);

        BookingPlan plan = bookingPlanRepository.findById(slot.getBookingPlanID())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_PLAN_NOT_FOUND));

        Tutor tutor = tutorRepository.findById(plan.getTutorID())
                .orElse(null);

        BigDecimal refundAmount = calculateRefundAmount(slot, plan);

        RefundRequest refund = RefundRequest.builder()
                .bookingPlanId(plan.getBookingPlanID())
                .slotId(slot.getSlotID())
                .userId(learnerUserId)
                .packageId(slot.getUserPackage() != null ? slot.getUserPackage().getUserPackageID() : null)
                .refundAmount(refundAmount)
                .status(RefundStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .tutor(tutor)
                .build();

        refundRequestRepository.save(refund);

        // Notification cho learner: có yêu cầu refund
        notificationService.sendNotification(
                learnerUserId,
                "Bạn đã gửi khiếu nại cho buổi học",
                "Hệ thống đã ghi nhận khiếu nại của bạn cho slot vào lúc "
                        + formatDateTime(slot.getStartTime())
                        + ". Vui lòng theo dõi trạng thái hoàn tiền.",
                NotificationType.REFUND_AVAILABLE,
                "/learner/refunds"
        );

        log.info("[COMPLAIN] Learner {} created refund request {} for slot {}",
                learnerUserId, refund.getRefundRequestId(), slotId);
    }

    // =========================
    // CHECK & CỘNG VÍ TUTOR
    // =========================
    private void checkAndUpdateTutorWalletIfEligible(BookingPlanSlot slot) {
        if (slot.getPaymentID() == null) return;

        Payment payment = paymentRepository.findById(slot.getPaymentID())
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getPaymentType() != edu.lms.enums.PaymentType.Booking) return;

        List<BookingPlanSlot> slotsOfPayment =
                bookingPlanSlotRepository.findAllByPaymentID(payment.getPaymentID());

        boolean allConfirmed = slotsOfPayment.stream()
                .filter(s -> s.getStatus() == SlotStatus.Paid)
                .allMatch(s ->
                        Boolean.TRUE.equals(s.getTutorJoin())
                                && Boolean.TRUE.equals(s.getLearnerJoin())
                );

        if (!allConfirmed) {
            return;
        }

        Long tutorId = payment.getTutorId();
        if (tutorId == null && !slotsOfPayment.isEmpty()) {
            tutorId = slotsOfPayment.get(0).getTutorID();
        }
        if (tutorId == null) return;

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        // ⚠️ YÊU CẦU: thuật toán calculateCurrentBalance phải chỉ tính các booking đã được "release"
        BigDecimal newBalance = withdrawService.calculateCurrentBalance(tutorId);
        tutor.setWalletBalance(newBalance);
        tutorRepository.save(tutor);

        log.info("[WALLET] Updated wallet_balance for tutor {} = {} after all slots confirmed join",
                tutorId, newBalance);
    }

    private BigDecimal calculateRefundAmount(BookingPlanSlot slot, BookingPlan plan) {
        BigDecimal pricePerHour = BigDecimal.valueOf(plan.getPricePerHours());
        long minutes = java.time.Duration.between(slot.getStartTime(), slot.getEndTime()).toMinutes();

        if (minutes <= 0) return BigDecimal.ZERO;

        return pricePerHour
                .multiply(BigDecimal.valueOf(minutes))
                .divide(BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);
    }

    private String formatDateTime(LocalDateTime dt) {
        return dt.toLocalTime() + " ngày " + dt.toLocalDate();
    }
}
