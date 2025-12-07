package edu.lms.entity;

import edu.lms.enums.PaymentMethod;
import edu.lms.enums.PaymentStatus;
import edu.lms.enums.PaymentType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "Payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long paymentID;

    //Số tiền thanh toán
    @Column(precision = 12, scale = 2, nullable = false)
    BigDecimal amount;

    //Loại thanh toán: COURSE / BOOKING
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    PaymentType paymentType;

    //Phương thức thanh toán: PAYOS / VNPAY / BANK
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    PaymentMethod paymentMethod;

    //Mã đơn hàng (unique từ PayOS)
    @Column(unique = true, length = 150)
    String orderCode;

    //ID của payment link PayOS
    @Column(length = 150)
    String paymentLinkId;

    //URL checkout của PayOS/VNPAY
    @Column(length = 500)
    String checkoutUrl;

    //QR code link (PayOS trả về)
    @Column(length = 500)
    String qrCodeUrl;

    //Trạng thái thanh toán: PENDING / SUCCESS / FAILED / EXPIRED / CANCELLED
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    PaymentStatus status;

    //Thời gian thanh toán thành công
    LocalDateTime paidAt;

    //Phản hồi trả về từ cổng thanh toán (raw JSON)
    @Lob
    String transactionResponse;

    //Liên kết mục tiêu (CourseID hoặc BookingPlanID)
    @Column(name = "target_id")
    Long targetId;

    // Người mua (Learner)
    @Column(name = "user_id")
    Long userId;

    // Tutor nhận tiền (Course owner / Booking owner)
    @Column(name = "tutor_id")
    Long tutorId;

    // Liên kết enrollment (nếu thanh toán cho khóa học)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id")
    Enrollment enrollment;

    //Người nhận tiền trong hệ thống (dự phòng payout/refund nội bộ)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_id")
    User received;


    //Cờ trạng thái
    @Builder.Default
    Boolean isPaid = false;

    @Builder.Default
    Boolean isRefund = false;

    //Thời gian tạo bản ghi
    @Column(updatable = false)
    LocalDateTime createdAt;

    @Column(nullable = false)
    LocalDateTime expiresAt;

    String returnUrl;

    String cancelUrl;
    // Payment.java

    @Column(precision = 5, scale = 4)
    BigDecimal commissionRate;

    @Column(precision = 12, scale = 2)
    BigDecimal commissionAmount;

    @Column(precision = 12, scale = 2)
    BigDecimal netAmount;


    // ==========================================
    // Lifecycle Hooks
    // ==========================================
    @PrePersist
    void prePersist() {
        if (createdAt == null)
            createdAt = LocalDateTime.now();
        if (expiresAt == null)
            expiresAt = createdAt.plusMinutes(15);
    }
}
