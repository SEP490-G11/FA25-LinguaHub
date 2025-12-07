package edu.lms.service;

import edu.lms.dto.request.PaymentRequest;
import edu.lms.dto.request.SlotRequest;
import edu.lms.dto.response.PaymentResponse;
import edu.lms.entity.*;
import edu.lms.enums.*;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.mapper.PaymentMapper;
import edu.lms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.type.CheckoutResponseData;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final CourseRepository courseRepository;
    private final BookingPlanRepository bookingPlanRepository;
    private final BookingPlanSlotRepository bookingPlanSlotRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final TutorRepository tutorRepository;
    private final PayOSService payOSService;
    private final ChatService chatService;
    private final PaymentMapper paymentMapper;
    private final UserPackageRepository userPackageRepository;
    private final SettingRepository settingRepository;
    private final WithdrawService withdrawService;
    private final CloudflareTurnstileService cloudflareTurnstileService;

    // =============================
    // (optional) TÍNH NET CHO 1 PAYMENT – giờ ưu tiên snapshot netAmount
    // =============================
    private BigDecimal calculateNetForPayment(Payment payment) {
        Setting setting = settingRepository.getCurrentSetting();
        BigDecimal commissionCourse = setting.getCommissionCourse();
        BigDecimal commissionBooking = setting.getCommissionBooking();

        BigDecimal amount = payment.getAmount();
        BigDecimal commissionRate;

        if (payment.getPaymentType() == PaymentType.Course) {
            commissionRate = commissionCourse;
        } else if (payment.getPaymentType() == PaymentType.Booking) {
            commissionRate = commissionBooking;
        } else {
            commissionRate = BigDecimal.ZERO;
        }

        return amount.subtract(amount.multiply(commissionRate));
    }

    // ======================================================
    // TẠO THANH TOÁN (PENDING)
    // ======================================================
    @Transactional
    public ResponseEntity<?> createPayment(PaymentRequest request) {
        Payment payment;
        BigDecimal amount;
        String description;
        Long tutorId;

        // ----------------- COURSE PAYMENT -----------------
        if (request.getPaymentType() == PaymentType.Course) {
            Course course = courseRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

            amount = course.getPrice();
            tutorId = course.getTutor().getTutorID();
            description = "Course: " + course.getTitle();

            payment = Payment.builder()
                    .userId(request.getUserId())
                    .targetId(course.getCourseID())
                    .tutorId(tutorId)
                    .paymentType(PaymentType.Course)
                    .paymentMethod(PaymentMethod.PAYOS)
                    .status(PaymentStatus.PENDING)
                    .amount(amount)
                    .isPaid(false)
                    .expiresAt(LocalDateTime.now().plusMinutes(3))
                    .build();

            paymentRepository.save(payment);
        }

        // ----------------- BOOKING PAYMENT -----------------
        else if (request.getPaymentType() == PaymentType.Booking) {
            boolean verified = cloudflareTurnstileService.verify(request.getTurnstileToken());
            if (!verified) {
                throw new AppException(ErrorCode.INVALID_TURNSTILE_TOKEN);
            }
            UserPackage userPackage = null;

            if (request.getUserPackageId() != null) {
                userPackage = userPackageRepository.findById(request.getUserPackageId())
                        .orElseThrow(() -> new AppException(ErrorCode.USER_PACKAGE_NOT_FOUND));
            }

            BookingPlan plan = bookingPlanRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

            tutorId = plan.getTutorID();
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

            // ========== chặn hủy / hết hạn > 3 lần trong vòng 1h ==========
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);

            long cancelledCount = paymentRepository
                    .countByUserIdAndPaymentTypeAndTargetIdAndStatusAndCreatedAtAfter(
                            user.getUserID(),
                            PaymentType.Booking,
                            plan.getBookingPlanID(),
                            PaymentStatus.CANCELLED,
                            oneHourAgo
                    );

            long expiredCount = paymentRepository
                    .countByUserIdAndPaymentTypeAndTargetIdAndStatusAndCreatedAtAfter(
                            user.getUserID(),
                            PaymentType.Booking,
                            plan.getBookingPlanID(),
                            PaymentStatus.EXPIRED,
                            oneHourAgo
                    );

            long badAttempts = cancelledCount + expiredCount;

            if (badAttempts >= 3) {
                throw new AppException(ErrorCode.BOOKING_PAYMENT_CANCEL_TOO_MANY_TIMES);
            }

            // ========================================================

            List<SlotRequest> slots = request.getSlots();
            if (slots == null || slots.isEmpty()) {
                throw new AppException(ErrorCode.BOOKING_SLOT_NOT_AVAILABLE);
            }

            BigDecimal totalAmount = BigDecimal.valueOf(plan.getPricePerHours() * slots.size());
            description = "Slot 1:1 " + plan.getTitle();

            for (SlotRequest s : slots) {
                boolean taken = bookingPlanSlotRepository.existsByTutorIDAndStartTimeAndEndTime(
                        plan.getTutorID(), s.getStartTime(), s.getEndTime());
                if (taken) throw new AppException(ErrorCode.BOOKING_SLOT_NOT_AVAILABLE);

                BookingPlanSlot slot = BookingPlanSlot.builder()
                        .bookingPlanID(plan.getBookingPlanID())
                        .tutorID(plan.getTutorID())
                        .userID(user.getUserID())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .status(SlotStatus.Locked)
                        .lockedAt(LocalDateTime.now())
                        .expiresAt(LocalDateTime.now().plusMinutes(15))
                        .userPackage(userPackage)
                        .reminderSent(false)
                        .build();

                bookingPlanSlotRepository.save(slot);
            }

            payment = Payment.builder()
                    .userId(user.getUserID())
                    .tutorId(tutorId)
                    .targetId(plan.getBookingPlanID())
                    .paymentType(PaymentType.Booking)
                    .paymentMethod(PaymentMethod.PAYOS)
                    .status(PaymentStatus.PENDING)
                    .amount(totalAmount)
                    .isPaid(false)
                    .expiresAt(LocalDateTime.now().plusMinutes(3))
                    .build();

            paymentRepository.save(payment);

            bookingPlanSlotRepository.updatePaymentForUserLockedSlots(
                    user.getUserID(), plan.getTutorID(), payment.getPaymentID()
            );

            amount = totalAmount;
        } else {
            throw new AppException(ErrorCode.INVALID_PAYMENT_TYPE);
        }

        var wrapper = payOSService.createPaymentLink(
                payment.getPaymentID(),
                request.getUserId(),
                request.getPaymentType(),
                request.getTargetId(),
                payment.getAmount(),
                description
        );

        CheckoutResponseData data = wrapper.data();
        LocalDateTime expiredAt = (wrapper.expiredAt() != null)
                ? wrapper.expiredAt()
                : payment.getExpiresAt();

        updatePaymentWithPayOSData(payment, data, expiredAt);

        return ResponseEntity.ok(Map.of(
                "checkoutUrl", data.getCheckoutUrl(),
                "expiresAt", expiredAt
        ));
    }

    // ======================================================
    // CẬP NHẬT PAYMENT SAU KHI TẠO LINK PAYOS
    // ======================================================
    private void updatePaymentWithPayOSData(
            Payment payment,
            CheckoutResponseData data,
            LocalDateTime expiredAt
    ) {
        try {
            if (data == null) return;

            payment.setOrderCode(String.valueOf(data.getOrderCode()));
            payment.setCheckoutUrl(data.getCheckoutUrl());
            payment.setQrCodeUrl(data.getQrCode());
            payment.setPaymentLinkId(data.getPaymentLinkId());
            payment.setExpiresAt(expiredAt);

            paymentRepository.save(payment);

            log.info("[PAYMENT UPDATED] Payment {} updated with PayOS link + expiredAt",
                    payment.getPaymentID());

        } catch (Exception e) {
            log.error("Failed to update payment info from PayOS: {}", e.getMessage());
        }
    }

    // ======================================================
    // SNAPSHOT COMMISSION KHI PAYMENT PAID
    // ======================================================
    private void applyCommissionSnapshot(Payment payment) {
        // Nếu đã có snapshot rồi thì không làm lại (phòng trường hợp gọi processPostPayment nhiều lần)
        if (payment.getNetAmount() != null) {
            return;
        }

        Setting setting = settingRepository.getCurrentSetting();
        BigDecimal rate = BigDecimal.ZERO;

        if (payment.getPaymentType() == PaymentType.Course) {
            rate = setting.getCommissionCourse();
        } else if (payment.getPaymentType() == PaymentType.Booking) {
            rate = setting.getCommissionBooking();
        }

        payment.setCommissionRate(rate);

        BigDecimal commissionAmount = payment.getAmount().multiply(rate);
        payment.setCommissionAmount(commissionAmount);

        BigDecimal net = payment.getAmount().subtract(commissionAmount);
        payment.setNetAmount(net);
    }

    // ======================================================
    // HẬU THANH TOÁN (PAYMENT SUCCESS)
    // ======================================================
    @Transactional
    public void processPostPayment(Payment payment) {
        if (payment.getStatus() != PaymentStatus.PAID) return;

        payment.setIsPaid(true);
        payment.setPaidAt(LocalDateTime.now());

        // 🔹 Snapshot commission tại thời điểm thanh toán
        applyCommissionSnapshot(payment);

        paymentRepository.save(payment);

        Long userId = payment.getUserId();
        Long targetId = payment.getTargetId();

        // ----------------- COURSE PAYMENT -----------------
        if (payment.getPaymentType() == PaymentType.Course) {

            Course course = courseRepository.findById(targetId)
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

            Enrollment enrollment = Enrollment.builder()
                    .user(user)
                    .course(course)
                    .status(EnrollmentStatus.Active)
                    .createdAt(LocalDateTime.now())
                    .build();

            enrollmentRepository.save(enrollment);

            Tutor tutor = course.getTutor();
            payment.setEnrollment(enrollment);
            payment.setTutorId(tutor.getTutorID());
            paymentRepository.save(payment);

            // Cập nhật số dư ví (tính theo thuật toán mới – dùng snapshot netAmount)
            BigDecimal newBalance = withdrawService.calculateCurrentBalance(tutor.getTutorID());
            tutor.setWalletBalance(newBalance);
            tutorRepository.save(tutor);

            log.info("[WALLET] Updated wallet_balance for tutor {} = {} after COURSE payment",
                    tutor.getTutorID(), tutor.getWalletBalance());

            log.info("[COURSE PAYMENT] User {} enrolled in course '{}'",
                    userId, course.getTitle());
        }

        // ----------------- BOOKING PAYMENT -----------------
        else if (payment.getPaymentType() == PaymentType.Booking) {

            List<BookingPlanSlot> slots = bookingPlanSlotRepository.findAllByPaymentID(payment.getPaymentID());

            for (BookingPlanSlot s : slots) {
                s.setStatus(SlotStatus.Paid);
                bookingPlanSlotRepository.save(s);
            }

            Tutor tutor = null;

            if (!slots.isEmpty()) {
                Long tutorID = slots.get(0).getTutorID();
                payment.setTutorId(tutorID);
                paymentRepository.save(payment);

                tutor = tutorRepository.findById(tutorID)
                        .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

                try {
                    chatService.ensureTrainingRoomExists(userId, tutorID);
                    log.info("[CHAT ROOM] Created for User {} & Tutor {}", userId, tutorID);
                } catch (Exception e) {
                    log.warn("[CHAT ROOM] Failed: {}", e.getMessage());
                }
            }

            // ❗ KHÔNG cộng ví tutor ở đây.
            // Chỉ khi cả tutorJoin & learnerJoin = true (ở BookingAttendanceService + WithdrawService)
            log.info("[BOOKING PAYMENT] User {} confirmed {} slots",
                    userId, slots.size());
        }
    }

    // ======================================================
    // USER CANCEL PAYMENT (FROM /api/payments/cancel)
    // ======================================================
    @Transactional
    public Payment handleUserCancelPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        // Nếu đã PAID thì không cho đổi trạng thái, chỉ log
        if (payment.getStatus() == PaymentStatus.PAID) {
            log.warn("[CANCEL] User tried to cancel PAID payment {}", paymentId);
            return payment;
        }

        // Idempotent: nếu đã CANCELLED rồi thì trả về luôn
        if (payment.getStatus() == PaymentStatus.CANCELLED) {
            log.info("[CANCEL] Payment {} already CANCELLED → ignore", paymentId);
            return payment;
        }

        payment.setStatus(PaymentStatus.CANCELLED);
        payment.setIsPaid(false);
        payment.setPaidAt(null);
        paymentRepository.save(payment);

        // Nếu là booking thì rollback slot đã lock
        if (payment.getPaymentType() == PaymentType.Booking) {
            rollbackBookingSlots(payment, "USER_CANCEL");
        }

        // Hủy link PayOS nếu còn
        if (payment.getPaymentLinkId() != null) {
            try {
                payOSService.cancelPaymentLink(payment.getPaymentLinkId());
            } catch (Exception e) {
                log.error("[CANCEL] Failed to cancel PayOS link {}: {}",
                        payment.getPaymentLinkId(), e.getMessage());
            }
        }

        log.info("[CANCEL] Payment {} set to CANCELLED by user", paymentId);
        return payment;
    }

    // ======================================================
    // ROLLBACK SLOT BOOKING (DÙNG CHUNG CHO CANCEL / FAILED ...)
    // ======================================================
    void rollbackBookingSlots(Payment payment, String reason) {
        if (payment.getPaymentType() != PaymentType.Booking) return;

        List<BookingPlanSlot> slots =
                bookingPlanSlotRepository.findAllByPaymentID(payment.getPaymentID());

        long deletedCount = 0;
        for (BookingPlanSlot slot : slots) {
            if (slot.getStatus() == SlotStatus.Locked) {
                bookingPlanSlotRepository.delete(slot);
                deletedCount++;

                log.warn("[ROLLBACK] Deleted slot {} ({} - {}) due to {}",
                        slot.getSlotID(), slot.getStartTime(), slot.getEndTime(), reason);
            }
        }

        log.warn("[ROLLBACK] Payment {} marked {}. Slots removed={}",
                payment.getOrderCode(), reason, deletedCount);
    }

    // ======================================================
    // LẤY PAYMENT (ADMIN / TUTOR / USER)
    // ======================================================
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByTutor(Long tutorId) {
        return paymentRepository.findAllByTutorId(tutorId)
                .stream().map(paymentMapper::toPaymentResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByUser(Long userId) {
        return paymentRepository.findAllByUserId(userId)
                .stream().map(paymentMapper::toPaymentResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAll()
                .stream().map(paymentMapper::toPaymentResponse).toList();
    }

    // ======================================================
    // LẤY PAYMENT THEO ROLE HIỆN TẠI (/me)
    // ======================================================
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsForMe(Long userId, String roleClaim) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        String roleName = (roleClaim != null && !roleClaim.isBlank())
                ? roleClaim
                : (user.getRole() != null ? user.getRole().getName() : null);

        if (roleName == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        String roleLower = roleName.toLowerCase();

        if (roleLower.contains("tutor")) {
            Tutor tutor = tutorRepository.findByUser_UserID(user.getUserID())
                    .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));
            return getPaymentsByTutor(tutor.getTutorID());
        }

        if (roleLower.contains("learner") || roleLower.contains("student")) {
            return getPaymentsByUser(user.getUserID());
        }

        if (roleLower.contains("admin")) {
            return getAllPayments();
        }

        throw new AppException(ErrorCode.UNAUTHORIZED);
    }
}
