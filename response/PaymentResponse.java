package edu.lms.dto.response;

import edu.lms.enums.PaymentMethod;
import edu.lms.enums.PaymentStatus;
import edu.lms.enums.PaymentType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payment response DTO used for displaying payment information")
public class PaymentResponse {

    @Schema(description = "Unique payment ID", example = "101")
    Long paymentID;

    @Schema(description = "User (learner) who made the payment", example = "5")
    Long userId;

    @Schema(description = "Tutor who receives the payment", example = "2")
    Long tutorId;

    @Schema(description = "Target ID (CourseID or BookingPlanID)", example = "8")
    Long targetId;

    @Schema(description = "Payment type (Course or Booking)", example = "Course")
    PaymentType paymentType;

    @Schema(description = "Payment method (PAYOS / VNPAY / BANK)", example = "PAYOS")
    PaymentMethod paymentMethod;

    @Schema(description = "Current status of the payment", example = "PAID")
    PaymentStatus status;

    @Schema(description = "Amount paid", example = "500000.00")
    BigDecimal amount;

    @Schema(description = "Whether the payment has been completed", example = "true")
    Boolean isPaid;

    @Schema(description = "Whether the payment was refunded", example = "false")
    Boolean isRefund;

    @Schema(description = "Payment order code (unique from PayOS/VNPAY)", example = "ORD-2025-0001")
    String orderCode;

    @Schema(description = "Link ID provided by PayOS", example = "link-1283df93")
    String paymentLinkId;

    @Schema(description = "Checkout URL for completing payment", example = "https://payos.vn/checkout/ORD-2025-0001")
    String checkoutUrl;

    @Schema(description = "QR Code URL", example = "https://payos.vn/qr/ORD-2025-0001.png")
    String qrCodeUrl;

    @Schema(description = "Timestamp when payment was created", example = "2025-11-10T10:00:00")
    LocalDateTime createdAt;

    @Schema(description = "Timestamp when payment was successfully completed", example = "2025-11-10T10:10:00")
    LocalDateTime paidAt;

    @Schema(description = "Short readable description for frontend", example = "Payment for Course 'English for Beginners'")
    String description;

    private LocalDateTime expiresAt;
}
