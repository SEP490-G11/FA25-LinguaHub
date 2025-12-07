package edu.lms.entity;

import edu.lms.enums.RefundStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "refund_requests")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefundRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long refundRequestId;

    @Column(nullable = false)
    Long bookingPlanId;

    @Column(nullable = false)
    Long slotId;

    @Column(nullable = false)
    Long userId;

    @Column(nullable = true)
    Long packageId; // nếu slot thuộc package

    @Column(nullable = false, precision = 15, scale = 2)
    BigDecimal refundAmount;

    // thông tin ngân hàng learner nhập
    @Column(nullable = true, length = 100)
    String bankAccountNumber;

    @Column(nullable = true, length = 100)
    String bankOwnerName;

    @Column(nullable = true, length = 100)
    String bankName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    RefundStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    Tutor tutor;

    @Builder.Default
    @Column(nullable = false)
    LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = true)
    LocalDateTime processedAt; // admin duyệt hoặc reject
}
