package edu.lms.service;

import edu.lms.entity.BookingPlanSlot;
import edu.lms.enums.PaymentStatus;
import edu.lms.enums.PaymentType;
import edu.lms.enums.SlotStatus;
import edu.lms.repository.BookingPlanSlotRepository;
import edu.lms.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentWebhookService {

    private final PaymentRepository paymentRepository;
    private final BookingPlanSlotRepository bookingPlanSlotRepository;
    private final PaymentService paymentService;
    private final PayOSService payOSService;

    /**
     * Handle webhook callback from PayOS
     * code = "00" -> PAID
     * code != "00" -> FAILED
     */
    public void handleWebhook(String orderCode, String code, Map<String, Object> payload) {
        log.info("Handling webhook | orderCode={} | code={} | payload={}", orderCode, code, payload);

        paymentRepository.findByOrderCode(orderCode).ifPresentOrElse(payment -> {
            try {
                boolean isPaid = "00".equals(code);

                // ===== LOG trạng thái trước khi xử lý =====
                log.info("[PAYOS WEBHOOK][BEFORE] paymentId={} | status={} | isPaid={} | type={} | userId={} | tutorId={} | targetId={}",
                        payment.getPaymentID(),
                        payment.getStatus(),
                        payment.getIsPaid(),
                        payment.getPaymentType(),
                        payment.getUserId(),
                        payment.getTutorId(),
                        payment.getTargetId()
                );

                // ===================================================
                // PAYMENT ĐÃ BỊ CANCELLED TỪ TRƯỚC → BLOCK PAID
                // ===================================================
                if (payment.getStatus() == PaymentStatus.CANCELLED) {

                    log.warn("[BLOCK] Payment {} was CANCELLED earlier → ignoring webhook (code={})",
                            payment.getPaymentID(), code);

                    // Hủy link PayOS nếu vẫn tồn tại
                    if (payment.getPaymentLinkId() != null) {
                        try {
                            payOSService.cancelPaymentLink(payment.getPaymentLinkId());
                        } catch (Exception ex) {
                            log.error("[BLOCK] Cannot cancel PayOS link {}", payment.getPaymentLinkId(), ex);
                        }
                    }

                    payment.setIsPaid(false);
                    payment.setPaidAt(null);

                    if (payload != null)
                        payment.setTransactionResponse(payload.toString());

                    paymentRepository.save(payment);

                    log.info("[PAYOS WEBHOOK][AFTER BLOCK] paymentId={} | status={} | isPaid={} | paidAt={}",
                            payment.getPaymentID(), payment.getStatus(), payment.getIsPaid(), payment.getPaidAt());

                    return;
                }

                boolean hasRejectedSlot = false;
                List<BookingPlanSlot> slots = null;

                if (payment.getPaymentType() == PaymentType.Booking) {
                    slots = bookingPlanSlotRepository.findAllByPaymentID(payment.getPaymentID());

                    if (slots == null || slots.isEmpty()) {
                        log.warn("No slots found for booking payment {}", payment.getPaymentID());
                    } else {
                        hasRejectedSlot = slots.stream()
                                .anyMatch(s -> s.getStatus() == SlotStatus.Rejected);
                    }
                }

                // ===================================================
                // SLOT ĐÃ BỊ REJECT → FORCE CANCEL PAYMENT
                // ===================================================
                if (hasRejectedSlot) {

                    log.warn("[FORCE CANCEL] Payment {} contains REJECTED slot → CANCEL payment",
                            payment.getPaymentID());

                    // Hủy link PayOS
                    if (payment.getPaymentLinkId() != null) {
                        try {
                            payOSService.cancelPaymentLink(payment.getPaymentLinkId());
                        } catch (Exception ex) {
                            log.error("[FORCE CANCEL] Cannot cancel PayOS link {}", payment.getPaymentLinkId(), ex);
                        }
                    }

                    payment.setStatus(PaymentStatus.CANCELLED);
                    payment.setIsPaid(false);
                    payment.setPaidAt(null);

                    if (payload != null)
                        payment.setTransactionResponse(payload.toString());

                    paymentRepository.save(payment);

                    log.info("[PAYOS WEBHOOK][AFTER FORCE CANCEL] paymentId={} | status={} | isPaid={} | paidAt={}",
                            payment.getPaymentID(), payment.getStatus(), payment.getIsPaid(), payment.getPaidAt());

                    return;
                }

                // ===================================================
                // PAYMENT SUCCESS (VALID)
                // ===================================================
                if (isPaid) {

                    payment.setStatus(PaymentStatus.PAID);
                    payment.setIsPaid(true);
                    payment.setPaidAt(LocalDateTime.now());
                    paymentRepository.save(payment);

                    log.info("[PAYOS] Payment {} marked as PAID (code={})", orderCode, code);

                    // Save webhook payload
                    if (payload != null)
                        payment.setTransactionResponse(payload.toString());

                    paymentRepository.save(payment);

                    log.info("[PAYOS WEBHOOK][AFTER PAID] paymentId={} | status={} | isPaid={} | paidAt={}",
                            payment.getPaymentID(), payment.getStatus(), payment.getIsPaid(), payment.getPaidAt());

                    paymentService.processPostPayment(payment);

                } else {

                    // ===================================================
                    // PAYMENT FAILED
                    // ===================================================
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setIsPaid(false);
                    paymentRepository.save(payment);

                    log.warn("[PAYOS] Payment {} FAILED (code={}) → rollback slots", orderCode, code);

                    // Dùng hàm rollback chung trong PaymentService
                    paymentService.rollbackBookingSlots(payment, "FAILED");

                    if (payload != null)
                        payment.setTransactionResponse(payload.toString());

                    paymentRepository.save(payment);

                    log.info("[PAYOS WEBHOOK][AFTER FAILED] paymentId={} | status={} | isPaid={} | paidAt={}",
                            payment.getPaymentID(), payment.getStatus(), payment.getIsPaid(), payment.getPaidAt());
                }

            } catch (Exception e) {
                log.error("Webhook error for {}: {}", orderCode, e.getMessage(), e);
            }

        }, () -> log.warn("Payment not found for orderCode={}", orderCode));
    }
}
