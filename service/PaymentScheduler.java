package edu.lms.service;

import edu.lms.entity.Payment;
import edu.lms.enums.PaymentStatus;
import edu.lms.enums.PaymentType;
import edu.lms.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentScheduler {

    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService; // dùng rollbackBookingSlots chung

    /**
     * 🕒 Kiểm tra mỗi 1 phút để tự động hết hạn payment PENDING quá thời gian expiresAt
     */
    @Scheduled(fixedRate = 60000) // 1 phút
    public void expireOldPayments() {
        List<Payment> expiredPayments = paymentRepository.findAllByStatusAndExpiresAtBefore(
                PaymentStatus.PENDING,
                LocalDateTime.now()
        );

        if (expiredPayments.isEmpty()) return;

        for (Payment p : expiredPayments) {
            p.setStatus(PaymentStatus.EXPIRED);
            p.setIsPaid(false);
            paymentRepository.save(p);

            // Nếu là Booking → rollback luôn slot bị khóa
            if (p.getPaymentType() == PaymentType.Booking) {
                paymentService.rollbackBookingSlots(p, "EXPIRED");
            }

            log.warn("[AUTO-EXPIRE] Payment {} (id={}) expired at {} → marked EXPIRED",
                    p.getOrderCode(), p.getPaymentID(), p.getExpiresAt());
        }

        log.info("Auto-expired {} payments", expiredPayments.size());
    }
}
