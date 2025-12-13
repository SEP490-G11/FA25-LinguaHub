package edu.lms.service;

import edu.lms.dto.request.BookingComplaintRequest;
import edu.lms.dto.request.EvidenceRequest;
import edu.lms.entity.*;
import edu.lms.enums.NotificationType;
import edu.lms.enums.RefundStatus;
import edu.lms.enums.RefundType;
import edu.lms.enums.SlotStatus;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
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

        // Chỉ cần recal ví, thuật toán release nằm trong WithdrawService
        recalcTutorWalletForSlot(slot);
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

        // nếu tồn tại refund complaint thì sync tutorAttend vào refund
        syncTutorAttendFromSlotToRefund(slot);

        // recalc ví tutor
        recalcTutorWalletForSlot(slot);
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

        // Learner cung cấp evidence khiếu nại
        slot.setLearnerEvidence(dto.getEvidenceUrl());
        bookingPlanSlotRepository.save(slot);

        BookingPlan plan = bookingPlanRepository.findById(slot.getBookingPlanID())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_PLAN_NOT_FOUND));

        Tutor tutor = tutorRepository.findById(plan.getTutorID())
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        BigDecimal refundAmount = calculateRefundAmount(slot, plan);

        // Nếu tutor đã xác nhận join trước đó => coi như đã "tutorAttend = true"
        boolean tutorHasJoinedBefore = Boolean.TRUE.equals(slot.getTutorJoin())
                || slot.getTutorEvidence() != null;

        Boolean initialTutorAttend = tutorHasJoinedBefore ? Boolean.TRUE : null;
        LocalDateTime tutorRespondedAt = tutorHasJoinedBefore ? LocalDateTime.now() : null;

        RefundRequest refund = RefundRequest.builder()
                .bookingPlanId(plan.getBookingPlanID())
                .slotId(slot.getSlotID())
                .userId(learnerUserId)
                .packageId(slot.getUserPackage() != null ? slot.getUserPackage().getUserPackageID() : null)
                .refundAmount(refundAmount)
                .status(RefundStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .tutor(tutor)
                .refundType(RefundType.COMPLAINT)
                .reason(dto.getReason())
                .tutorAttend(initialTutorAttend)       // true nếu tutor đã join từ trước
                .tutorRespondedAt(tutorRespondedAt)    // set luôn thời điểm sync
                .build();

        refundRequestRepository.save(refund);

        // Notification cho learner: đã gửi khiếu nại
        notificationService.sendNotification(
                learnerUserId,
                "Bạn đã gửi khiếu nại cho buổi học",
                "Hệ thống đã ghi nhận khiếu nại của bạn cho slot vào lúc "
                        + formatDateTime(slot.getStartTime())
                        + ". Vui lòng theo dõi trạng thái hoàn tiền.",
                NotificationType.REFUND_AVAILABLE,
                "/learner/refunds"
        );

        // Gửi notif yêu cầu tutor phản hồi CHỈ khi tutor chưa join & chưa có evidence trước đó
        if (!tutorHasJoinedBefore && tutor != null && tutor.getUser() != null) {
            Long tutorUserId = tutor.getUser().getUserID();

            notificationService.sendNotification(
                    tutorUserId,
                    "Bạn bị khiếu nại cho buổi học",
                    "Học viên đã khiếu nại buổi học vào lúc "
                            + formatDateTime(slot.getStartTime())
                            + ". Vui lòng xác nhận tham gia hoặc đồng ý hoàn tiền.",
                    NotificationType.BOOKING_COMPLAINT_TO_TUTOR,
                    "/tutor/refunds/" + refund.getRefundRequestId()
            );
        }

        log.info("[COMPLAIN] Learner {} created refund request {} for slot {}",
                learnerUserId, refund.getRefundRequestId(), slotId);
    }

    // =========================
    // RE-CALC & CỘNG VÍ TUTOR (nếu đủ điều kiện)
    // =========================
    private void recalcTutorWalletForSlot(BookingPlanSlot slot) {
        if (slot.getPaymentID() == null) return;

        Payment payment = paymentRepository.findById(slot.getPaymentID())
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getPaymentType() != edu.lms.enums.PaymentType.Booking) return;

        Long tutorId = payment.getTutorId();
        if (tutorId == null) {
            // fallback từ slot nếu chưa set tutorId trong Payment
            tutorId = slot.getTutorID();
        }
        if (tutorId == null) return;

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

        // Thuật toán release nằm trong WithdrawService
        BigDecimal newBalance = withdrawService.calculateCurrentBalance(tutorId);
        tutor.setWalletBalance(newBalance);
        tutorRepository.save(tutor);

        log.info("[WALLET] Recal wallet_balance for tutor {} = {}", tutorId, newBalance);
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

    // Sync tutorAttend từ slot sang refund complaint (khi tutor xác nhận join sau khi bị khiếu nại)
    private void syncTutorAttendFromSlotToRefund(BookingPlanSlot slot) {
        var refunds = refundRequestRepository.findBySlotIdAndRefundType(
                slot.getSlotID(),
                RefundType.COMPLAINT
        );

        for (RefundRequest r : refunds) {
            // chỉ update nếu tutor chưa phản hồi & refund chưa chốt
            if (r.getTutorAttend() == null &&
                    (r.getStatus() == RefundStatus.PENDING || r.getStatus() == RefundStatus.SUBMITTED)) {

                r.setTutorAttend(true);                     // tutor khẳng định có tham gia
                r.setTutorRespondedAt(LocalDateTime.now());
                refundRequestRepository.save(r);

                log.info("[REFUND][SYNC] Slot {} tutorJoin=true -> update Refund {} tutorAttend=true",
                        slot.getSlotID(), r.getRefundRequestId());
            }
        }
    }

    // =========================
    // CRON: AUTO XÁC NHẬN LEARNER NẾU QUÊN BẤM
    // =========================
    /**
     * Mỗi 60s:
     *  - tìm các slot:
     *      + status = Paid
     *      + tutorJoin = true
     *      + learnerJoin = false
     *      + endTime < now
     *  - nếu KHÔNG có refund complaint PENDING / SUBMITTED
     *    → auto set learnerJoin = true và recalc ví tutor.
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void autoConfirmLearnerIfTutorJoined() {
        LocalDateTime now = LocalDateTime.now();

        List<BookingPlanSlot> candidates =
                bookingPlanSlotRepository.findByStatusAndTutorJoinTrueAndLearnerJoinFalseAndEndTimeBefore(
                        SlotStatus.Paid,
                        now
                );

        if (candidates.isEmpty()) return;

        var activeStatuses = List.of(RefundStatus.PENDING, RefundStatus.SUBMITTED);

        for (BookingPlanSlot slot : candidates) {

            boolean hasActiveRefund = refundRequestRepository
                    .existsBySlotIdAndStatusIn(slot.getSlotID(), activeStatuses);

            if (hasActiveRefund) {
                log.info("[AUTO-CONFIRM] Skip slot {} because of active refund", slot.getSlotID());
                continue;
            }

            slot.setLearnerJoin(true);
            bookingPlanSlotRepository.save(slot);

            recalcTutorWalletForSlot(slot);

            log.info("[AUTO-CONFIRM] Auto set learnerJoin=true for slot {}", slot.getSlotID());
        }
    }
}
